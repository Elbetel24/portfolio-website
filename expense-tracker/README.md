# Expense Tracker (Minimal Full-Stack)

Features:

- User signup / login (JWT)
- Add / edit / delete expenses
- Categories
- Monthly summary endpoint for charts
- Search / filter / pagination

Quick start:

1. Install dependencies:

```bash
cd expense-tracker
npm install
```

2. Create `.env` from `.env.example` and set `MONGO_URI` and `JWT_SECRET`.

3. Start server:

```bash
npm run dev
```

4. Open `http://localhost:4000` to use the static frontend.

Deployment: any Node host + a MongoDB instance (Atlas / Render / Railway).
