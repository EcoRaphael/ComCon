# CommuterConnect — Commuter & Driver App

### Web-Based Transportation Platform — Calbayog City, Samar

### React + Vite + Tailwind CSS + Supabase

---

## 📖 About

This is the **Commuter & Driver App** — the public-facing half of CommuterConnect.
Unlike a typical setup, commuters and drivers share **one deployment**, one login
screen (with a role selector), and one codebase — they're just routed to different
sections after signing in.

| App                                | Purpose                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| 🧑 **Commuter** (this repo)        | Book rides, rate drivers, file reports, manage profile          |
| 🛺 **Driver** (this repo)          | Accept trips, confirm cash payments, manage schedule & earnings |
| 🛠️ **Admin Panel** (separate repo) | Verify drivers, manage fares, monitor system activity           |

All three share the **same Supabase project/database**. Everyone must use the
**same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`** to see the same live data.

---

## 🚀 Running This On Your Own Device (For Group Members)

### 1. Install prerequisites

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **Git** → [git-scm.com](https://git-scm.com)
- **VS Code** (recommended)

### 2. Clone the repository

```bash
git clone https://github.com/EcoRaphael/CommuterConnect.git
cd commuterconnect-commuter
```

> Replace the URL with your team's actual repo link if different.

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Create **`.env.local`** in the project root:

```env
VITE_SUPABASE_URL=https://hsyovokustaaabetknzl.supabase.co
VITE_SUPABASE_ANON_KEY=<ask your project lead>
VITE_APP_NAME=CommuterConnect
VITE_APP_CITY=Calbayog City
VITE_APP_REGION=Samar
```

> ⚠️ **Never commit `.env.local`** — it's already in `.gitignore`. Share the anon
> key with teammates privately (group chat), never in a public repo. **Never**
> share the `service_role` key with anyone.

### 5. Run the app locally

```bash
npm run dev
```

Opens at **http://localhost:3001** (this app uses port 3001, not Vite's default
5173, so it can run side-by-side with the admin panel on your machine).

### 6. Try it out

- Go to `/login` → pick **Commuter** or **Driver**
- Sign up a test account, or use credentials shared by your project lead
- Driver accounts need **admin verification** before they can log in — ask
  whoever has admin access to verify your test driver in the admin panel's
  Drivers page first

---

## 🛠 Troubleshooting

**Blank white page**
Check the browser console (F12). Usually means `.env.local` is missing or has
the wrong Supabase values.

**"This is not a driver/commuter account" error on login**
That's intentional — see [Role Separation](#-role-separation) below. Make sure
you're signing into the matching portal for that account's actual role.

**Driver login says "pending verification"**
New drivers must be verified by an admin before their first login. Ask your
project lead to verify the account in the admin panel.

**Port 3001 already in use**
Close any other running instance of this app, or edit the `dev` script in
`package.json` to use a different port.

---

## 🔑 Role Separation

This app enforces strict role separation at login — a commuter account cannot
log into the Driver portal and vice versa. If someone tries, they see a
dedicated **"Wrong Portal"** screen with a button to jump straight to the
correct one. This is enforced both in the UI (disabled/redirected) and at the
database level (Row Level Security), so it can't be bypassed by tampering with
the client.

---

## 💳 About Payments

Booking a ride currently only accepts **Cash**. GCash and Maya are shown in the
UI but are disabled with a "Soon" badge — there's no real payment gateway wired
up yet, so allowing those to actually book would create fares no one is
enforcing.

For cash trips: completing a ride and **confirming payment received** are two
separate, deliberate steps for the driver — marking a trip "Completed" does
**not** automatically mark it paid. The driver must explicitly tap
**"Confirm Cash Received"** afterward. This exists so there's always a real
person attesting the money actually changed hands, not just a status flip.

---

## 💰 About Fares

Fares are **seat-based, not distance-based** — per the requirement that ride
cost shouldn't depend on how far you're going. What a commuter is actually
charged is the vehicle type's flat `base_fare`, looked up from `fare_matrix`.
The `seat_count` / `per_seat` fields on that table exist for the admin's own
rate-setting reference (e.g. "4 seats × ₱5 informed why we set this base fare
at ₱40") — they are **not** added on top of what the commuter pays.

| Vehicle  | Seats | Fare Basis     |
| -------- | ----- | -------------- |
| Tricycle | 4     | Flat base fare |
| Timbol   | 3     | Flat base fare |
| Multicab | 8     | Flat base fare |

(Pedicab was removed from the platform — Calbayog's official native vehicle
lineup is Tricycle, Timbol, and Multicab only.)

---

## 📁 Project Structure

```
commuterconnect-commuter/
├── src/
│   ├── App.jsx                    ← All routes (commuter + driver)
│   ├── lib/
│   │   ├── AuthContext.jsx        ← Supabase auth session + role
│   │   └── supabase/
│   │       ├── client.js
│   │       └── service.js
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx      ← Role selector + Commuter/Driver panels
│   │   │   └── ProtectedRoute.jsx ← Blocks wrong-role access
│   │   ├── layout/
│   │   ├── ui/                    ← LocationPicker, Spinner, shared UI
│   │   ├── pages/                 ← COMMUTER screens
│   │   │   ├── Home.jsx
│   │   │   ├── Routes.jsx         ← Book a ride, choose vehicle, confirm
│   │   │   ├── MyRides.jsx
│   │   │   └── Profile.jsx
│   │   └── driver/                ← DRIVER screens
│   │       ├── DriverDashboard.jsx
│   │       ├── DriverBookings.jsx ← Accept trips, confirm cash payment
│   │       ├── DriverSchedule.jsx
│   │       └── DriverProfile.jsx
├── vercel.json                    ← Required for SPA routing on Vercel
└── .env.local                     ← Your Supabase credentials (not committed)
```

---

## 📦 Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Icons:** Lucide React

---

## 🚢 Deployment

Deploys to **Vercel**, same as the admin panel:

1. `vercel.json` must exist at the project root (SPA routing — without it,
   refreshing on any route besides `/` returns a 404)
2. Environment variables must be added in **Vercel → Project Settings →
   Environment Variables** — not read from `.env.local`, which never gets
   committed
3. Vite is auto-detected as the framework; default build settings work fine

---

CommuterConnect © 2026 · Calbayog City, Samar
