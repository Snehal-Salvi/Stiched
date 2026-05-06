# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stiched** is a local tailor booking app — customers browse and book nearby tailors for stitching blouses, salwar kameez, lehengas, men's shirts, pants, kurtas, alterations, and more. Tailors manage their shop profile, services, pricing, and incoming orders.

The repo has two directories:
- `backend/` — Node.js/Express REST API
- `frontend/src/` — React 18 + TypeScript + MUI frontend

## Backend

### Running the server

```bash
cd backend
npm run dev      # development with nodemon
npm start        # production
```

Default port: `5001`. Requires a `.env` file (see required vars below).

### Required environment variables

```
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRE
CLIENT_URL

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
EMAIL_FROM
```

### Architecture

The backend uses ES modules (`"type": "module"` in package.json). All imports use the `.js` extension.

**Authentication** is handled entirely via Passport.js strategies (configured in `src/config/passport.js`):
- `passport-jwt` — Bearer token auth for protected routes, extracts from `Authorization` header
- `passport-google-oauth20` — OAuth flow; on callback, redirects to `CLIENT_URL/auth/google?token=...&role=...`

The `protect` middleware in `src/middleware/auth.js` wraps `passport.authenticate('jwt', ...)` and attaches the user to `req.user`. `requireRole(...roles)` guards role-specific endpoints.

**Two-role system:** `customer` and `tailor`. A user starts as `role: 'customer'`; calling `POST /api/tailors/profile` upgrades them to `'tailor'` in the User document and creates a linked Tailor document.

**Data model relationships:**
- `Tailor` has a 1:1 `user` ref to `User` (unique); has embedded `services[]` and `shopPhotos[]`
- `Order` has `customer` → `User` and `tailor` → `Tailor` refs
- `Order` stores `garmentType`, `measurementType` (custom | send_sample), `measurements` object, `price`, `paymentMethod` (card | cod)

**Registration flow:** register → OTP email sent (10 min expiry) → verify OTP → receive JWT. Same OTP mechanism is reused for password reset.

**Image uploads** (`src/middleware/upload.js`): Multer + Cloudinary, images stored in the `stiched` folder, max 5MB, resized to max 1200px wide. Used for shop photos.

**Error handling:** `express-async-handler` wraps all controller functions. Errors set `res.status(...)` and `throw new Error(...)` — caught by the global `errorHandler` middleware.

### API routes summary

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/auth/register` | — | — |
| POST | `/api/auth/verify-otp` | — | — |
| POST | `/api/auth/login` | — | — |
| POST | `/api/auth/forgot-password` | — | — |
| POST | `/api/auth/reset-password` | — | — |
| GET | `/api/auth/me` | JWT | any |
| GET | `/api/auth/google` | — | — |
| GET | `/api/auth/google/callback` | — | — |
| GET | `/api/tailors` | — | — (paginated, filter by city/serviceCategory/minRating/search) |
| GET | `/api/tailors/me` | JWT | tailor |
| GET | `/api/tailors/:id` | — | — |
| POST | `/api/tailors/profile` | JWT | any (promotes to tailor) |
| PUT | `/api/tailors/profile` | JWT | tailor |
| POST | `/api/tailors/photos` | JWT | tailor (multipart) |
| DELETE | `/api/tailors/photos/:photoId` | JWT | tailor |
| POST | `/api/orders` | JWT | customer |
| GET | `/api/orders/my-orders` | JWT | customer |
| GET | `/api/orders/incoming` | JWT | tailor |
| PUT | `/api/orders/:id/status` | JWT | tailor |
| POST | `/api/orders/:id/review` | JWT | customer |

Order statuses: `pending` → `accepted` / `rejected`, `accepted` → `in_progress` → `completed` / `cancelled`.

## Frontend

React 18 + TypeScript + Vite + Material UI. Dev server runs on port 3000 and proxies `/api/*` to the backend on port 5001.

### Running the frontend

```bash
cd frontend
npm run dev      # dev server on :3000
npm run build    # production build
```

### Architecture

**Auth state** lives in `src/context/AuthContext.tsx`. It reads `token` and `user` from `localStorage` on mount, calls `GET /api/auth/me` if only the token is present, and exposes `login(token, user)` / `logout()`. The axios instance at `src/api/axios.ts` attaches the Bearer token from `localStorage` and redirects to `/login` on 401.

**Route protection** is in `src/routes/index.tsx`:
- `ProtectedRoute` — checks auth and optionally enforces a role (`customer` | `tailor`); redirects to `/login` or `/` on failure
- `GuestRoute` — redirects logged-in users away from auth pages to their role-appropriate home

**Pages by role:**

| Path | Role | Page |
|------|------|------|
| `/` | public | Home — landing with city search + location detect |
| `/tailors` | public | Browse/filter tailors by city + service category |
| `/tailors/:id` | public | Tailor profile + 3-step booking dialog |
| `/login`, `/register`, `/verify-otp`, `/forgot-password` | guest only | Auth flows |
| `/auth/google` | — | Google OAuth callback handler |
| `/user/orders` | customer | Order list + review dialog |
| `/tailor/dashboard` | tailor | Order management + stats |
| `/tailor/profile` | tailor | Shop profile create/edit + services + photos |

**Key components:**
- `src/components/booking/MeasurementForm.tsx` — size chart + measurement fields per garment type
- `src/components/tailor/TailorCard.tsx` — card shown in browse list
- `src/components/common/StatusChip.tsx` — order status badge

**Booking flow (3 steps in dialog):**
1. Select service from tailor's list + garment type
2. Measurement: toggle "Custom measurements" (with size chart reference) or "Send sample garment"
3. Notes + payment method (Card / Cash on Delivery) + order summary + confirm

**Key patterns:**
- All pages are lazy-loaded via `React.lazy` in `App.tsx`
- Location detection uses `navigator.geolocation` + OpenStreetMap Nominatim reverse geocoding
- Toast notifications (`react-toastify`) used for all user-facing feedback
- Tailor profile create flow upgrades user role to `tailor` server-side
- Google OAuth callback (`/auth/google?token=...`) handled by `GoogleCallback.tsx`
