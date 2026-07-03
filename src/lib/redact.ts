const sensitiveHeaderNames = new Set(["cookie", "authorization", "x-goog-authuser", "x-youtube-identity-token"]);
const sensitiveQueryNames = new Set(["token", "sig", "signature", "key", "auth", "expires", "expire", "x-expires"]);

export function redactHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      sensitiveHeaderNames.has(key.toLowerCase()) && value ? "[redacted]" : value
    ])
  );
}

export function redactUrl(input: string): string {
  const url = new URL(input);
  for (const key of [...url.searchParams.keys()]) {
    if (sensitiveQueryNames.has(key.toLowerCase())) {
      url.searchParams.set(key, "[redacted]");
    }
  }
  return url.toString();
}

