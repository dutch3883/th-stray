# Stray Cat Reporter

[![Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/dutch3883/a467edbe2a1e888a4e18ff8c1097b5ec/raw/210528a5b55324f9c0b773bfcf27c7993b95095b)](https://github.com/dutch3883/th-stray/actions)

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
  - Report Management:
    - `createReport`: Create a new cat report (roles: reporter)
    - `listReports`: List all reports with filtering (roles: admin, rescuer)
    - `listMyReports`: List reports created by the current user (roles: reporter)
    - `completeReport`: Mark a report as completed (roles: admin, rescuer)
    - `putReportOnHold`: Put a report on hold (roles: admin, rescuer)
    - `cancelReport`: Cancel a report (roles: admin, rescuer)
  - User Management:
    - `createUser`: Create a new user (roles: admin)
    - `listUsers`: List all users (roles: admin)
    - `updateUser`: Update user details (roles: admin)
    - `deleteUser`: Delete a user (roles: admin)
  - Role Management:
    - `setUserRole`: Set a user's role (roles: admin)
    - `getUserRole`: Get a user's role (roles: admin)
- **Firestore** for structured report data  
- **Firebase Auth** for user & admin identity  
- **Firebase Storage** for image uploads  
- **GitHub Actions** + **Workload Identity Federation** for CI/CD

### User Roles
- **admin**: Full access to all functions and data
- **rescuer**: Can view and manage reports
- **reporter**: Can create and view their own reports

### Report Status
- **pending**: New report awaiting action
- **on_hold**: Report temporarily paused
- **completed**: Report successfully resolved
- **cancelled**: Report cancelled

### Report Types
- **stray**: Stray cat
- **injured**: Injured cat
- **sick**: Sick cat
- **kitten**: Kitten
