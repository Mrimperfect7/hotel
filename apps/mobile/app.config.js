/**
 * Expo config wrapper — lets the API origin be overridden at build time:
 *
 *   EXPO_PUBLIC_API_ORIGIN=https://api.yourdomain.com npx eas build -p android
 *
 * The fallback below is the production API (Render) — every cloud build
 * picks it up automatically.
 */
const base = require('./app.json');

const FALLBACK_API_ORIGIN = 'https://namma-guruvayoor-api.onrender.com';

module.exports = {
  expo: {
    ...base.expo,
    extra: {
      ...base.expo.extra,
      apiOrigin: process.env.EXPO_PUBLIC_API_ORIGIN || FALLBACK_API_ORIGIN,
    },
  },
};
