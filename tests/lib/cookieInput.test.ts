import { describe, expect, it } from "vitest";
import { classifyTemporaryCookie } from "@/lib/resolvers/cookieInput";

describe("classifyTemporaryCookie", () => {
  it("passes simple browser cookie strings as a Cookie header", () => {
    expect(classifyTemporaryCookie("auth_token=abc; ct0=def")).toEqual({
      kind: "header",
      args: ["--add-header", "Cookie:auth_token=abc; ct0=def"]
    });
  });

  it("recognizes Netscape cookie exports for temporary cookie files", () => {
    const cookieText = [
      "# Netscape HTTP Cookie File",
      ".x.com\tTRUE\t/\tTRUE\t1893456000\tauth_token\tabc",
      ".x.com\tTRUE\t/\tTRUE\t1893456000\tct0\tdef"
    ].join("\n");

    expect(classifyTemporaryCookie(cookieText)).toEqual({
      kind: "file",
      content: `${cookieText}\n`
    });
  });
});
