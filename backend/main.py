# backend/main.py — Jade AI FastAPI backend
import os, json, logging
from datetime import datetime, timedelta
from typing import Any

import anthropic
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from google.oauth2 import service_account
from googleapiclient.discovery import build
from supabase import create_client, Client
import pytz

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jade")

# ── Config ─────────────────────────────────────────────────────────────────
SUPABASE_URL              = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_API_KEY         = os.environ["ANTHROPIC_API_KEY"]
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]
GOOGLE_CALENDAR_ID        = os.environ.get("GOOGLE_CALENDAR_ID", "linhgiang.tran14@gmail.com")
SALON_ID                  = os.environ.get("SALON_ID", "aa567339-4580-43ff-abb1-87b02359834e")
SALON_TZ                  = os.environ.get("SALON_TZ", "America/Chicago")
APP_ENV                   = os.environ.get("APP_ENV", "development")

# ── Clients ────────────────────────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def get_calendar_service():
    info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/calendar"]
    )
    return build("calendar", "v3", credentials=creds, cache_discovery=False)

# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="Jade AI Backend")

@app.get("/health")
def health():
    return {"status": "ok", "env": APP_ENV}

# ── Helpers ─────────────────────────────────────────────────────────────────

def get_salon_services() -> list[dict]:
    res = supabase.table("services").select("name, duration_minutes, price") \
        .eq("salon_id", SALON_ID).execute()
    return res.data or []

def get_available_slots(date_str: str) -> list[str]:
    """Return available time slots for a given date (YYYY-MM-DD)."""
    tz = pytz.timezone(SALON_TZ)
    day = datetime.strptime(date_str, "%Y-%m-%d")

    # Fetch existing bookings for that day
    start = tz.localize(day.replace(hour=0, minute=0)).isoformat()
    end   = tz.localize(day.replace(hour=23, minute=59)).isoformat()
    res = supabase.table("bookings").select("start_time, end_time") \
        .eq("salon_id", SALON_ID).neq("status", "cancelled") \
        .gte("start_time", start).lte("start_time", end).execute()

    booked = [(b["start_time"], b["end_time"]) for b in (res.data or [])]

    # Generate 30-min slots from 9am to 7pm
    slots = []
    for h in range(9, 19):
        for m in (0, 30):
            slot = tz.localize(day.replace(hour=h, minute=m))
            slot_end = slot + timedelta(minutes=30)
            conflict = any(
                slot.isoformat() < be and slot_end.isoformat() > bs
                for bs, be in booked
            )
            if not conflict:
                slots.append(slot.strftime("%I:%M %p"))
    return slots

def create_calendar_event(
    client_name: str, service: str, technician: str,
    start_iso: str, end_iso: str
) -> str | None:
    try:
        cal = get_calendar_service()
        event = cal.events().insert(
            calendarId=GOOGLE_CALENDAR_ID,
            body={
                "summary": f"{client_name} — {service}",
                "description": f"Technician: {technician}\nBooked via Jade AI",
                "start": {"dateTime": start_iso, "timeZone": SALON_TZ},
                "end":   {"dateTime": end_iso,   "timeZone": SALON_TZ},
            }
        ).execute()
        return event.get("id")
    except Exception as e:
        log.error(f"Calendar error: {e}")
        return None

def save_booking(
    client_name: str, client_phone: str, service: str,
    technician: str, start_iso: str, end_iso: str,
    calendar_event_id: str | None, call_id: str | None
) -> dict:
    row = {
        "salon_id":          SALON_ID,
        "call_id":           call_id,
        "client_name":       client_name,
        "client_phone":      client_phone,
        "service":           service,
        "start_time":        start_iso,
        "end_time":          end_iso,
        "technician_name":   technician,
        "calendar_event_id": calendar_event_id,
        "status":            "confirmed",
    }
    res = supabase.table("bookings").insert(row).execute()
    return res.data[0] if res.data else row

def save_missed_call(caller_phone: str, reason: str, transcript: str, call_id: str | None):
    supabase.table("missed_calls").insert({
        "salon_id":     SALON_ID,
        "call_id":      call_id,
        "caller_phone": caller_phone,
        "reason":       reason,
        "transcript":   transcript[:2000] if transcript else "",
        "status":       "new",
    }).execute()

# ── System prompt ────────────────────────────────────────────────────────────

def build_system_prompt(services: list[dict]) -> str:
    svc_list = "\n".join(
        f"- {s['name']} ({s['duration_minutes']} min, ${s['price']})"
        for s in services
    ) or "- Gel manicure (45 min, $45)\n- Pedicure (60 min, $50)"

    return f"""You are Jade, a friendly AI receptionist for a nail salon. Your job is to book appointments over the phone.

SERVICES OFFERED:
{svc_list}

HOURS: Monday–Saturday 9am–7pm, closed Sunday (America/Chicago timezone)

YOUR GOAL: Collect name, service, and date/time. Technician always defaults to "any".

CRITICAL RULES:
- Ask for ALL missing info in ONE question. Never ask one thing at a time.
- If the caller gives name + service + time: DO NOT ask for confirmation. Book it immediately.
- State the booking details and output BOOKING_COMPLETE in the same response.
- If a service name is unclear, pick the closest match from your list.
- Keep responses under 2 sentences.
- If info is missing: "Could I get your [missing items]?"

WHEN YOU HAVE NAME + SERVICE + DATE/TIME:
Say: "Perfect [name], I've booked your [service] for [date] at [time]!"
Then on the next line output EXACTLY:
BOOKING_COMPLETE:{{"client_name":"...","service":"...","date":"YYYY-MM-DD","time":"HH:MM","technician":"any"}}

If caller wants to cancel or is confused:
MISSED_CALL:{{"reason":"..."}}

NEVER ask "is that correct?" or "can you confirm?" — just book it."""

