export const APP_SECRET = process.env.JWT_SECRET ?? "event-discovery-dev-secret";
export const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "event-discovery-refresh-secret";
export const PASSWORD_SALT = process.env.PASSWORD_SALT ?? "event-discovery-salt";

