# 🏥 MedAssist — Digital Pulse

> An AI-powered medical assistant web app that helps patients understand their health records, track medicines, and connect with emergency services.

---

## 🌐 Live Demo
Run locally — see setup below. Demo keys: `DEMO-001`, `DEMO-002`, `DEMO-003`

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Patient Login | Email + Unique Key access system |
| 📋 Medical History Intake | Checkboxes for pre-existing conditions + allergies |
| 👤 Patient Profile | Full profile page with conditions displayed as chips |
| 🤖 AI Chat (Gemini) | Multilingual explainer for lab reports & prescriptions |
| 📄 Document Upload | Upload PDFs/images of medical reports (Supabase Storage) |
| 💊 Medicines Tracker | Log current medicines; AI gives personalised analysis |
| 🚨 RRQ SOS | Emergency triage bridge button |

---

## 🚀 Setup: Get it running in 3 steps

### Step 1 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/MedAssist.git
cd MedAssist
npm install
```

### Step 2 — Add API Keys

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```
   *(On Windows: copy `.env.example` and rename it to `.env.local`)*

2. Open `.env.local` and fill in the three values.  
   Your team lead will send you these values privately.

### Step 3 — Run

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. That's it! 🎉

---

## 🗂️ Project Structure

```
MedAssist/
├── .env.example          ← 🔑 API key template (fill this in)
├── .env.local            ← 🔑 Your actual keys (NEVER commit this)
│
├── supabase/             ← 🗄️ All database setup SQL files
│   ├── 00_run_all.md     ← Instructions to set up the database
│   ├── 01_schema.sql     ← Main tables (patients, records)
│   ├── 02_storage.sql    ← File storage buckets
│   ├── 03_add_phone.sql  ← Phone column
│   ├── 04_medical_history.sql ← Medical conditions column
│   └── 05_medicines.sql  ← Medicines tracker table
│
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Login + Registration (3-step)
│   │   ├── dashboard/         ← Main patient dashboard
│   │   ├── profile/           ← Dedicated patient profile page
│   │   └── api/
│   │       ├── chat/          ← Gemini AI chat endpoint
│   │       └── extract/       ← PDF/image text extraction endpoint
│   │
│   ├── components/
│   │   ├── Header.tsx         ← Top navigation bar
│   │   ├── ExplainerChat.tsx  ← AI chat component
│   │   ├── MedicinesPanel.tsx ← Medicines tracker component
│   │   └── Uploader.tsx       ← Medical report uploader
│   │
│   ├── data/
│   │   └── dummy.ts           ← Offline demo patient data
│   │
│   └── lib/
│       └── supabase.ts        ← Supabase client configuration
│
└── README.md             ← This file
```

---

## 🗄️ Database Setup (Supabase)

Run these SQL files **in order** in your Supabase project's **SQL Editor**:

1. `supabase/01_schema.sql`
2. `supabase/02_storage.sql`
3. `supabase/03_add_phone.sql`
4. `supabase/04_medical_history.sql`
5. `supabase/05_medicines.sql`

> Detailed instructions are in `supabase/00_run_all.md`

---

## 🔑 API Keys Required

| Key | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `GOOGLE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (React) + Vanilla CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (PDFs & images)
- **AI**: Google Gemini 1.5 Flash API

---

## 👥 Team

Built for **Digital Pulse Hackathon** — MedAssist Phase 1
