# 🗄️ Supabase Database Setup Guide

## How to set up the MedAssist database

1. Go to **https://supabase.com** and open your project
2. Click **SQL Editor** in the left sidebar
3. Run each `.sql` file below **in order** (paste content → click Run)

---

## Files to run (in this exact order):

| Order | File | What it does |
|---|---|---|
| 1️⃣ | `01_schema.sql` | Creates the main `patients` and `medical_records` tables |
| 2️⃣ | `02_storage.sql` | Sets up the file upload storage bucket |
| 3️⃣ | `03_add_phone.sql` | Adds phone number column to patients |
| 4️⃣ | `04_medical_history.sql` | Adds medical conditions column to patients |
| 5️⃣ | `05_medicines.sql` | Creates the medicines tracker table |

> ✅ All files use `IF NOT EXISTS` so it's safe to re-run them.

---

## After running all files, your Supabase project will have:
- `patients` table — stores patient profiles
- `medical_records` table — stores uploaded reports  
- `medicines` table — stores current medicines
- `record_uploads` storage bucket — stores PDF/image files
