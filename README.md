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

Default public test URL: `http://82.157.202.171`.

## Deploy

Provision once:

```bash
bash deploy/provision-ubuntu.sh
```

Deploy or update on the server:

```bash
bash deploy/deploy.sh
```

The production environment file lives at `/home/ubuntu/apps/super-video-resolver/.env.production` and is not committed.

Useful service commands:

```bash
sudo systemctl restart super-video-resolver
journalctl -u super-video-resolver -f
```
