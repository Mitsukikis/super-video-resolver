# Super Video Resolver

Public MVP for resolving supported video links into a normalized manifest. The server extracts metadata and direct media information only. It does not proxy, store, download, or merge video files.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Safety Rules

- No server-side video proxying.
- No persistent cookies.
- Temporary cookies are accepted only for logged-in resolve requests.
- DRM, private, and paid-wall bypass flows are blocked.

## Server

Default public test URL: `http://82.157.202.171:3000`.

