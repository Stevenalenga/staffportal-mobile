// EXPO_PUBLIC_ variables are automatically bundled by Expo from .env files.
// Set EXPO_PUBLIC_API_URL in .env for local dev and .env.production for VPS.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
