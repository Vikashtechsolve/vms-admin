# Trainer Adda Admin

Admin panel for managing trainers, vendors, jobs, important links, and contact messages.

## Scripts

```bash
npm install
npm run dev
```

## Environment

Local `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

## Production (Vercel)

The admin panel proxies API calls through the same domain to avoid browser DNS/CORS issues with Railway:

1. `vercel.json` rewrites `/api/*` → your Railway backend URL
2. Set Vercel env **`VITE_API_URL=/api`** (or leave unset — production defaults to `/api`)
3. **Remove** any old `VITE_API_URL` pointing directly at `*.up.railway.app`
4. Redeploy the admin app

On Railway, set backend env `CORS_ORIGINS=*` (or include `https://admin.traineradda.com`).
