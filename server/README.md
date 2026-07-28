# Card AI and Profile API

This server provides authenticated per-user OpenAI API connection for the
Flutter Profile path. It does not use or accept one shared developer OpenAI
key. Each AI request resolves the verified UNO user's encrypted credential.

Requires Node.js 22 LTS or newer. On Windows, install the current Node.js LTS release and restart the terminal, then verify `node --version` and `npm --version`.

```powershell
Copy-Item .env.example .env
npm install
npm start
```

Apply `migrations/001_openai_user_credentials.sql` to Supabase, then configure
the Supabase URL, publishable key, server-only service-role key, and a
base64-encoded 32-byte credential-encryption key. The service-role and
encryption keys must remain only in the backend host's secret manager. The
server deliberately exits when required values or the port are invalid.
Restrict `ALLOWED_ORIGINS`, and use HTTPS in production.

Flutter authenticates directly with Supabase, then sends `Authorization:
Bearer SUPABASE_ACCESS_TOKEN`. Shared middleware verifies the token before any
Profile credential or AI endpoint is used. Complete credentials are accepted
only by the connect/replace request and are never returned. `GET /health`
remains public.

The exact startup command is `npm start`, which runs `node src/index.js`. Verify it from another terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
```

The proxy accepts PNG/JPEG/WebP images up to the configured body limit and
never logs images, transcription text, request bodies, or API keys. Local
browser origins and production origins must be explicitly listed in
`ALLOWED_ORIGINS`.

Profile endpoints:

- `POST /api/profile/openai-credential`
- `GET /api/profile/openai-status`
- `POST /api/profile/openai-test`
- `PUT /api/profile/openai-credential`
- `DELETE /api/profile/openai-credential`
