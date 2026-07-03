import { describe, expect, it } from "vitest";
import { redactHeaders, redactUrl } from "@/lib/redact";

describe("redaction", () => {
  it("redacts cookie-like headers and signed query params", () => {
    expect(redactHeaders({ cookie: "a=b", authorization: "Bearer x", accept: "json" })).toEqual({
      cookie: "[redacted]",
      authorization: "[redacted]",
      accept: "json"
    });
    expect(redactUrl("https://e.test/video.mp4?token=abc&x=1")).toBe("https://e.test/video.mp4?token=%5Bredacted%5D&x=1");
  });
});

