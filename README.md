# 🏥 MediSync, A Hospital Management System

A full-stack web application for managing hospital operations including appointments, patient records, doctor schedules, and AI-powered triage. Built with the MERN stack.

**Team:** Arbaz · Abdurrehman · Rafay ·   


---

## ✨ Features

- **Authentication** — JWT-based login/register with role-based access (Admin, Doctor, Patient)
- **Dashboard** — Real-time overview of appointments, patients, and hospital stats
- **Appointment Management** — Book, view, and manage appointments with priority handling
- **Doctor Directory** — Browse doctors, view schedules, and manage availability
- **Patient Profiles** — Full patient profiles with medical history and records
- **Medical Records** — Create, view, and manage detailed medical records
- **AI Triage** — Groq LLM-powered symptom analysis with voice input support
- **Therapy Sessions** — Schedule and track therapy appointments
- **Notifications** — In-app notification system with a dropdown
- **Global Search** — Search across patients, doctors, and appointments
- **User Management** — Admin panel for managing system users
- **Analytics** — Hospital-level analytics and reporting

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI | Groq SDK (Llama 3.1 8B) |
| Auth | JWT, bcryptjs |
| State | Zustand |
| Testing | Jest, Supertest, Vitest |

---

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers (auth, appointments, AI, etc.)
│   ├── middleware/      # Auth, error handling, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── scripts/         # DB seeding, backup, rollback
│   ├── services/        # Business logic (Groq AI, notifications, priority engine)
│   ├── tests/           # Jest test suites
│   ├── utils/           # Logger, response helpers
│   └── server.js        # Entry point
│
└── Frontend/
    └── src/
        ├── components/  # Reusable UI components (common, layout, notifications)
        ├── hooks/        # Custom React hooks
        ├── pages/        # Page-level components
        ├── store/        # Zustand state (auth, UI)
        └── utils/        # Helpers and validators
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- A free [Groq API key](https://console.groq.com) for AI features

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital_ms
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

Seed the database with sample data:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 🧪 Running Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd Frontend
npm run test
```

---

## 🗄️ Database Scripts

```bash
npm run seed          # Seed with sample data
npm run db:backup     # Create a backup
npm run db:list       # List available backups
npm run db:rollback   # Rollback to a previous backup
npm run db:reseed     # Clear and reseed the database
```

---

## 🔌 API Overview

All routes are prefixed with `/api/v1`

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Register a new user |
| `POST /auth/login` | Login and receive a JWT |
| `GET /appointments` | List appointments |
| `POST /appointments` | Book a new appointment |
| `GET /patients` | List all patients |
| `GET /doctors` | List all doctors |
| `GET /medical-records` | Get medical records |
| `POST /ai/triage` | AI symptom analysis |
| `GET /analytics` | Hospital analytics |
| `GET /health` | Server and DB health check |

---

## 👥 Team Members

| Name | Role |
|---|---|
| Arbaz | Backend & Database |
| Abdurrehman | Frontend & UI |
| Rafay | AI Integration & Services |


