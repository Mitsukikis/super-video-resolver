# Super Video Resolver Design

Date: 2026-07-03

## Summary

Build a public video link resolver website that can parse supported platform URLs, expose high-quality media options, and let users download or merge media on their own device. The server resolves metadata and signed media information only. It does not proxy, download, store, or merge video files.

The first version uses a plugin-based resolver architecture. Phase 1 focuses on X/Twitter, Bilibili, and YouTube. Later phases add Douyin, Kuaishou, Xiaohongshu, Weibo, TikTok, Instagram, and Facebook through the same plugin interface.

## Goals

- Accept a video page URL and return available qualities, formats, video tracks, audio tracks, thumbnails, title, duration, and other useful metadata.
- Support high-definition results, including platforms where HD content is split into separate video and audio tracks.
- Keep video traffic off the server. Users' browsers or local tools fetch media directly from source URLs.
- Support temporary user-provided cookies for a single resolve request when a user is logged in.
- Offer browser-side merging where feasible, without server-side video processing.
- Provide local fallback workflows for failures: direct track links, yt-dlp commands, ffmpeg commands, aria2, IDM, and Motrix configuration.
- Use a platform plugin model so each resolver can be maintained independently.
- Protect the public service with login gates, rate limits, abuse controls, observability, and resolver health monitoring.

## Non-Goals

- No server-side video proxying.
- No server-side video downloading, storage, transcoding, or merging.
- No persistent cookie storage.
- No DRM bypass, paid-wall bypass, private-content bypass, account-permission bypass, or platform security circumvention.
- No promise that every platform can always be browser-merged. CORS, signed URL expiry, source headers, browser APIs, and device limits can block browser-side workflows.

## Compliance Boundary

The product should parse public content and non-DRM content that the user is authorized to access. Temporary cookies may be accepted only for a single request and only from logged-in users. The system must not store, share, log, reuse, or pool user cookies.

Resolvers must reject or clearly fail closed for DRM-protected media, paid-only media, private content, deleted content, or flows that require bypassing platform access controls. The UI should communicate these limits plainly.

## User Access Model

Guests can:

- Paste supported public links.
- View basic metadata and limited public media options.
- Use a low request quota.
- Use no cookie input.

Logged-in users can:

- Use higher quotas.
- Submit temporary cookies for one request.
- Access HD parsing where supported.
- Use browser-side merge workflows.
- View local-tool fallback instructions.

Admins can:

- Monitor resolver health by platform.
- See error rates, quota usage, abuse signals, and platform availability.
- Disable or degrade individual resolver plugins when platforms change or fail.

## High-Level Architecture

The application has two major surfaces:

- Web app: URL input, optional temporary cookie modal, result viewer, quality selector, browser-side merge UI, fallback command builder, account controls.
- Resolve API: URL normalization, platform detection, policy checks, rate limiting, resolver plugin dispatch, manifest normalization, redacted logging, and observability.

The server returns a manifest. It never returns a downloaded video file created by the server.

Basic flow:

1. User enters a URL.
2. If needed, logged-in user adds temporary cookie for the request.
3. Resolve API normalizes the URL and checks policy/rate limits.
4. Resolver registry selects a matching platform plugin.
5. Plugin extracts metadata and media tracks.
6. Manifest builder normalizes the plugin output.
7. Frontend displays qualities, tracks, warnings, and available actions.
8. Browser attempts direct download or local merge when possible.
9. If browser workflow fails, UI offers local-tool fallbacks.

## Resolver Plugin Interface

Each platform resolver implements one shared contract:

```ts
type ResolverPlugin = {
  id: string;
  displayName: string;
  match(url: URL): boolean;
  capabilities: ResolverCapabilities;
  resolve(input: ResolveInput): Promise<ResolveResult>;
};
```

`ResolveInput` includes:

- Normalized URL.
- Request user id, if logged in.
- Optional temporary cookie string.
- Preferred locale and user-agent profile.
- Request id for tracing.
- Policy and timeout settings.

`ResolverCapabilities` includes:

- Whether cookies are supported.
- Whether direct browser fetch commonly works.
- Supported output types: combined file, split video/audio tracks, HLS, DASH, progressive MP4.
- Whether headers are required.
- Expected expiry behavior for signed URLs.

`ResolveResult` is plugin-specific raw output that is converted into a normalized manifest before returning to the frontend.

## Manifest Contract

The API returns a normalized manifest shaped around actions the frontend can take.

Core fields:

- Platform id and source URL.
- Title, author, duration, thumbnail, publish time when available.
- Warnings and policy messages.
- Expiry time for signed URLs when known.
- Available variants grouped by quality.
- Combined streams when available.
- Separate video tracks and audio tracks when HD is split.
- Required request headers, with sensitive headers excluded unless essential and safe to expose.
- Browser merge capability hints.
- Fallback commands and download-tool configuration.

Variant fields:

- Quality label, width, height, fps, bitrate, codec, container, size estimate.
- Whether the variant is combined or split.
- Video track reference.
- Audio track reference.
- Recommended action: direct save, browser merge, local tool, or unsupported.

