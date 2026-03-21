# 🚀 How to Upload MedAssist to GitHub

Follow these steps to put your project on GitHub and share it with your team.

---

## Option A — GitHub Desktop (EASIEST, recommended for beginners)

1. **Download GitHub Desktop**: https://desktop.github.com/
2. Install and sign in with your GitHub account.
3. Click **"Add an Existing Repository from your Hard Drive"**
4. Browse to: `C:\Users\LENOVO\OneDrive\Desktop\MesAssist`
5. Click **"create a repository"** when prompted.
6. Type a good summary like: *"AI-powered medical assistant webapp"*
7. Click **Publish Repository** → uncheck "Keep this code private" if you want it public.
8. Done! Copy the GitHub link (e.g. `https://github.com/YOUR_USERNAME/MedAssist`) and share with team.

---

## Option B — Git in Terminal (if Git is installed)

Open PowerShell in the MesAssist folder and run these one by one:

```powershell
git init
git add .
git commit -m "Initial commit: MedAssist Digital Pulse"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/MedAssist.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 📤 What to send your team privately

After pushing, send your team two things:
1. The **GitHub link** (e.g. `https://github.com/your-name/MedAssist`)
2. The **`.env.local` file** content (this is private — send via WhatsApp/email, NOT on GitHub)

---

## 📥 What your team needs to do (super simple)

Send them this message:

> "Hey! Clone the project and follow these steps:
> 1. Install Node.js from https://nodejs.org (click the green LTS button)
> 2. Download the project from GitHub: Code → Download ZIP → extract it
> 3. Open the folder, paste the `.env.local` file I send you inside it
> 4. Open a terminal in that folder and run: `npm install`
> 5. Then run: `npm run dev`
> 6. Open http://localhost:3000 in your browser. Done! 🎉"

---

## ⚠️ IMPORTANT: .env.local is NEVER on GitHub

The `.gitignore` file already makes sure your API keys are NEVER uploaded.
The `.env.example` on GitHub shows the format without the actual keys.
