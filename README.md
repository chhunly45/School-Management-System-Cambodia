# Konpuk

Konpuk is a Cambodian local classifieds platform built with a React frontend and an Express/MongoDB backend. The repository is organized into two main application modules:

- `client/` — frontend application powered by Vite, React, TypeScript, Tailwind, and Axios.
- `server/` — backend API powered by Express, MongoDB, Cloudinary, authentication, and CSRF protection.

## Features

- User registration, login, password reset, and profile management
- Product listing creation, editing, deletion, and search filters
- Category management with admin and moderator controls
- Favorites and notification handling for signed-in users
- Chat and messaging between buyers and sellers
- Report submission for products or users
- Image uploads via Cloudinary
- Admin dashboard endpoints for user, product, and report moderation
- CSRF protection, rate limiting, and security middleware for production readiness

## Local setup

1. Clone the repository:

```bash
git clone https://github.com/chhunly45/Kh.Product.git
cd Kh.Product
```

2. Install backend dependencies:

```bash
cd server
npm install
```

3. Install frontend dependencies:

```bash
cd ../client
npm install
```

4. Create backend environment variables:

```bash
cd ../server
copy .env.production.example .env
```

Then edit `server/.env` with your local values.

5. Start the backend server:

```bash
npm run dev
```

7. From the repository root, promote a user to admin by email:
PowerShell:

```powershell
$env:MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/konpuk?retryWrites=true&w=majority"
npm run make:admin -- user@example.com
```

Or create `server/.env` with `MONGODB_URI` and run:
```bash
npm run make:admin -- user@example.com
```

8. Start the frontend app:

```bash
cd ../client
npm run dev
```

7. Open the Vite frontend URL shown in the terminal.

## Environment variables

### Backend (`server`)

Required variables:

- `PORT` — backend port (example: `4000`)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — secret used to sign JWT tokens
- `JWT_EXPIRES_IN` — access token lifetime (example: `1h`)
- `REFRESH_TOKEN_EXPIRES_IN` — refresh token lifetime (example: `7d`)
- `CLIENT_URL` or `CLIENT_ORIGIN` — frontend origin allowed by CORS
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret

Optional variables:

- `RATE_LIMIT_WINDOW_MS` — rate limit window in milliseconds
- `RATE_LIMIT_MAX` — maximum requests per window
- `AUTH_RATE_LIMIT_WINDOW_MS` — auth rate limit window in milliseconds
- `AUTH_RATE_LIMIT_MAX` — auth request limit per window
- `UPLOAD_DIR` — local upload directory (default: `uploads`)
- `NODE_ENV` — runtime environment (`development` or `production`)
- `CLOUDINARY_FOLDER` — Cloudinary upload folder (default: `marketplace`)
- `RESEND_API_KEY` — Resend API key for production email delivery
- `EMAIL_FROM` — sender email address for transactional emails

### Frontend (`client`)

Required environment variable:

- `VITE_API_BASE_URL` — backend API base URL, e.g. `https://your-backend.example.com/api`

## Render deployment

Render is configured via `render.yaml` at the repository root.

1. Connect your GitHub repository to Render.
2. Create a new Web Service for the backend.
3. Set the service root to `server`.
4. Use the build command:

```bash
npm install
```

5. Use the start command:

```bash
npm start
```

6. Add the required environment variables in Render, including:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NODE_ENV=production`

Important Render notes:
- Set `CLIENT_URL` (or `CLIENT_ORIGIN` / `FRONTEND_URL`) to `https://konpuk.com`.
- The backend already allows `https://konpuk.com` and `https://www.konpuk.com` by default.
- If your frontend runs at `https://kh-product.vercel.app` during preview, set `CLIENT_URL` accordingly.

7. Deploy the service.

8. Point the frontend `VITE_API_BASE_URL` to the rendered backend URL and ensure `CLIENT_URL` matches the frontend origin.

## Vercel deployment

1. Create a new Vercel project and connect your repository.
2. Set the project root to `client`.
3. Configure the install command:

