# Blogging Vlog

Modern multi-page blogging/vlogging playground built with vanilla HTML/CSS on the front-end and an Express backend that stores blog posts and users in `data.json`. Writers can create accounts (email/password or Google OAuth), compose rich posts with featured images, and browse everything from the home page.

## Features
- Responsive landing, auth, profile, upload, and admin pages under `public/`
- Email/password signup & login persists to `data.json`; sessions managed with `express-session`
- Rich-text-ish editor on `upload.html` with inline formatting, character counters, and image preview
- Image uploads handled by `multer`, saved to `/uploads` and served statically
- Google OAuth helper (`/auth/google`) that verifies tokens and auto-creates users
- REST endpoints for creating, listing, editing, and deleting vlogs

## Tech Stack
- Frontend: HTML, CSS (`public/style.css`), vanilla JS (`public/script.js`), Remix Icons
- Backend: Node.js, Express 5, Multer, express-session, cors, body-parser
- Storage: Local JSON file (`data.json`) plus uploaded assets under `/uploads`

## Project Layout
```
.
├── public/           # Static frontend (index, profile, upload, auth pages, CSS, JS)
├── uploads/          # Image files saved by Multer
├── middleware/
│   └── googleAuth.js # Google OAuth helpers + low-level data access
├── models/           # Mongoose models (not wired up yet, but ready for MongoDB)
├── server.js         # Main Express API + static file host
├── vlog/server.js    # Older lowdb prototype server (optional)
├── data.json         # Runtime data store (users + vlogs)
├── package.json
└── README.md
```

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create `.env`** (root)
   ```env
   PORT=3000                 # optional, defaults to 3000
   SESSION_SECRET=replace_me
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```
3. **Run the server**
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000` to use the app.

Uploads land in `uploads/` and metadata persists in `data.json`. Delete those files if you want a clean slate.

## Key Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST   | `/signup` | Create local account (username, email, password) |
| POST   | `/login` | Login via email + password |
| POST   | `/upload` | Create vlog (multipart form with `image`) |
| GET    | `/vlogs` | List all vlogs |
| GET    | `/uservlogs/:username` | List vlogs for a specific author |
| PUT    | `/vlogs/:id` | Edit a vlog you own (optional new image) |
| DELETE | `/vlogs/:id/:username` | Delete a vlog you own |
| POST   | `/auth/google` | Verify Google ID token and create/login user |
| GET    | `/auth/user` | Read current session user |
| POST   | `/auth/logout` | Destroy session |

## Frontend Highlights
- `index.html`: Landing page that mixes curated example vlogs with live data from `/vlogs`
- `upload.html`: Sticky form with formatting toolbar, FileReader preview, frontend validation, and fetch to `/upload`
- `profile.html`: Pulls logged-in user info from `localStorage` and shows their posts
- `admin.html`: Minimal page for future moderation tooling

All shared interactivity lives in `public/script.js` (auth flows, vlog renderer, modal, logout, etc.).

## Development Notes & Suggestions
- Current persistence uses flat files; the unused Mongoose models show how you can evolve to MongoDB.
- Remember to keep `uploads/` writeable by the server; it is created automatically on boot.
- For production harden passwords (hash with bcrypt), enforce HTTPS cookies, and move secrets out of repo.
- The legacy `vlog/server.js` expresses earlier experiments; remove or update it if you only need `server.js`.

Happy blogging! 🎥📝

