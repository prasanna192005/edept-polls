# Firebase Setup Guide

## 1. Firebase Console Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Realtime Database** (not Firestore)
4. Enable **Authentication** > Email/Password

### Get Configuration
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click "Web app" icon to add a web app
4. Copy the config values

### Create Admin User
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password for admin account

### Get Service Account Key
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely

## 2. Environment Variables

Fill in your \`.env.local\` file with the values:

\`\`\`env
# From Firebase Web App Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# From Service Account JSON
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour\\nPrivate\\nKey\\nHere\\n-----END PRIVATE KEY-----\\n"
\`\`\`

**Important:** The private key must have `\\n` as literal text (not actual newlines).

## 3. Firebase Realtime Database Rules

1. Go to Realtime Database > Rules
2. Copy the contents from \`firebase-rtdb-rules.json\`
3. Paste and publish

## 4. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Visit:
- Admin: http://localhost:3000/admin/login
- Participants: http://localhost:3000

## 5. Deploy to Vercel

\`\`\`bash
vercel
\`\`\`

Don't forget to add all environment variables in Vercel dashboard!