Track fields:

- URL.
- MIME type/container.
- Codec.
- Bitrate and size estimate when available.
- Headers required for direct fetch.
- Expiry and refresh notes.

## Browser-Side Merge Flow

The browser merge workflow is the primary download experience for split HD resources when feasible.

The frontend must run capability checks before fetching large media:

- CORS availability.
- Link expiry risk.
- Browser API support.
- Available storage strategy.
- Estimated file size.
- Track compatibility.
- Device memory and performance risk.

Happy path:

1. User selects a quality.
2. Frontend verifies that selected tracks are compatible.
3. Browser fetches source media URLs directly.
4. A Web Worker handles long-running work.
5. The merger uses stream-based processing where possible.
6. `ffmpeg.wasm` is used only for formats that need heavier muxing.
7. File is saved locally through File System Access API or a stream-saving fallback.

Failure path:

- If CORS blocks direct fetch, show a CORS-specific failure.
- If signed URLs expire, ask the user to re-resolve.
- If local storage or memory is insufficient, explain the size/device limitation.
- If codecs or containers are incompatible, show format limitation.
- Always provide fallback options when safe: direct track links, yt-dlp, ffmpeg, aria2, IDM, and Motrix.

## Local Tool Fallbacks

Fallback output should be generated from the same manifest.

Supported fallback types:

- Copyable `yt-dlp` command.
- Copyable `ffmpeg` command for video/audio merge.
- aria2 input or command.
- IDM-friendly direct links when available.
- Motrix/aria2 configuration.

Fallback commands must avoid embedding sensitive cookies unless the user explicitly chooses to include them for local execution. If a command needs cookies, the UI must warn that the command contains sensitive account data and should not be shared.

## Security Requirements

- Do not persist cookies.
- Do not log cookies.
- Redact `Cookie`, `Authorization`, signed URL query parameters where appropriate, and other sensitive headers from logs.
- Avoid storing full submitted URLs if they contain sensitive tokens.
- Apply timeouts around each resolver.
- Limit response size from source platforms.
- Validate and normalize URLs before dispatching plugins.
- Block local-network and internal-address fetches to prevent SSRF.
- Rate-limit by IP, account, platform, and expensive features.
- Put temporary cookie parsing behind login.
- Do not pool or reuse user cookies across requests.
- Make each resolver independently disable-able.

## Rate Limits and Abuse Controls

Rate limits should account for request cost:

- Guest public resolve: low quota.
- Logged-in public resolve: higher quota.
- Cookie-enabled resolve: stricter quota.
- Expensive platforms or unstable resolvers: platform-specific quota.
- Repeated failures or suspicious traffic: progressive backoff.

The system should expose metrics:

- Resolve count by platform.
- Success and failure rate by platform.
- Browser-merge eligibility rate.
- Fallback usage.
- Timeout rate.
- Policy-blocked count.
- Quota and abuse-triggered blocks.

## MVP Platform Rollout

Phase 1:

- X/Twitter.
- Bilibili.
- YouTube.

Phase 2 China:

- Douyin.
- Kuaishou.
- Xiaohongshu.
- Weibo.

Phase 2 Global:

- TikTok.
- Instagram.
- Facebook.

The MVP should implement the full architecture with only Phase 1 plugins. This avoids building a hard-coded prototype that becomes difficult to extend later.

## Suggested Tech Direction

The exact framework can be chosen during implementation planning, but a good default stack is:

- Next.js or another TypeScript full-stack framework for the public web app and API.
- TypeScript resolver plugin interface.
- PostgreSQL for users, quotas, resolver metrics, and non-sensitive history.
- Redis or compatible KV for rate limits and short-lived request state.
- Worker threads or background jobs only for metadata parsing tasks, not video processing.
- Browser Web Workers for local merge tasks.
- Optional `ffmpeg.wasm` loaded lazily only when needed.

## Testing Strategy

Unit tests:

- URL detector and normalizer.
- Policy gate decisions.
- Rate-limit key generation.
- Cookie redaction and log sanitizer.
- Manifest builder.
- Plugin interface conformance.

Resolver tests:

- Fixture-based tests for each platform parser.
- Golden manifest snapshots.
- Timeout and failure behavior.
- No-cookie and temporary-cookie paths where applicable.

Frontend tests:

- Result rendering for combined streams.
- Result rendering for split video/audio tracks.
- Browser capability checks.
- Fallback command rendering.
- Error messages for CORS, expiry, unsupported formats, and quota limits.

End-to-end tests:

- Public guest resolve.
- Logged-in temporary-cookie resolve with cookie redaction verified.
- Browser merge eligible manifest path.
- Fallback-only path.
- Platform-disabled path.

## Open Implementation Decisions

- Final framework and hosting provider.
- Whether authentication is email/password, OAuth, or magic link.
- Exact browser merge library and supported containers for MVP.
- Whether history stores submitted URLs or only hashed/non-sensitive metadata.
- Initial quotas for guest and logged-in users.
- Admin dashboard depth for the first release.

These are implementation-plan decisions, not blockers for the product design.
