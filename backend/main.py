# backend/main.py — Jade AI FastAPI backend
import os, json, logging
from datetime import datetime, timedelta

import anthropic
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from google.oauth2 import service_account
from googleapiclient.discovery import build
from supabase import create_client, Client
import pytz

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jade")

# ── Config ─────────────────────────────────────────────────────────────────
SUPABASE_URL                = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_API_KEY           = os.environ["ANTHROPIC_API_KEY"]
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]
GOOGLE_CALENDAR_ID          = os.environ.get("GOOGLE_CALENDAR_ID", "linhgiang.tran14@gmail.com")
SALON_ID                    = os.environ.get("SALON_ID", "aa567339-4580-43ff-abb1-87b02359834e")
SALON_TZ                    = os.environ.get("SALON_TZ", "America/Chicago")
APP_ENV                     = os.environ.get("APP_ENV", "development")

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

def is_slot_available(start_dt: datetime, end_dt: datetime) -> bool:
    """Check if a time slot conflicts with existing confirmed/pending bookings."""
    tz = pytz.timezone(SALON_TZ)
    start_iso = start_dt.isoformat()
    end_iso   = end_dt.isoformat()

    res = supabase.table("bookings").select("start_time, end_time") \
        .eq("salon_id", SALON_ID) \
        .in_("status", ["confirmed", "pending"]) \
        .lt("start_time", end_iso) \
        .gt("end_time", start_iso) \
        .execute()

    return len(res.data or []) == 0

def create_calendar_event(
    client_name: str, service: str, technician: str,
    start_iso: str, end_iso: str
) -> str | None:
    try:
        log.info(f"Creating calendar event: {client_name} — {service} at {start_iso}")
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
        event_id = event.get("id")
        log.info(f"Calendar event created: {event_id}")
        return event_id
    except Exception as e:
        log.error(f"Calendar error: {e}")
        return None

