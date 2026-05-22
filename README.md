# 🫙 Strikethrough — Setup Guide

## What changed
Auth is now **Google Sign-In** — no passwords, no forms. One tap and users are in.
Their Google account name and photo are used automatically.

---

## Setup steps

### 1. Firebase project & Firestore
*(Same as before — skip if already done)*
- [console.firebase.google.com](https://console.firebase.google.com) → your project
- Build → Firestore Database → Create database → Test mode

### 2. Enable Google Sign-In ← NEW STEP
1. Firebase Console → **Build → Authentication**
2. Click **"Get started"**
3. Click **"Google"** under Sign-in providers
4. Toggle it **Enable**
5. Enter your **Project support email** (your Gmail)
6. Click **Save**

### 3. Add your domain to Authorised domains ← IMPORTANT
1. Still in Authentication → **Settings** tab
2. Scroll to **Authorised domains**
3. Click **Add domain**
4. Add your Netlify URL e.g. `amazing-name-123.netlify.app`
5. Click **Add**

*(localhost is already there for local testing)*

### 4. Paste Firebase config
Open `src/js/config.js` → paste your firebaseConfig values (same as before)

### 5. Update Firestore Rules
Firebase Console → Firestore → **Rules** tab
Replace everything with the contents of `firestore.rules` → **Publish**

### 6. Deploy to Netlify
Drag the `kotsu3/` folder onto [netlify.com](https://netlify.com) → done ✅

---

## How it works now
- User taps **Continue with Google** → Google popup appears
- They pick their Google account → instantly logged in
- Their Firebase UID is used as `userId` on all habits
- Logging out and back in restores all their data automatically
- Works across any device with the same Google account
