# Macro Fit Pro

Macro Fit Pro is a Firebase-backed nutrition tracker for logging daily intake and activity, reviewing trends, and managing tracking goals over time.

## Core Features

- Email/password and Google authentication
- Daily nutrition logging (calories, macros, fiber, sodium, drinks, calories burned)
- Trend cards and chart views for rolling windows (`prev`, `all`, `3`, `7`, `30`)
- CSV export for the current filtered view
- Per-user goals, theme settings, and privacy toggles
- Cycle-based logging with a dedicated **Cycle Menu**:
  - Start a new cycle
  - Switch between current cycle, specific cycles, legacy entries, or all history
  - Set a selected cycle as active
  - Delete a cycle while preserving entries by moving them to legacy (no cycle)

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Firebase Auth + Firestore

## Local Development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run build
npm run lint
npm run preview
```

## Firebase Setup

Full setup details are in `/Users/jeremybennett/projects/macro-fit-pro/README_SETUP.md`.

At minimum, ensure:

1. Firebase Authentication is enabled (Email/Password and Google if needed).
2. Firestore is created and security rules from `/Users/jeremybennett/projects/macro-fit-pro/firestore.rules` are published.
3. Composite index exists for `dailyNutrients` on:
   - `uid` (Ascending)
   - `date` (Descending)

## Local Auth Domain Notes

If sign-in fails during local development, add local hosts in Firebase:

- `Authentication` -> `Settings` -> `Authorized domains`
- Add `localhost`
- Add `127.0.0.1`

Only add hostnames (no protocol or port).

## Data Model (High Level)

- `users/{uid}`
  - theme
  - targets
  - activeCycleId
- `dailyNutrients/{docId}`
  - uid
  - cycleId (optional)
  - date + nutrition metrics
- `cycles/{docId}`
  - uid
  - name
  - createdAt
