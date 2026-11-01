export const TEST_DB = "footyup_test";

export function adminUrl() {
  return process.env.TEST_ADMIN_DATABASE_URL ?? "postgres://footy:footy@localhost:5432/postgres";
}

export function testUrl() {
  const url = new URL(adminUrl());
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}