def save_booking(
    client_name: str, client_phone: str, service: str,
    technician: str, start_iso: str, end_iso: str,
    calendar_event_id: str | None, call_id: str | None,
    status: str = "confirmed", requested_time: str | None = None
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
        "status":            status,
        "requested_time":    requested_time,
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
    tz = pytz.timezone(SALON_TZ)
    today = datetime.now(tz)
    today_str = today.strftime("%A, %B %d, %Y")  # e.g. "Thursday, June 11, 2026"
    svc_list = "\n".join(
        f"- {s['name']} ({s['duration_minutes']} min, ${s['price']})"
        for s in services
    ) or "- Gel manicure (45 min, $45)\n- Pedicure (60 min, $50)"

    return f"""You are Jade, a friendly AI receptionist for a nail salon. Your job is to book appointments over the phone.

TODAY'S DATE: {today_str} — use this when interpreting "today", "tomorrow", "next week", etc.

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
First say the confirmation out loud: "Perfect [name], I have booked your [service] for [date] at [time]. We will see you then!"
The spoken text MUST come before the JSON — always.
Then on the NEXT LINE output EXACTLY:
BOOKING_COMPLETE:{{"client_name":"...","service":"...","date":"YYYY-MM-DD","time":"HH:MM","technician":"any"}}

NOTE: The system will check if the slot is available. If it's not, it will override your response and tell the caller the slot is taken. You don't need to check availability yourself — just book it.

If caller wants to cancel or is confused:
MISSED_CALL:{{"reason":"..."}}

NEVER ask "is that correct?" or "can you confirm?" — just book it."""

# ── Vapi chat endpoint ────────────────────────────────────────────────────────

@app.post("/vapi/chat/chat/completions")
async def vapi_chat(request: Request):
    body     = await request.json()
    messages = body.get("messages", [])
    call_id  = body.get("call", {}).get("id")
    log.info(f"Vapi chat — call:{call_id} msg_count:{len(messages)} last:{json.dumps(messages[-1:])}")

    services = get_salon_services()
    system   = build_system_prompt(services)
    log.info(f"System prompt date injection check: {system[:200]}")

    anthropic_messages = []
    for m in messages:
        role = m.get("role", "user")
        if role == "system":
            continue
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
    end_call = False
    if "BOOKING_COMPLETE:" in text:
        try:
            json_str = text.split("BOOKING_COMPLETE:")[1].split("\n")[0].strip()
            data = json.loads(json_str)

            tz     = pytz.timezone(SALON_TZ)
            dt_str = f"{data['date']} {data['time']}"
            dt     = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            start_dt = tz.localize(dt)

            svc_name = data["service"]
            duration = 60
            for s in services:
                if s["name"].lower() in svc_name.lower():
                    duration = s["duration_minutes"]
                    break
            end_dt = start_dt + timedelta(minutes=duration)

            caller_phone = body.get("call", {}).get("customer", {}).get("number", "unknown")

            # ── Slot availability check ──────────────────────────────────
            if is_slot_available(start_dt, end_dt):
                # Slot is free — book it
                cal_id = create_calendar_event(
                    client_name=data["client_name"],
                    service=svc_name,
                    technician=data.get("technician", "any"),
                    start_iso=start_dt.isoformat(),
                    end_iso=end_dt.isoformat(),
                )
                save_booking(
                    client_name=data["client_name"],
                    client_phone=caller_phone,
                    service=svc_name,
                    technician=data.get("technician", "any"),
                    start_iso=start_dt.isoformat(),
                    end_iso=end_dt.isoformat(),
                    calendar_event_id=cal_id,
                    call_id=call_id,
                    status="confirmed",
                )
                log.info(f"Booking confirmed: {data['client_name']} — {svc_name} at {dt_str}")
                end_call = True
                spoken = text.split("BOOKING_COMPLETE:")[0].strip()
                # Always ensure a clear confirmation is spoken
                if not spoken:
                    spoken = f"Perfect {data['client_name']}, I have booked your {svc_name} for {start_dt.strftime('%A, %B %d')} at {start_dt.strftime('%I:%M %p')}. We will see you then!"
                text = spoken

            else:
                # Slot is taken — save as pending_owner request
                save_booking(
                    client_name=data["client_name"],
                    client_phone=caller_phone,
                    service=svc_name,
                    technician=data.get("technician", "any"),
                    start_iso=start_dt.isoformat(),
                    end_iso=end_dt.isoformat(),
                    calendar_event_id=None,
                    call_id=call_id,
                    status="pending_owner",
                    requested_time=dt_str,
                )
                log.info(f"Slot taken — pending_owner: {data['client_name']} — {svc_name} at {dt_str}")
                # Override spoken response
                end_call = True
                text = f"I'm sorry {data['client_name']}, that time is already taken. I've noted your request and the salon will call you back to find a new time. Thank you!"

        except Exception as e:
            import traceback
            log.error(f"Booking parse error: {e}\n{traceback.format_exc()}")

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

    log.info(f"Sending to Vapi TTS: {repr(text)}, end_call={end_call}")

    # Vapi requires SSE streaming for custom LLM — plain JSON stays silent
    import time
    from fastapi.responses import StreamingResponse

    def stream():
        # Send text as a single SSE chunk
        chunk = {
            "id": "jade-response",
            "object": "chat.completion.chunk",
            "choices": [{
                "index": 0,
                "delta": {"role": "assistant", "content": text},
                "finish_reason": None,
            }],
        }
        yield f"data: {json.dumps(chunk)}\n\n"

        # Send final chunk with finish_reason
        final = {
            "id": "jade-response",
            "object": "chat.completion.chunk",
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop",
            }],
        }
        yield f"data: {json.dumps(final)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

# ── Vapi webhook ──────────────────────────────────────────────────────────────

@app.post("/vapi/webhook")
async def vapi_webhook(request: Request):
    body       = await request.json()
    event_type = body.get("message", {}).get("type", "")
    log.info(f"Vapi webhook: {event_type}")

    if event_type == "end-of-call-report":
        msg        = body["message"]
        call       = msg.get("call", {})
        call_id    = call.get("id")
        phone      = call.get("customer", {}).get("number", "unknown")
        reason     = msg.get("endedReason", "unknown")
        transcript = msg.get("transcript", "")

        if reason not in ("assistant-ended-call",) and call_id:
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