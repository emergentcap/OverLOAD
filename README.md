
# OVERLOAD (Supabase + PWA)

Features
- Supabase **Auth** (magic link) and **Postgres** with RLS
- Edge Functions: `log-session`, `compute-next-week`
- Planner → save program + week targets to cloud
- Workout logging → saves sets to cloud (offline queue if needed)
- Progress page → reads sessions/sets and charts avg RIR & avg Load
- **PWA**: installable + offline caching

## 1) Local dev
```bash
npm install
npm run dev
```

## 2) Supabase setup
- Create a project, copy **Project URL** and **Anon key**.
- Run the SQL in `supabase/schema/schema.sql` (SQL editor).
- Deploy functions:
  - In Supabase CLI (or Studio): create Edge Functions `log-session`, `compute-next-week` from `supabase/functions/*`.
  - Set function env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
  - Mark functions to require JWT (default).

## 3) Env vars (Vercel or local .env)
- `VITE_SUPABASE_URL=<your supabase url>`
- `VITE_SUPABASE_ANON_KEY=<your anon key>`

## 4) Deploy to Vercel
- Build: `npm run build`
- Output: `dist`
- Add `vercel.json` (included) so SPA routes work.
- Set the two env vars above in Vercel → Project Settings → Environment Variables.

## 5) (Optional) Weekly automation
- Use Vercel Cron to call the `compute-next-week` endpoint weekly, or trigger in the UI.

## Notes
- Edge Functions use the **Anon key** and forward `Authorization` from the client; RLS keeps data siloed per user.
- Offline queue stores unsent sessions in IndexedDB and syncs automatically when online.


---

## OAuth Sign-in (Google/GitHub)
1. In Supabase > Authentication > Providers: enable **Google** and/or **GitHub** and add credentials.
2. In Vercel > Environment Variables, ensure the frontend has:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. The login screen shows **Continue with Google/GitHub** automatically.

## Weekly Auto-Adjust (Vercel Cron)
- A serverless function lives at `/api/cron-compute-next-week`.
- `vercel.json` includes:
  ```json
  {
    "crons": [{ "path": "/api/cron-compute-next-week", "schedule": "0 13 * * 0" }]
  }
  ```
  That runs every **Sunday 13:00 UTC** (adjust as you prefer).
- Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel **(Server-only)** for the cron to iterate all programs and trigger the Supabase edge function.
- The function **skips** programs that have already reached their `meso_weeks`.

## Required environment variables (Vercel)
- Frontend (exposed to client):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Serverless Function (server-only):
  - `SUPABASE_SERVICE_ROLE_KEY`