# ── Vapi chat endpoint (custom LLM) ──────────────────────────────────────────

@app.post("/vapi/chat/chat/completions")
async def vapi_chat(request: Request):
    """Vapi calls this as a custom LLM endpoint."""
    body = await request.json()
    messages = body.get("messages", [])
    call_id  = body.get("call", {}).get("id")
    log.info(f"Vapi chat — call:{call_id} messages:{json.dumps(messages[-2:])}")

    # Load services for the prompt
    services = get_salon_services()
    system   = build_system_prompt(services)

    # Convert Vapi message format to Anthropic format
    anthropic_messages = []
    for m in messages:
        role = m.get("role", "user")
        if role == "system":
            continue  # handled via system param
        if role in ("user", "assistant"):
            anthropic_messages.append({"role": role, "content": m.get("content", "")})

    if not anthropic_messages:
        anthropic_messages = [{"role": "user", "content": "Hello"}]

    try:
        response = claude.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=500,
            system=system,
            messages=anthropic_messages,
        )
        text = response.content[0].text
        log.info(f"Claude response: {text}")
    except Exception as e:
        log.error(f"Claude error: {e}")
        text = "I'm sorry, I'm having a technical issue. Please call back in a moment."

    # ── Parse booking completion ────────────────────────────────────────────
    if "BOOKING_COMPLETE:" in text:
        try:
            json_str = text.split("BOOKING_COMPLETE:")[1].split("\n")[0].strip()
            data = json.loads(json_str)

            tz = pytz.timezone(SALON_TZ)
            # Parse date + time
            dt_str = f"{data['date']} {data['time']}"
            dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            start_dt = tz.localize(dt)

            # Find service duration
            svc_name = data["service"]
            duration = 60  # default
            for s in services:
                if s["name"].lower() in svc_name.lower():
                    duration = s["duration_minutes"]
                    break
            end_dt = start_dt + timedelta(minutes=duration)

            # Get caller phone from call metadata
            caller_phone = body.get("call", {}).get("customer", {}).get("number", "unknown")

            # Create calendar event
            cal_id = create_calendar_event(
                client_name=data["client_name"],
                service=svc_name,
                technician=data.get("technician", "any"),
                start_iso=start_dt.isoformat(),
                end_iso=end_dt.isoformat(),
            )

            # Save to Supabase
            save_booking(
                client_name=data["client_name"],
                client_phone=caller_phone,
                service=svc_name,
                technician=data.get("technician", "any"),
                start_iso=start_dt.isoformat(),
                end_iso=end_dt.isoformat(),
                calendar_event_id=cal_id,
                call_id=call_id,
            )

            log.info(f"Booking saved: {data['client_name']} — {svc_name} at {dt_str}")

            # Strip the JSON from the spoken response
            text = text.split("BOOKING_COMPLETE:")[0].strip()

        except Exception as e:
            log.error(f"Booking parse error: {e}")

    elif "MISSED_CALL:" in text:
        try:
            json_str = text.split("MISSED_CALL:")[1].split("\n")[0].strip()
            data = json.loads(json_str)
            caller_phone = body.get("call", {}).get("customer", {}).get("number", "unknown")
            full_transcript = "\n".join(
                f"{m['role']}: {m.get('content','')}" for m in messages
            )
            save_missed_call(
                caller_phone=caller_phone,
                reason=data.get("reason", "unknown"),
                transcript=full_transcript,
                call_id=call_id,
            )
            text = text.split("MISSED_CALL:")[0].strip()
        except Exception as e:
            log.error(f"Missed call parse error: {e}")

    # Return in OpenAI-compatible format (what Vapi expects from custom LLM)
    return JSONResponse({
        "id": "jade-response",
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": text},
            "finish_reason": "stop",
        }],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    })

# ── Vapi webhook (call events) ────────────────────────────────────────────────

@app.post("/vapi/webhook")
async def vapi_webhook(request: Request):
    """Receives call lifecycle events from Vapi."""
    body = await request.json()
    event_type = body.get("message", {}).get("type", "")
    log.info(f"Vapi webhook: {event_type}")

    if event_type == "end-of-call-report":
        msg      = body["message"]
        call     = msg.get("call", {})
        call_id  = call.get("id")
        phone    = call.get("customer", {}).get("number", "unknown")
        reason   = msg.get("endedReason", "unknown")
        transcript = msg.get("transcript", "")

        # If call ended without a booking, log as missed
        if reason not in ("assistant-ended-call",) and call_id:
            # Check if booking already saved for this call
            existing = supabase.table("bookings").select("id") \
                .eq("call_id", call_id).execute()
            if not existing.data:
                save_missed_call(
                    caller_phone=phone,
                    reason=f"Call ended: {reason}",
                    transcript=transcript,
                    call_id=call_id,
                )

    return {"status": "ok"}