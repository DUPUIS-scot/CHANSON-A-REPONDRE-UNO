# Chanson à Répondre UNO

Official production site:

https://www.chanson-a-repondre-uno.scot/

This repository contains the Flutter Web application, static Three.js/JavaScript experiences, the Node.js backend in `server/`, Supabase integration, and GitHub Pages deployment workflows.

## Production architecture

- Frontend: Flutter Web + static JS/Three.js modules, deployed with GitHub Pages.
- Canonical origin: `https://www.chanson-a-repondre-uno.scot`.
- Backend: Node.js 22+ Express API in `server/`.
- Data/auth: Supabase Auth + Postgres.
- AI: Gemini for configured anonymous flows and user BYOK OpenAI credentials for authenticated flows.

## Supabase authentication

Configure Supabase Authentication URL settings for production as:

```text
Site URL:
https://www.chanson-a-repondre-uno.scot/

Redirect URL:
https://www.chanson-a-repondre-uno.scot/#/profile
```

Frontend production builds receive client-safe values only:

```text
AI_BACKEND_URL
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SKIP_AUTH_FOR_DEVELOPMENT=false
```

Never expose a Supabase `service_role` key, database password, server OpenAI/Gemini key, access token, refresh token, or credential-encryption secret in the Flutter/Web build.

## Backend development

The backend requires Node.js 22 or newer. Both `server/.nvmrc` and `server/.node-version` declare Node 22.

```bash
cd server
cp .env.example .env
npm install
npm run check:config
npm test
npm start
```

Required server configuration includes Supabase URL and keys, a credential-encryption key, the production CORS allow-list, and the configured AI provider values.

The public health route is:

```text
GET /health
```

Production diagnostics intentionally expose only minimal service/revision information.

## Local Flutter development

Example:

```bash
flutter pub get
flutter run -d chrome \
  --dart-define=AI_BACKEND_URL=http://127.0.0.1:3000 \
  --dart-define=SUPABASE_URL=https://REAL_PROJECT_ID.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=REAL_PUBLISHABLE_KEY \
  --dart-define=SKIP_AUTH_FOR_DEVELOPMENT=false
```

A debug-only UI bypass may be used for local interface work with `SKIP_AUTH_FOR_DEVELOPMENT=true`; release builds must use real authentication.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` remains the authoritative build/deploy workflow. Normal pushes to `main` are handled by `.github/workflows/deploy-main-dispatch.yml`, which dispatches the canonical deploy workflow for the current `main` revision. Manual `workflow_dispatch` remains available for emergency deployment.

The deployment build uses the custom-domain root base href `/`, validates the Flutter app and critical 3D/runtime assets, generates social/share pages using the canonical production origin, then deploys the resulting `build/web` artifact to GitHub Pages.

Normal release flow:

```bash
git add .
git commit -m "Update application"
git push origin main
```

Every push to `main` now causes the canonical live deployment workflow to be dispatched automatically.
