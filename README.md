# Swedish Predator Cup — Digitale Wettkampfplattform

Next.js 14 · Supabase · Vercel · TypeScript · Tailwind CSS

Analog zum Carestone WM-Tippspiel — für den jährlichen Raubfisch-Wettkampf in den schwedischen Schären. Ersetzt die alte Excel-Lösung.

## Aktueller Stand (v0.1)

**Fundament fertig:**
- Next.js-Grundgerüst + TypeScript + Tailwind mit SPC-Farbwelt
- Datenbank-Schema (8 Tabellen + Views + RLS + Auto-Punkte-Trigger)
- Supabase-Auth via 6-stelligen OTP-Code
- Route-Schutz per Middleware
- Login-Seite

**Noch zu bauen (nächste Runde, sobald Supabase steht):**
- Screen 1: Startscreen (Dashboard mit aktuellem Call + eigene Platzierung)
- Screen 2: Live-Ranking
- Screen 3: Detail-Scoreboard eines anderen Teilnehmers
- Screen 4: Fang-Formular
- Screen 5: Eigenes Scoreboard mit „was fehlt für Aufstieg"
- Screen 6: Wettkampf-Setup (Teilnehmer/Boote/Calls/Regeln)
- Historie & Hall of Fame
- Persönliche Statistiken
- Sidebar/BottomNav

## Setup — was du machen musst (~30 min)

### 1) Supabase-Projekt anlegen
1. https://supabase.com → „New project"
2. Name: `swedish-predator-cup`, Region: `Frankfurt (eu-central-1)`
3. Datenbank-Passwort setzen (aufschreiben!)
4. Nach dem Projekt-Setup:
   - **SQL Editor** öffnen → `db/schema.sql` einspielen (komplett rein-copy-pasten, „Run")
   - Danach `db/triggers.sql` einspielen (gleiches Vorgehen)
   - **Authentication → Providers → Email:** „Email OTP" an, „Confirm email" aus
   - **Authentication → Emails → Magic Link:** Template anpassen (Betreff „Dein SPC-Anmeldecode")
   - **Database → Replication → supabase_realtime:** `catches`, `penalties`, `competitions` als Publikation aktivieren

### 2) Umgebungsvariablen
1. Supabase-Dashboard: **Project Settings → API**
2. Aus dieser Seite kopierst du:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` Key → `SUPABASE_SERVICE_ROLE_KEY`
3. Kopier `.env.example` zu `.env.local` und trage die drei Werte ein:
   ```bash
   cp .env.example .env.local
   ```

### 3) Lokal starten
```bash
npm install
npm run dev
```
Dann http://localhost:3000 öffnen. Mit einer beliebigen E-Mail anmelden — Code kommt per Mail.

### 4) GitHub-Repo anlegen
1. https://github.com/new → Repo `swedish-predator-cup`, privat
2. Lokal:
   ```bash
   cd ~/Downloads/swedish-predator-cup
   git init
   git add .
   git commit -m "chore: initial scaffold — auth, schema, layout"
   git branch -M main
   git remote add origin https://github.com/DEIN-USER/swedish-predator-cup.git
   git push -u origin main
   ```

### 5) Vercel-Deploy
1. https://vercel.com → „Import Git Repository" → SPC-Repo auswählen
2. Bei Environment Variables die 3 aus `.env.local` eintragen
3. „Deploy" → nach ~90 Sekunden hast du eine `.vercel.app`-URL
4. Beim ersten Anmelden auf der Live-URL: Supabase → **Authentication → URL Configuration**: Vercel-URL als „Site URL" + in „Redirect URLs" hinzufügen

## Wichtig — NICHT in OneDrive verschieben

Cloud-Storage (OneDrive/iCloud/Dropbox) zerlegt den `.git`-Ordner. Wenn du Sicherung willst, push zu GitHub — das ist dein Backup.

## Regelwerk (in Code abgebildet)

- **Fischarten** (defaults, pro Wettkampf editierbar):
  - Barsch: min 25 cm × 2,0
  - Zander: min 50 cm × 1,3
  - Hecht:  min 60 cm × 1,0
- **Bonus:** Topwater = +10 Punkte
- **Strafen:** Abriss = –20 Punkte · Falsches Handling = 10 Min Angelsperre
- **Wertung:** max 6 Fische, max 4 pro Art. Ab dem 5. Fisch müssen alle 3 Arten vertreten sein.
- **Wettkampf-Status:** `prep` → `running` → (`paused`) → `finished`. Nur in `prep` sind Einstellungen editierbar.
- **Keine Admin-Rolle** — alle Teilnehmer haben gleiche Rechte (via RLS-Policies).
