import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevAuthRequest } from "./auth";

describe("isDevAuthRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("bypasses localhost hosts in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevAuthRequest("localhost:3000")).toBe(true);
    expect(isDevAuthRequest("app.localhost:3000")).toBe(true);
    expect(isDevAuthRequest("127.0.0.1:3000")).toBe(true);
    expect(isDevAuthRequest("[::1]:3000")).toBe(true);
  });

  it("does not bypass remote or missing hosts", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevAuthRequest("slides.example.com")).toBe(false);
    expect(isDevAuthRequest("localhost.example.com")).toBe(false);
    expect(isDevAuthRequest(null)).toBe(false);
    expect(isDevAuthRequest(undefined)).toBe(false);
  });

  it("never bypasses in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevAuthRequest("localhost:3000")).toBe(false);
    expect(isDevAuthRequest("127.0.0.1:3000")).toBe(false);
  });
});
