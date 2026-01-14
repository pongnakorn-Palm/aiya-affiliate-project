# AIYA Event Registration Mini App

A Mobile-First Event Registration application built with the **BERN stack** (Bun, ElysiaJS, React TypeScript, NeonDB).

![AIYA Branding](https://web.aiya.ai)

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Backend** | ElysiaJS |
| **Frontend** | React + TypeScript + Tailwind CSS |
| **Database** | NeonDB (Serverless PostgreSQL) |
| **Email** | AWS SES |

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.ts      # ElysiaJS API
│   │   ├── db.ts          # NeonDB connection
│   │   ├── sendEmail.ts   # AWS SES helper
│   │   └── setup-db.ts    # Database setup script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── RegistrationForm.tsx
│   │   │   └── ThankYou.tsx
│   │   └── index.css
│   └── package.json
├── schema.sql
└── .env.example
```

## 🛠️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/YourUsername/bootcamp-payment.git
cd bootcamp-payment
```

### 2. Install dependencies
```bash
# Backend
cd backend && bun install

# Frontend
cd ../frontend && bun install
```

### 3. Configure environment
```bash
cp .env.example backend/.env
# Edit backend/.env with your credentials
```

### 4. Setup database
```bash
cd backend && bun run src/setup-db.ts
```

### 5. Run the application
```bash
# Terminal 1: Backend
cd backend && bun run src/server.ts

# Terminal 2: Frontend
cd frontend && ./node_modules/.bin/vite
```

## 🌐 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/register` | Submit registration |

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | NeonDB connection string |
| `AWS_ACCESS_KEY_ID` | AWS SES access key |
| `AWS_SECRET_ACCESS_KEY` | AWS SES secret key |
| `AWS_REGION` | AWS region (e.g., ap-southeast-1) |
| `SENDER_EMAIL` | Email sender address |

## 📜 License

© 2026 AIYA. All rights reserved.
