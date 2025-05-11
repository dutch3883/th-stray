# Stray Cat Reporter

[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/dutch3883/a467edbe2a1e888a4e18ff8c1097b5ec/raw/210528a5b55324f9c0b773bfcf27c7993b95095b/gistfile1.txt)](https://github.com/dutch3883/th-stray/actions)

A full‐stack application to let users report injured, sick, or stray cats on a map—so rescue organizations can respond quickly. Built with a React + Vite + Tailwind front-end and Firebase serverless back-end.

---

## 📋 Features

### User
- **Sign in** with Google (Firebase Auth)
- **Report a cat**:
  - Select **number**, **type** (stray / injured / sick / kitten)
  - Upload up to **3 photos**
  - **Pick location** on a map (Thai locale, reverse-geocoded, strips out Plus Codes)
  - Submit the report via a Firebase **callable function**
- **View your reports** in a table:
  - Filter by status: **pending**, **complete**, **cancelled**
  - Edit reports that are still pending

### Admin
- **Dashboard** with:
  - **List view** (tabular, filterable by status, sorted by date desc)
  - **Map view** (pins for every report)
- **Change status** of any report to **complete** or **cancelled**, with:
  - Confirmation prompt
  - Optional **proof photo** upload (stored in Firebase Storage)
  - Admin notes / cancellation reason

---

## 🏗 Tech Stack

### Front-end
- **React 18** + **Vite**  
- **Tailwind CSS** (utility-first styling)  
- **@react-google-maps/api** for the map & geolocation  
- **Firebase client SDKs**:  
  - `firebase/auth`  
  - `firebase/firestore`  
  - `firebase/functions` (callable functions)  
  - `firebase/storage`

### Back-end
- **Firebase Cloud Functions** (TypeScript)  
  - `createReport`, `listMyReports`, `adminListReports`, `changeStatus`  
- **Firestore** for structured report data  
- **Firebase Auth** for user & admin identity  
- **Firebase Storage** for image uploads  
- **GitHub Actions** + **Workload Identity Federation** for CI/CD
