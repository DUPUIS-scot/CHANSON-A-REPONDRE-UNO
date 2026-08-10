# Chanson à Répondre UNO — v2.5

Version 2.5 is the approved and certified release baseline for the current
working implementation. It preserves the 84-card permanent deck, application
routes, 3D Browse/Search castle, category-specific card versos, permanent
rectos, DJ Who integration, puppet/live-dealer presentation, and established
UI and interaction system.

- Version: 2.5
- Status: APPROVED / CERTIFIED
- Permanent deck: 84 cards
- Git reference: `v2.5`

## Live web application

https://jameshpdy-dev.github.io/CHANSON-A-REPONDRE-UNO/

The GitHub Pages build hosts the complete Flutter Web frontend. AI Chat and
Card Transcription additionally require a separately hosted HTTPS backend.

## Card transcription and AI chat

Production builds use the secure proxy in `server/`. Each signed-in user connects
their own OpenAI API key from the Profile screen; the key is encrypted on the
backend, never stored in Flutter, and never distributed in a build. OpenAI API
billing is separate from ChatGPT subscriptions.

## Supabase application authentication

Create a Supabase project, then open **Authentication -> Providers -> Email** and enable the Email provider. Copy the project URL and publishable key (or legacy anon key) from the project API settings. The application rejects missing values and placeholders such as `YOUR_PROJECT`.

For the deployed GitHub Pages app, configure **Authentication -> URL Configuration** in Supabase:

```text
Site URL:
https://jameshpdy-dev.github.io/CHANSON-A-REPONDRE-UNO/

Redirect URL:
https://jameshpdy-dev.github.io/CHANSON-A-REPONDRE-UNO/#/profile
```

The Flutter production build must receive only client-safe values:

```text
AI_BACKEND_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SKIP_AUTH_FOR_DEVELOPMENT=false
```

Do not use a Supabase `service_role` key, database password, OpenAI key, access token, or refresh token in Flutter or GitHub Pages build variables.

Launch Flutter with real public client configuration:

```powershell
flutter run -d windows `
  --dart-define=AI_BACKEND_URL=http://127.0.0.1:3000 `
  --dart-define=SUPABASE_URL=https://REAL_PROJECT_ID.supabase.co `
  --dart-define=SUPABASE_ANON_KEY=REAL_PUBLISHABLE_KEY
```

For local UI work only, a debug build can bypass the login gate with `--dart-define=SKIP_AUTH_FOR_DEVELOPMENT=true`. Release builds ignore this flag. UI bypass mode never sends a fake bearer token and disables transcription/chat submission until a genuine Supabase session exists.

## Local Development

Create the ignored local configuration file:

```powershell
Copy-Item `
  config/local.example.json `
  config/local.json
```

Replace every placeholder in `config/local.json` with values from the Supabase
project dashboard, then run:

```powershell
.\run-local.ps1
```

`config/local.json` is ignored by Git. Use only the client-safe Supabase
publishable/anon key in Flutter, never a `service_role` key. Restart the
application after changing compile-time values; hot reload cannot change them.

Set the matching backend values in the ignored `server/.env`:

```env
PORT=3000
SUPABASE_URL=https://REAL_PROJECT_ID.supabase.co
SUPABASE_PUBLISHABLE_KEY=REAL_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=REAL_SERVICE_ROLE_KEY
CREDENTIAL_ENCRYPTION_KEY=BASE64_32_BYTE_SECRET
```

User passwords are sent only to Supabase Auth. Flutter sends the resulting short-lived Supabase access token to the backend. Each OpenAI key is submitted only from the Profile connection flow, encrypted on the backend, and used only for that authenticated user. Never use the Supabase database password as an application user password or put a `service_role` key in Flutter.

After configuring Supabase, create an account through **Create account** or invite a test user from **Authentication -> Users**. If email confirmation is enabled, confirm the address before signing in.

Before backend startup, run the secret-safe diagnostic:

```powershell
cd server
npm run check:config
npm start
```

The checker reports only `configured`, `missing`, or `placeholder`; it never prints credential values. Verify the public route only after startup succeeds:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
```

Real authentication must be launched without UI bypass:

```powershell
flutter run -d windows `
  --dart-define=AI_BACKEND_URL=http://127.0.0.1:3000 `
  --dart-define=SUPABASE_URL=https://REAL_PROJECT_ID.supabase.co `
  --dart-define=SUPABASE_ANON_KEY=REAL_SUPABASE_PUBLISHABLE_KEY `
  --dart-define=SKIP_AUTH_FOR_DEVELOPMENT=false
```

The backend requires Node.js 22 LTS or newer. On Windows, install the current Node.js LTS release, restart the terminal, and confirm:

```powershell
node --version
npm --version
```

1. Apply the SQL migration in `server/migrations/001_openai_user_credentials.sql` to the Supabase project.
2. In `server/`, copy `.env.example` to `.env`, then configure Supabase, `CREDENTIAL_ENCRYPTION_KEY`, and `ALLOWED_ORIGINS`.
3. Users create and manage their own OpenAI API keys in the Profile screen after signing in.
4. Keep Terminal 1 running:

```powershell
cd server
npm install
npm start
```

5. In another terminal, require a successful health response before launching Flutter:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
```

6. Keep Terminal 2 running with the matching URL:

```powershell
flutter run -d windows --dart-define=AI_BACKEND_URL=http://127.0.0.1:3000
```

The Windows helper `scripts/start-backend.ps1` performs runtime, `.env`, dependency, and port checks. macOS/Linux users can run `scripts/start-backend.sh`.

For Chrome, use:

```powershell
flutter run -d chrome --dart-define=AI_BACKEND_URL=http://127.0.0.1:3000
```

Android emulators must use `http://10.0.2.2:3000`; physical devices must use the development computer's LAN address and may require a firewall rule.

Staging:

```powershell
flutter run -d windows --dart-define=AI_BACKEND_URL=https://staging-api.example.com
```

Web production:

```powershell
flutter build web --release --base-href "/YOUR_REPOSITORY/" --dart-define=AI_BACKEND_URL=https://api.example.com
```

Android production:

```powershell
flutter run -d android --dart-define=AI_BACKEND_URL=https://api.example.com
```

Open Browse Cards, select a card, open it full screen, choose **Transcribe Card**, review and save the text, then choose **Discuss This Card**.

Supported image signatures are PNG, JPEG, and WebP, up to 20 MB. Images are base64-encoded into Responses API image inputs without modifying the original stored card file. Transcriptions and conversations persist by card ID.

The REST client uses `GET /health`, Profile credential endpoints under
`/api/profile/openai-*`, multipart `POST /api/cards/transcribe`, and JSON
`POST /api/cards/chat`. Flutter Web relies on the proxy's `ALLOWED_ORIGINS`
CORS allowlist. For Android emulators or physical devices, use the development
computer's reachable emulator/LAN address instead of assuming `localhost` points
to the computer. Prefer HTTPS outside local development; the Android manifest
does not globally enable cleartext traffic.

## GitHub Pages deployment

Run the Web application locally:

```bash
flutter pub get
flutter run -d chrome --dart-define=AI_BACKEND_URL=https://api.example.com
```

The deployment URL follows:

```text
https://YOUR_USERNAME.github.io/uno2/
```

Enable Pages manually at:

```text
Repository -> Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

Configure the public HTTPS backend as a repository variable:

```text
Repository -> Settings -> Secrets and variables -> Actions -> Variables -> New repository variable
```

Use the variable name `AI_BACKEND_URL`. The backend must allow the GitHub Pages origin through its CORS allowlist. Never put an OpenAI key, Supabase service-role key, or credential encryption secret in GitHub Pages variables.

The workflow at `.github/workflows/deploy-pages.yml` builds the nested `uno_chanson_2` Flutter project with `/uno2/` as its base href and deploys `build/web`. Flutter keeps hash-based routing, so nested views use URLs such as `#/settings` and refresh safely on Pages.

Normal updates:

```bash
git add .
git commit -m "Update application"
git push
```

Every push to `main` triggers analysis, tests, a release Web build, and deployment. The local repository currently has no GitHub remote and its checked-out branch is `master`; add the remote and create/rename the deployment branch to `main` before the first push. If the eventual repository name is not `uno2`, update `GITHUB_PAGES_BASE_HREF` in the workflow.
