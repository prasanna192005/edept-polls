# edept polls ⚡

Because asking "any questions?" at the end of a meeting and getting zero response is a pain we're here to fix. **edept polls** is a real-time, anonymous, and actually-fun-to-use polling platform built for engagement, not awkward silence.

## The Why

This project was born during my internship at **edept**. Why? Because using other polling websites is a headache. You either pay way too much or get stuck with a "free" tier that caps participants and locks the best features. I wanted a tool that just works—no limits, no premium gates, and all the features needed for real sessions.

## Core Features (The good stuff)

*   **Real-time Results:** Watch the bars move in real-time. It's oddly satisfying.
*   **Total Anonymity:** Participants can speak their truth without the fear of judgment. 
*   **Admin Overlord Dashboard:** Create, manage, and delete sessions with absolute power.
*   **Next.js + Firebase:** Fast, snappy, and powered by Google's Realtime Database.

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-FFAB00?style=for-the-badge&logo=lucide&logoColor=white)

## High-Level Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-username/edept-polls.git
cd edept-polls
npm install
```

### 2. Environment Variables
Rename `.env.example` (or just check `.env.local`) and fill in your Firebase credentials. You'll need:
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
*   ...and the rest of the standard Firebase config family.

### 3. Run it
```bash
npm run dev
```
Head over to `http://localhost:3000` and start the revolution.

## Admin Access
Check out `/admin/login` to see the magic behind the curtain. Don't forget to set up your Firebase Auth and Database rules first (check `firebase-rtdb-rules.json`).

---
Built with ☕ and minimal emojis by the edept team.

