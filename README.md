# Phone Scan

Scans barcodes and QR codes with the device camera, keeps a history of what was scanned, and syncs it to Supabase. Codes that will not scan can be typed in manually.

## Features

- **Camera scanning** via ZXing, decoding barcodes and QR codes from a live video stream
- **Manual entry** fallback for damaged or unreadable codes
- **Scan history** persisted to Supabase
- **Animated shader background** using `@paper-design/shaders-react`
- Fluid UI components — animated menu bar, fluid dropdown and toggle

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Scanning | `@zxing/browser`, `@zxing/library` |
| Backend | Supabase (`@supabase/supabase-js`) |
| Graphics | `@paper-design/shaders-react` |
| Animation | `framer-motion` |
| UI | shadcn/ui (Radix) + Tailwind |

`lib/supabase/client.ts` and `lib/supabase/server.ts` split the browser and server clients, so server components query with the service role while the browser uses the anon key.

## Running it

Prerequisites: Node.js 18+ and a Supabase project.

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

```bash
npm run dev
```

Open `http://localhost:3000`. Camera access requires **HTTPS or localhost** — browsers block `getUserMedia` on plain HTTP over a network address, so test on the machine itself or behind a TLS tunnel.

```bash
npm run build && npm start
```

## Known gaps

- No auth, so scan history is shared rather than per-user.
- Scanning is only tested against the rear camera; device selection is not exposed.
