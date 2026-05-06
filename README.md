# GuruSala — React + Node.js

Free educational video platform for Sri Lanka students.

## Quick Start (Local Development)

```bash
# 1. Install all dependencies
npm run install:all

# 2. Setup server environment
cd server
cp .env.example .env
# Edit .env — set ADMIN_PASSWORD and SESSION_SECRET at minimum

# 3. Run both server and client
cd ..
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Admin: http://localhost:3000/admin

## Project Structure

```
gurusala/
├── package.json          ← Root scripts (run both server + client)
├── server/               ← Node.js + Express backend
│   ├── index.js
│   ├── .env.example
│   ├── config/google.js
│   ├── routes/api.js
│   ├── routes/admin.js
│   ├── middleware/auth.js
│   └── data/
│       ├── videos.json       ← 8,625 base videos (from Excel)
│       ├── materials.json    ← 26 Drive materials
│       ├── submissions.json  ← Pending queue
│       ├── views.json        ← View counts
│       └── reports.json      ← Tag reports
└── client/               ← React + Vite frontend
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── AdminLogin.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── components/
    │   │   ├── VideoCard.jsx
    │   │   ├── VideoModal.jsx
    │   │   ├── SubmitModal.jsx
    │   │   └── ui.jsx
    │   └── utils/
    │       ├── api.js
    │       └── helpers.js
    └── vite.config.js    ← Proxies /api to port 5000
```

## Deploy to Ubuntu Server

```bash
# Build React
npm run build

# Start server (serves React build + API)
NODE_ENV=production npm start

# With PM2
pm2 start server/index.js --name gurusala
pm2 startup && pm2 save
```

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Server port (default: 5000) |
| NODE_ENV | production or development |
| ADMIN_PASSWORD | Your admin password |
| SESSION_SECRET | Long random string (64+ chars) |
| GOOGLE_SHEET_ID | Google Spreadsheet ID |
| GOOGLE_CREDENTIALS | Service account JSON (one line) |
