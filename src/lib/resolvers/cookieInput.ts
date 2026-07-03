export type TemporaryCookieInput =
  | { kind: "none" }
  | { kind: "header"; args: ["--add-header", string] }
  | { kind: "file"; content: string };

function looksLikeNetscapeCookie(text: string) {
  if (text.startsWith("# Netscape HTTP Cookie File")) return true;
  return text.split("\n").some((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return false;
    return trimmed.split("\t").length >= 7;
  });
}

function normalizeHeaderCookie(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("; ");
}

export function classifyTemporaryCookie(input?: string): TemporaryCookieInput {
  const text = input?.trim();
  if (!text) return { kind: "none" };

  const normalized = text.replace(/\r\n/g, "\n");
  if (looksLikeNetscapeCookie(normalized)) {
    return {
      kind: "file",
      content: normalized.endsWith("\n") ? normalized : `${normalized}\n`
    };
  }

  return {
    kind: "header",
    args: ["--add-header", `Cookie:${normalizeHeaderCookie(normalized)}`]
  };
}
