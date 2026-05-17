# Stiched

A local tailor booking app — customers browse and book nearby tailors for stitching blouses, salwar kameez, lehengas, men's shirts, pants, kurtas, alterations, and more. Tailors manage their shop profile, services, pricing, and incoming orders.

**Live app:** https://stiched.netlify.app

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite + Material UI — hosted on Netlify
- **Backend:** Node.js + Express + Passport.js — hosted on Render
- **Database:** MongoDB Atlas
- **Image storage:** Cloudinary
- **Auth:** JWT (email/password) + Google OAuth

## Local development

### Backend

```bash
cd backend
npm install
npm run dev      # runs on http://localhost:5004
```

Requires a `.env` file in `backend/` with: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLIENT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.

### Frontend

```bash
cd frontend
npm install
npm run dev      # runs on http://localhost:3000
```

The dev server proxies `/api/*` to the local backend on port 5004.

### Seed dummy data

```bash
cd backend
node seed.js     # uses MONGODB_URI from .env
```

## Features

- Role-based access: `customer` and `tailor`
- Customer flow: city search, browse tailors, 3-step booking dialog (service → measurements → notes/payment), order tracking, reviews
- Tailor flow: shop profile, service catalog with pricing, shop photo gallery, incoming-order management with status transitions
- Auth: email/password with OTP verification, password reset via OTP, Google OAuth sign-in
- Image uploads via Cloudinary
- Order status state machine: `pending → accepted → in_progress → completed`

## Project structure

- `backend/` — Express REST API (see [CLAUDE.md](./CLAUDE.md) for route reference)
- `frontend/` — React SPA
