# Malica App

Next.js app za narocanje malic z uporabniskim pogledom, admin pregledom in vecjezicnim prikazom.

## Lokalni razvoj

Zazeni development server:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Odpri `http://localhost:3000` ali omrezni IP racunalnika.

## Okoljske spremenljivke

Skopiraj `.env.example` v `.env.local` in nastavi vrednosti.

Pomembne spremenljivke:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MYMEMORY_EMAIL`
- `ALLOWED_DEV_ORIGINS`
- `SUPABASE_ALLOW_INSECURE_TLS`

## Prevodi jedi

App za samodejni prevod novih jedi uporablja brezplacni MyMemory API.

- Admin vnese slovenski naziv ali opis.
- Ko admin zapusti slovensko polje, app samodejno pripravi `sl`, `en` in `uk` osnutek.
- Admin lahko angleski in ukrajinski prevod pred shranjevanjem rocno popravi.
- Ce API ni dosegljiv, app pade nazaj na lokalni fallback prevod.

Za vecjo brezplacno kvoto v MyMemory nastavi `MYMEMORY_EMAIL`.

Ce zelis lokalno testirati prek telefona na istem Wi-Fi, lahko v `.env.local` nastavis se:

```env
ALLOWED_DEV_ORIGINS=http://192.168.2.142:3000
```

## Vercel deployment

V Vercelu nastavi:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MYMEMORY_EMAIL`

Na Vercelu ne nastavljaj `SUPABASE_ALLOW_INSECURE_TLS`, ker je ta lokalni workaround samo za razvojno okolje.
