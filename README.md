# Cooperative CRM

A member ledger for cooperative societies — built multi-tenant from day one,
with NARP50+ as the first cooperative. Each cooperative's data is isolated by
row-level security in Postgres, so adding a new cooperative later is just a
new row, not new code.

## Stack
- **Next.js** (React) — the app itself
- **Supabase** — Postgres database, auth (magic-link login), and hosting-ready API
- Deploys to **Vercel** (free tier is enough to start)

## 1. Set up Supabase (~5 minutes)
1. Create a free project at supabase.com
2. In the SQL editor, run `supabase/schema.sql` — this creates all tables,
   row-level security policies, and seeds NARP50+ as the first cooperative
3. In Authentication → Providers, confirm "Email" is enabled (magic link is on by default)
4. Copy your Project URL and anon public key from Settings → API

## 2. Create your first user
After running the schema, you need one admin profile so you can log in:
1. In Supabase → Authentication → Users, click "Add user" and create yourself with an email
2. In the SQL editor, run:
   ```sql
   insert into profiles (id, cooperative_id, role, full_name)
   values (
     '<the user id from step 1>',
     (select id from cooperatives where slug = 'narp50plus'),
     'admin',
     'Your Name'
   );
   ```

## 3. Run locally
```bash
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm install
npm run dev
```
Visit `localhost:3000`, sign in with your email (you'll get a magic link), and
you're in the ledger.

## 4. Deploy (so it's reachable outside Claude)
1. Push this folder to a GitHub repo
2. Import it at vercel.com → New Project
3. Add the two env vars from `.env.example` in Vercel's project settings
4. Deploy — you'll get a real URL (e.g. `coop-crm.vercel.app`) usable from any browser or phone

## Roadmap to the App Store
This is a normal web app today. The path to an actual iOS/Android app listing:
1. **PWA first** (cheap, no App Store needed): add a manifest + service worker
   so people can "Add to Home Screen" and it behaves like an app. Good enough
   for most cooperative staff use.
2. **Wrap with Capacitor** when you want real App Store presence: Capacitor
   takes this same Next.js/React codebase and packages it as a native iOS/Android
   shell — no rewrite required.
3. **Apple Developer Program** ($99/yr) + **Google Play Console** ($25 one-time)
   accounts are required to actually submit. I can walk you through the
   submission steps when you're ready for that stage.
4. Add billing (e.g. Stripe) once you have a second paying cooperative, so
   each `cooperatives` row can be tied to a subscription.

## Multi-tenant model
- `cooperatives` — one row per cooperative (NARP50+ is the first)
- `profiles` — links a login to a cooperative + role
- `members` — every member row is scoped to a `cooperative_id`
- `member_notes` — interaction log per member

Row-level security means a logged-in user can only ever see their own
cooperative's data, even though everyone shares the same database and app.

## QuickBooks Online
`members.qbo_account_ref` and `qbo_linked` are placeholders — once QuickBooks
OAuth is wired in, syncing an account just means writing that account's ID
into those two columns.
