/**
 * Expo config wrapper — lets the API origin be overridden at build time:
 *
 *   EXPO_PUBLIC_API_ORIGIN=https://api.yourdomain.com npx eas build -p android
 *
 * Without the env var it falls back to FALLBACK_API_ORIGIN below (edit that
 * constant once the production API is deployed, commit, and every future
 * cloud build picks it up automatically).
 */
const base = require('./app.json');

const FALLBACK_API_ORIGIN = 'http://192.168.1.17:4000';

module.exports = {
  expo: {
    ...base.expo,
    extra: {
      ...base.expo.extra,
      apiOrigin: process.env.EXPO_PUBLIC_API_ORIGIN || FALLBACK_API_ORIGIN,
    },
  },
};
