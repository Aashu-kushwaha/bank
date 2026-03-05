# Ledger Bank — Frontend

A professional frontend for the Ledger Bank backend API.

## 📁 Folder Structure

```
ledger-bank-frontend/
├── index.html                  ← Landing page
├── assets/
│   └── css/
│       └── main.css            ← Design system & global styles
├── pages/
│   ├── login.html              ← Login page
│   ├── register.html           ← Registration page
│   ├── dashboard.html          ← Main dashboard with balance
│   ├── send.html               ← Send money page
│   ├── transactions.html       ← Transaction history
│   └── profile.html            ← User profile
├── services/
│   └── api.js                  ← All API calls (auth, accounts, transactions)
├── utils/
│   ├── auth.js                 ← Session management (localStorage)
│   └── format.js               ← Currency, date, ID formatting
└── components/
    └── sidebar.html            ← Sidebar reference
```

## 🚀 Setup

### Option 1 — Serve locally
```bash
# Using VS Code Live Server extension, or:
npx serve .
# Then open http://localhost:3000
```

### Option 2 — Deploy to Netlify / Vercel
1. Push this folder to GitHub
2. Connect to Netlify or Vercel
3. Set publish directory to `/` (root)
4. Deploy

### Option 3 — Host alongside backend
Copy the entire frontend folder into your Express project and serve it statically:
```javascript
// In app.js
app.use(express.static(path.join(__dirname, '../ledger-bank-frontend')))
```

## ⚙️ Configuration

The API base URL is set in `services/api.js`:
```javascript
const BASE_URL = 'https://ledger-bank.onrender.com/api';
```
Change this to `http://localhost:3000/api` for local development.

## 🔗 Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Public landing page |
| Login | `/pages/login.html` | User login |
| Register | `/pages/register.html` | New account |
| Dashboard | `/pages/dashboard.html` | Balance + quick actions |
| Send Money | `/pages/send.html` | Transfer funds |
| Transactions | `/pages/transactions.html` | History + filters |
| Profile | `/pages/profile.html` | Account info |

## 🎨 Design

- **Theme**: Dark luxury with gold accents
- **Fonts**: Playfair Display (headings) + DM Sans (body) + DM Mono (IDs/amounts)
- **Colors**: Deep navy background with gold (#c9a84c) primary accent