```bash
npm install && npm --prefix client install
```

4. Configure the build command:

```bash
npm --prefix client run build
```

5. Configure the output directory:

```bash
client/dist
```

6. Add the following environment variable in Vercel project settings:

- `VITE_API_BASE_URL` — e.g. `https://your-backend.vercel.app/api`

Important Vercel notes:
- Set `VITE_API_BASE_URL` to your backend URL (for example the Render service URL) including the `/api` path, e.g. `https://your-backend.example.com/api`.
- Ensure your backend `CLIENT_URL` on Render is set to `https://konpuk.com` so CORS and CSRF cookies work when the site is live.
- During testing you can also point `VITE_API_BASE_URL` to `https://api.konpuk.com/api` (existing Render preview).

7. Deploy the frontend.

8. Update backend `CLIENT_URL` to the Vercel frontend URL and allow that origin in CORS.

## Cloudinary setup

1. Create a Cloudinary account at https://cloudinary.com.
2. Copy your Cloud name, API key, and API secret.
3. Add the values to backend environment variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (optional)

4. Backend uploads use Cloudinary and will print configuration status during startup.

## MongoDB setup

1. Create a cluster in MongoDB Atlas or run a local MongoDB instance.
2. Create a database user and whitelist your application host.
3. Use the connection string format:

```bash
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/konpuk?retryWrites=true&w=majority
```

4. Set `MONGODB_URI` in `server/.env` or your deployment platform.

## Running integration tests

Integration tests run from the backend package and use an in-memory MongoDB server.

```bash
cd server
npm run test:integration
```

This script:

- starts an in-memory MongoDB instance
- boots the Express app
- runs auth and profile flows against `/api`
- validates login OTP, password change, profile updates, and verification requests

## API overview

The server exposes the API under `/api`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/login/verify`
- `POST /api/auth/login/resend`
- `POST /api/auth/register/verify`
- `POST /api/auth/register/verify/resend`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/verify`
- `POST /api/auth/password-reset/confirm`
- `POST /api/auth/password-reset/resend`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/verification-request`

### Categories

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories` (admin/moderator)
- `PUT /api/categories/:id` (admin/moderator)
- `DELETE /api/categories/:id` (admin)

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (authenticated)
- `PUT /api/products/:id` (authenticated)
- `DELETE /api/products/:id` (authenticated)

### Favorites

- `GET /api/favorites`
- `GET /api/favorites/count`
- `GET /api/favorites/check/:productId`
- `POST /api/favorites/:productId`
- `DELETE /api/favorites/:productId`

### Uploads

- `POST /api/upload` (authenticated)
- `DELETE /api/upload/:id` (authenticated)

### Chats

- `GET /api/chats` (authenticated)
- `GET /api/chats/:id` (authenticated)
- `POST /api/chats` (authenticated)
- `POST /api/chats/:id/messages` (authenticated)
- `PATCH /api/chats/:id/read` (authenticated)

### Reports

- `POST /api/reports` (authenticated)
- `GET /api/reports/me` (authenticated)

### Notifications

- `GET /api/notifications` (authenticated)
- `GET /api/notifications/count` (authenticated)
- `PATCH /api/notifications/:id/read` (authenticated)

### Admin

- `GET /api/admin/overview` (admin/moderator)
- `GET /api/admin/users` (admin/moderator)
- `PATCH /api/admin/users/:id/status` (admin/moderator)
- `GET /api/admin/products` (admin/moderator)
- `PATCH /api/admin/products/:id/status` (admin/moderator)
- `GET /api/admin/reports` (admin/moderator)
- `PATCH /api/admin/reports/:id` (admin/moderator)

---

## Notes

- Frontend development runs from `client/` and builds to `client/dist`.
- Backend development runs from `server/` and listens on the configured `PORT`.
- Make sure `CLIENT_URL`/`CLIENT_ORIGIN` and `VITE_API_BASE_URL` are aligned in deployment.
