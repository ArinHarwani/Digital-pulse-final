<div align="center">

# 🚨 Digital Pulse

### AI-Powered Emergency Response Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Mapbox](https://img.shields.io/badge/Mapbox-Navigation-4264FB?style=for-the-badge&logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TextBee](https://img.shields.io/badge/TextBee-SMS_Alerts-FF6B6B?style=for-the-badge)](https://textbee.dev/)

**Reducing emergency response time from minutes to seconds.**

[Quick Start](#-quick-start) · [Architecture](#-architecture) · [Features](#-key-features) · [Tech Stack](#-tech-stack)

</div>

---

## 📌 Problem Statement

In India, **delayed ambulance arrival, lack of coordination, and absence of immediate first aid guidance** result in thousands of preventable deaths each year. The critical "golden hour" is often lost due to fragmented communication between patients, ambulances, and hospitals.

## 💡 Our Solution

**Digital Pulse** is a unified, real-time emergency response ecosystem that connects **patients, ambulance drivers, and hospitals** through four synchronized interfaces — enabling instant alerts, intelligent dispatch, live tracking, and pre-arrival hospital preparedness.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DIGITAL PULSE                            │
├──────────────┬──────────────┬───────────────┬───────────────────┤
│              │              │               │                   │
│  📱 Patient  │  🚨 Emergency│  🚑 Ambulance │  🏥 Hospital      │
│    Portal    │   Trigger    │    Driver     │   Dashboard       │
│  (Next.js)   │   (Vite)     │   (Vite)      │    (Vite)         │
│  Port 3000   │  Port 3003   │  Port 3002    │   Port 3001       │
│              │              │               │                   │
├──────────────┴──────────────┴───────────────┴───────────────────┤
│                    Supabase (Realtime DB)                        │
├──────────────┬──────────────┬───────────────┬───────────────────┤
│  📍 Mapbox   │  🤖 Gemini   │  💬 Groq LLM  │  📲 TextBee SMS  │
│  Navigation  │  AI Assist   │  First Aid    │  Family Alerts    │
└──────────────┴──────────────┴───────────────┴───────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **[Node.js](https://nodejs.org/)** v18 or higher
- **Windows OS** (for the one-click launcher)
- **`PRIVATE_KEYS.env`** file (provided privately by the team)

### 3-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/ArinHarwani/Digital-pulse-final.git
cd Digital-pulse-final

# 2. Place PRIVATE_KEYS.env in the root directory
#    (You should have received this file from the team)

# 3. Double-click START.bat
#    This will install all dependencies, configure API keys,
#    and launch all 4 interfaces automatically!
```

> **That's it!** All 4 interfaces will open in separate terminal windows.

| Interface | URL | Description |
|:---|:---|:---|
| 🩺 **Patient Portal** | `http://localhost:3000` | Health dashboard + SOS button |
| 🚨 **Emergency Trigger** | `http://localhost:3003` | One-tap emergency activation |
| 🚑 **Ambulance Driver** | `http://localhost:3002` | Alert reception + navigation |
| 🏥 **Hospital Dashboard** | `http://localhost:3001` | Pre-arrival patient readiness |

---

## ✨ Key Features

### 🔴 One-Tap Emergency Activation
- Large SOS button with 10-second safety countdown
- Instant GPS location capture with intelligent fallback
- Automatic SMS notification to registered family members via TextBee

### 🚑 Intelligent Ambulance Dispatch
- Real-time emergency alerts via Supabase Realtime
- Live route navigation powered by Mapbox Directions API
- Nearest hospital selection with **ICU & ER bed availability**
- Distance and ETA calculations using Haversine algorithm

### 🏥 Hospital Pre-Arrival Preparedness
- Incoming patient alerts with medical history (allergies, blood type, conditions)
- AI-powered patient summary via Google Gemini
- Live ambulance tracking on interactive map
- ICU and Emergency bed capacity monitoring

### 🩺 Patient Health Portal (Digital Pulse)
- Centralized health records management
- Medical history, prescriptions, and lab reports
- AI health assistant powered by Gemini
- Emergency button integrated directly into dashboard

### 🤖 AI-Powered Assistance
- **First Aid Guidance** — Groq LLM provides real-time first aid instructions
- **Medical AI Chat** — Gemini-powered health assistant in patient portal
- **Patient Summary** — AI-generated clinical briefs for hospital staff

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | Next.js, React, Vite, TypeScript | UI for all 4 interfaces |
| **Styling** | Tailwind CSS, shadcn/ui, Glassmorphism | Premium dark-mode design |
| **Database** | Supabase (PostgreSQL + Realtime) | Data storage + live subscriptions |
| **Maps** | Mapbox GL, Leaflet, Directions API | Navigation + route visualization |
| **AI** | Google Gemini, Groq LLama | Medical AI + first aid guidance |
| **SMS** | TextBee Gateway | Family emergency notifications |
| **Auth** | Supabase Auth | Patient & driver authentication |

---

## 📂 Project Structure

```
Digital-pulse-final/
├── patient-portal/          # 🩺 Next.js patient health dashboard
│   ├── src/app/             #    Pages (login, dashboard, SOS, profile)
│   └── src/components/      #    EmergencyButton, Header, AI panels
│
├── emergency-trigger/       # 🚨 Vite emergency activation interface
│   ├── src/pages/           #    HomeScreen with SOS trigger
│   └── src/components/      #    Map, AI chat, emergency controls
│
├── ambulance-driver/        # 🚑 Vite ambulance driver dashboard
│   ├── src/pages/           #    DriverDashboard, DispatchDetails
│   └── src/components/      #    MapPreview, StatusBadge, alerts
│
├── hospital-dashboard/      # 🏥 Vite hospital management interface
│   ├── src/pages/           #    Dashboard with live patient tracking
│   └── src/components/      #    AmbulanceTracker, StatsPanel, AI chat
│
├── database/                # 🗃️ SQL scripts for Supabase setup
│   ├── master_schema.sql    #    Core tables (patients, emergencies)
│   ├── master_hospitals.sql #    Hospital data (Jaipur + Jodhpur)
│   └── enable_realtime.sql  #    Realtime subscriptions
│
├── START.bat                # 🚀 ONE-CLICK: Install + Configure + Launch
├── setup_config.js          #    API key distribution script
├── PRIVATE_KEYS.env.example #    Template for API keys
└── README.md                #    You are here!
```

---

## 🗄️ Database Setup

If setting up your own Supabase instance, run these SQL scripts in the **Supabase SQL Editor** in order:

1. `database/master_schema.sql` — Core tables (patients, emergencies, users)
2. `database/master_hospitals.sql` — Hospital data with GPS coordinates
3. `database/enable_realtime.sql` — Enable real-time subscriptions

---

## 🌍 Emergency Flow

```
Patient triggers SOS
       │
       ▼
┌──────────────┐    SMS     ┌──────────────┐
│  GPS + Alert │ ─────────► │ Family Member │
│  Captured    │            └──────────────┘
└──────┬───────┘
       │ Supabase Realtime
       ▼
┌──────────────┐  Accept    ┌──────────────┐
│  Ambulance   │ ─────────► │  Route to    │
│  Driver Alert│            │  Patient     │
└──────────────┘            └──────┬───────┘
                                   │ Pick up patient
                                   ▼
                            ┌──────────────┐
                            │ Select Hosp. │
                            │ (ICU/ER beds)│
                            └──────┬───────┘
                                   │ Navigate to hospital
                                   ▼
                            ┌──────────────┐
                            │  Hospital    │
                            │  Prepared    │
                            │  (AI Brief)  │
                            └──────────────┘
```

---

## 🔮 Future Scope

- Integration with government emergency services (112/108)
- Wearable device emergency triggers (smartwatches)
- Predictive analytics for ambulance placement
- Multi-language support for rural areas
- Police and fire brigade integration

---

## 👥 Team

Built with ❤️ for the hackathon by the **Digital Pulse** team.

---

<div align="center">

**⭐ If you found this project useful, consider starring the repository! ⭐**

</div>
