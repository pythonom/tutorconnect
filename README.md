# 🎓 TutorConnect

A peer-to-peer tutoring platform that connects learners with tutors — browse tutors, book sessions around their availability, and leave reviews after a session is complete.

---

## 🚀 Overview

TutorConnect lets a learner search for tutors by skill, book a session at a time the tutor is actually free, and review the tutor afterward. Tutors get their own dashboard to manage their profile, set weekly availability, and track upcoming and past sessions.

---

## ✨ Features

### 🔐 Authentication
* Email/password registration and login, with passwords hashed via bcrypt
* JWT-based sessions (1 hour expiry), stored client-side and sent as a bearer token
* Role selection at signup — **tutor** or **learner** — which determines the dashboard and permissions
* Google OAuth login flow (backend routes are implemented; frontend sign-in button not yet wired up)

### 🔍 Tutor Search
* Browse all registered tutors with their bio and skills
* Basic search by name/skill

### 📅 Booking & Sessions
* Learners book a session with a tutor for a subject, date/time, and duration
* Backend checks the tutor's weekly availability before confirming the booking
* Both tutor and learner can view their upcoming/past sessions from their dashboard
* Session status can be updated (pending → confirmed → completed → cancelled)

### ⭐ Reviews
* Learners can leave a rating (1–5) and comment after a session
* One review per session per learner
* Reviews are shown on the tutor's profile

### 👤 Tutor Profile
* Tutors can edit their bio and skills
* Tutors can set weekly availability (day + time range)

---

## 🏗️ Tech Stack

**Frontend:** React 18 + TypeScript (Vite), React Router, Tailwind CSS, Lucide icons

**Backend:** FastAPI, asyncpg, python-jose (JWT), bcrypt, httpx (Google OAuth), Pydantic

**Database:** PostgreSQL, hosted on Supabase

---

## 📂 Project Structure

```
tutorconnect/
├── src/                         # React + TypeScript frontend
│   ├── components/              # Auth, MainLayout, TutorSearch, Dashboard,
│   │                             # BookingModal, ReviewModal, AvailabilityModal, TutorProfileForm
│   ├── contexts/AuthContext.tsx # Handles signup/login/logout, stores JWT + user in localStorage
│   ├── lib/api.ts               # Backend base URL (VITE_API_URL)
│   └── services/api.ts          # Legacy tutor-fetch helpers
├── backend/
│   ├── main.py                  # FastAPI app entrypoint, router registration, CORS
│   ├── db.py                    # asyncpg connection + startup table creation
│   ├── auth/                    # register/login/Google OAuth, hashing, JWT issuing + verification
│   ├── tutors/                  # tutor profile, availability, tutor listing
│   ├── routes/sessions.py       # booking, session status, session history
│   └── reviews/                 # review creation + retrieval
└── supabase/migrations/         # Postgres schema (see note under Known Limitations)
```

---

## 🔌 API Endpoints

Base URL: your FastAPI backend URL

### Auth (`/api/auth`)
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Create an account (tutor or learner) |
| POST | `/login` | Log in, returns a JWT + user object |
| GET | `/google/login` | Get the Google OAuth consent URL |
| GET | `/google/callback` | Google OAuth callback, returns a JWT |
| GET | `/protected` | Example authenticated route |

### Tutors (`/api/tutors`)
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all tutors |
| GET | `/{tutor_id}` | Get a tutor's profile |
| PUT | `/profile` | Update the logged-in tutor's bio/skills |
| POST | `/availability` | Add a weekly availability slot |
| GET | `/{tutor_id}/availability` | Get a tutor's availability |

### Sessions (`/api/sessions`)
| Method | Route | Description |
|---|---|---|
| POST | `/book` | Learner books a session with a tutor |
| GET | `/me` | Get the logged-in user's sessions (tutor or learner) |
| GET | `/tutor` | Get the logged-in tutor's sessions |
| PUT | `/{session_id}` | Update a session's status |

### Reviews (`/api/reviews`)
| Method | Route | Description |
|---|---|---|
| POST | `/` | Learner leaves a review for a completed session |
| GET | `/tutor/{tutor_id}` | Get all reviews for a tutor |

---

## 🔄 Workflow

1. A user registers as a tutor or learner
2. Tutors fill in their bio/skills and set weekly availability
3. Learners search for a tutor and book a session within that tutor's availability
4. The tutor confirms/completes the session from their dashboard
5. After completion, the learner leaves a rating and review

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/pythonom/tutorconnect.git
cd tutorconnect
```

### 2. Backend setup
```bash
pip install -r requirements.txt
```

Create a `backend/.env` file:
```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri
```

Run the API locally:
```bash
uvicorn backend.main:app --reload
```
The API runs on `http://127.0.0.1:8000` by default. On startup it creates the `users` table if it doesn't exist — see the note below about the rest of the schema.

### 3. Frontend setup
```bash
npm install
```

Create a `.env` file in the project root:
```
VITE_API_URL=http://127.0.0.1:8000
```

Run the dev server:
```bash
npm run dev
```

---

## 🚀 Deployment

* **Backend:** deploy `backend/` (e.g. Render), start command `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`. Set the environment variables listed above.
* **Frontend:** deploy the repo root (e.g. Netlify — `main.py` already allow-lists `ddtutorconnect.netlify.app`). Set `VITE_API_URL` to your backend URL.

---

## 🔐 Known Limitations

* **Database schema isn't fully version-controlled.** `db.py` only auto-creates the `users` table on startup. The `tutors`, `sessions`, `reviews`, and `availability` tables the app actually queries aren't created by any migration in `supabase/migrations/` — the first migration defines a different schema (UUID-based `profiles`/`tutor_profiles` tied to Supabase Auth) that the app no longer uses, and the second migration file is empty. If you're setting this up fresh, you'll need to create `tutors`, `sessions`, `reviews`, and `availability` manually to match the columns used in `backend/tutors/routes.py`, `backend/routes/sessions.py`, and `backend/reviews/routes.py`.
* **`backend/routers/tutor.py` is dead code** — it defines a `/tutors` router that's never registered in `main.py` (the app uses `backend/tutors/routes.py` instead, under `/api/tutors`). Safe to remove.
* **`@supabase/supabase-js` and `src/lib/supabase.ts` are unused** — auth and data access go through the FastAPI backend directly; Supabase is only used as the Postgres host. Safe to remove if you want to trim the dependency.
* **CORS allows all origins** (`origins = ["*", ...]` in `main.py`) even though specific domains are also listed — worth tightening before this handles real user data.
* Google OAuth is implemented on the backend but there's no "Sign in with Google" button wired up in `Auth.tsx` yet.

---

## 💡 Acknowledgment

Originally built as the "Aarambhthon" hackathon backend, now being refined into a proper peer-to-peer tutoring platform.
