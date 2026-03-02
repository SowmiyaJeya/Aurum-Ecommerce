# Aurum Auth — React + Vite

A clean light-theme Login & Register UI with OTP verification, built with React 18 and Vite 5.

---

## 📁 Folder Structure

```
auth-app/
├── index.html                  ← HTML entry point (Vite root)
├── vite.config.js              ← Vite + React plugin config
├── package.json                ← Dependencies & scripts
├── README.md                   ← This file
│
└── src/
    ├── main.jsx                ← ReactDOM.createRoot — mounts <App />
    ├── App.jsx                 ← Root: tab switcher (Login / Register)
    │
    ├── components/
    │   ├── LoginForm.jsx       ← Login form with username + password validation
    │   ├── RegisterForm.jsx    ← Register form with 5 fields + all validations
    │   ├── OtpStep.jsx         ← 6-box OTP entry with auto-focus & paste support
    │   ├── PasswordStrength.jsx← 4-level strength bar for password field
    │   └── Toast.jsx           ← Slide-in toast notification
    │
    └── styles/
        ├── global.css          ← CSS variables (design tokens), resets, keyframes
        ├── Auth.css            ← All auth page / card / form / OTP styles
        └── Toast.css           ← Toast animation & layout styles
```

---

## 🚀 How to Run

### Step 1 — Install dependencies
```bash
cd auth-app
npm install
```

### Step 2 — Start development server
```bash
npm run dev
```
Open your browser at **http://localhost:5173**

### Step 3 — Build for production (optional)
```bash
npm run build
```
Output goes to `dist/` folder.

### Step 4 — Preview production build (optional)
```bash
npm run preview
```

---

## ✅ Validations

### Login Form
| Field    | Rules                                  |
|----------|----------------------------------------|
| Username | Required, min 3 characters             |
| Password | Required, min 6 characters             |

### Register Form
| Field         | Rules                                                      |
|---------------|------------------------------------------------------------|
| Full Name     | Required · Min 3 chars · Letters & spaces only             |
| Username      | Required · 3–20 chars · Alphanumeric + underscore only     |
| Password      | Required · Min 8 chars · Must have uppercase + digit       |
| Mobile Number | Required · 10-digit Indian format (starts with 6–9)        |
| Email         | Required · Valid email format (user@domain.com)            |

### OTP Step
- All 6 boxes must be filled before verifying
- Supports paste — paste a 6-digit code to fill all boxes at once
- Backspace moves focus to previous box automatically

---

## 🎨 Design Highlights
- **Light theme** — warm ivory background with deep teal accents
- **Fonts** — Cormorant Garamond (headings) + DM Sans (body)
- **Animated blobs** — soft pastel background depth
- **Password strength meter** — 4-level live indicator
- **Toast notification** — slides in from top-right after OTP send
- **Responsive** — works on mobile down to 320px width
