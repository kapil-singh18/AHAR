# AHAR Phase 1 Audit

## Architecture

- React 18/Vite/Tailwind frontend in `frontend/`, deployed as a Vercel SPA.
- Express/Mongoose backend in `backend/`, deployed as a Render web service.
- MongoDB stores kitchen operations and prediction records.
- FastAPI ML service in `ml-service/`; Phase 1 does not alter model files or algorithms.

## Authentication baseline and result

The original application used a third-party hosted sign-in provider in the frontend and backend. It had no local User model, password credentials, refresh-cookie mechanism, or refresh-token rotation.

Phase 1 replaced that flow with:

- bcrypt password hashing.
- Short-lived JWT access tokens.
- HttpOnly refresh cookies.
- Hash-only refresh-token persistence and rotation.
- Refresh reuse detection.
- `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, and `/api/auth/me`.
- Frontend auth context, protected routes, and one-flight Axios refresh.
- Active-kitchen scoping and mismatched kitchen-ID rejection.

## Problems identified

- The frontend depended on provider components and provider bearer-token hooks.
- Protected routes did not verify kitchen ownership for every resource.
- Frontend pages submitted hardcoded kitchen identifiers.
- Inventory used local/mock state instead of backend inventory APIs.
- Donation UI used mock partner and history records.
- Prediction UI simulated loading and donation notifications.
- The demand controller had a formula fallback that could present invented output.
- The CSS used gradients, glass-like surfaces, high rounding, shadows, and animations.
- Duplicate legacy pages were not routed in the application.

## Files modified or added

- Frontend shell: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/AppSidebar.jsx`, `src/components/AppHeader.jsx`, and `src/styles/global.css`.
- JWT state: `src/context/AuthContext.jsx` and `src/services/api.js`.
- Authentication pages: `src/pages/SignInPage.jsx` and `src/pages/SignUpPage.jsx`.
- Operational pages: overview, forecasting, analytics, menu, inventory, consumption, and donations.
- Backend auth: `models/User.js`, `routes/authRoutes.js`, `controllers/authController.js`, and `middleware/authMiddleware.js`.
- Backend configuration and environment examples.

## Dependencies removed

- Hosted frontend authentication React package.
- Hosted backend authentication Express package.
- Framer Motion.
- Leaflet and react-leaflet, because the redesigned donation page now uses only backend partner records.
- Geolib.

## Deployment risks

- Vercel and Render are cross-origin. Production requires `Secure`, `SameSite=None`, `credentials: true`, and an exact CORS origin allowlist.
- Refresh secrets and MongoDB credentials must be configured only as Render environment variables.
- `VITE_API_URL` must point to the deployed backend `/api` URL.
- MongoDB and the FastAPI demand service must be reachable from Render.
- The ML unavailable state now returns HTTP 503 instead of fallback prediction data.

## Remaining implementation constraints

- The repository has string kitchen IDs but no Kitchen model or membership management. User records contain `activeKitchenId` and `kitchenIds`; registration defaults to `kitchen-nyc-001`.
- Creating new independent kitchens is not available through the current backend.
- No persisted donation-history workflow exists; the redesigned page reports this explicitly.
- No live integration test was run until MongoDB and external service availability are confirmed.
