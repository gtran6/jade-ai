// app.config.js
module.exports = {
    expo: {
      name: 'Jade AI',
      slug: 'jade-ai',
      version: '1.0.0',
      orientation: 'portrait',
      scheme: 'jade',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      ios: {
        supportsTablet: false,
        bundleIdentifier: 'com.jadeai.app',
      },
      android: {
        adaptiveIcon: { backgroundColor: '#F9F4EF' },
        package: 'com.jadeai.app',
        edgeToEdgeEnabled: true,
      },
      web: { bundler: 'metro' },
      plugins: ['expo-router', 'expo-font'],
      extra: {
        supabaseUrl:      process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey:  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        salonId:          process.env.EXPO_PUBLIC_SALON_ID,
      },
    },
  };