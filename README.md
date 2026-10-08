# PayTm Clone - Money Transfer Application

A full-stack money transfer application inspired by Paytm. Users can sign up, sign in, search for other users and send them money from a simulated wallet balance. The backend is a Node.js/Express REST API backed by MongoDB, and the frontend is a React app built with Vite and Tailwind CSS.

## Features

- User sign up and sign in with JWT-based authentication (token stored in the browser's `localStorage`)
- Each new user gets an account with a random starting balance (between 1 and 10,001 INR)
- Search users by first or last name
- Send money to another user; transfers run inside a MongoDB transaction so both balances update together
- Balance check endpoint
- Logout from the dashboard dropdown menu

## Tech Stack

- **Backend:** Node.js, Express, Mongoose (MongoDB), jsonwebtoken, Zod (input validation), dotenv, cors
- **Frontend:** React 18, React Router, Axios, Vite, Tailwind CSS
- **Tooling:** `concurrently` to run backend and frontend together from the root

## Project Structure

```
PayTm/
├── package.json          # Root scripts to install and run both apps
├── backend/
│   ├── index.js          # Express server (port 3000), mounts routes at /api/v1
│   ├── db.js             # MongoDB connection and User / Account models
│   ├── config.js         # JWT secret
│   ├── middleware.js     # JWT auth middleware (Bearer token)
│   ├── routes/
│   │   ├── index.js      # Mounts /user and /account routers
│   │   ├── user.js       # signup, signin, update, bulk search
│   │   └── account.js    # balance, transfer
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx       # Routes: /signup, /signin, /dashboard, /send
        ├── pages/        # Signup, Signin, Dashboard, SendMoney
        └── components/   # Appbar, Balance, Users, Dropdown, form components
```

## Prerequisites

- Node.js and npm
- A MongoDB database. The transfer endpoint uses MongoDB transactions, so the database must be a replica set (for example, MongoDB Atlas or a local single-node replica set).

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/iSouvikKhan/PayTm.git
   cd PayTm
   ```

2. Install dependencies for the root, backend and frontend:

   ```bash
   npm run install-dependencies
   ```

   Or install each part manually with `npm install` in the root, `backend/` and `frontend/` folders.

3. Configure the backend environment. Copy the example file and set your MongoDB connection string:

   Linux/macOS:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Windows (Command Prompt):

   ```cmd
   copy backend\.env.example backend\.env
   ```

   Then edit `backend/.env`:

   ```
   ConnectionString="<your MongoDB connection string>/<db_name>"
   ```

   The JWT secret is defined in `backend/config.js`; change it before using the app anywhere outside local development.

## Running

From the repository root, start both the backend and the frontend:

```bash
npm start
```

- Backend API: `http://localhost:3000`
- Frontend: Vite dev server (by default `http://localhost:5173`)

The frontend calls the API at `http://localhost:3000`, so the backend must be running on that port.

To run them separately:

```bash
cd backend && npm start
cd frontend && npm run dev
```

Other frontend scripts: `npm run build`, `npm run preview`, `npm run lint`.

## API Endpoints

All routes are prefixed with `/api/v1`. Routes marked "auth" require an `Authorization: Bearer <token>` header.

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| POST | `/user/signup` | No | Body: `username` (email), `password`, `firstName`, `lastName`. Creates the user and account, returns a token. |
| POST | `/user/signin` | No | Body: `username`, `password`. Returns a token. |
| PUT | `/user` | Yes | Update `password`, `firstName` and/or `lastName`. |
| GET | `/user/bulk?filter=<text>` | No | Search users by first or last name. |
| GET | `/account/balance` | Yes | Returns the current user's balance. |
| POST | `/account/transfer` | Yes | Body: `to` (recipient user id), `amount`. Transfers money between accounts. |

## Notes

- This is a learning project. Passwords are stored in plain text and the JWT secret is hardcoded, so it is not suitable for production use.
- The dashboard currently shows a fixed balance value in the UI rather than fetching it from `/account/balance`.
