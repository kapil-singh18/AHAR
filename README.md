# Smart Food Waste Prediction & Kitchen Management SaaS

## Project Structure

- `backend/` - Node.js, Express, MongoDB API (MVC)
- `frontend/` - React admin dashboard (Vite)

## 1) Setup and Run

### ML Service (required for waste + recommendations)

1. `cd ml-service`
2. `python -m pip install -r requirements.txt`
3. `python -m uvicorn app:app --host 0.0.0.0 --port 5001`

### Backend

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Ensure your `.env` has:
   - `MONGODB_URI=<your_mongodb_connection_string>`
   - `CORS_ORIGIN=http://localhost:5173` (recommended for browser use)
5. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Ensure your `.env` has:
   - `VITE_API_URL=http://localhost:5000/api`
5. `npm run dev`

Open the frontend URL shown by Vite (usually `http://localhost:5173`).

## 2) Quick Workflow (Recommended Order)

1. Add ingredients in **Inventory** page.
2. Add dishes in **Menu** page (using ingredient IDs from inventory items).
3. Enter cooked/consumed values in **Consumption** page.
4. Check demand in **Dashboard** page.
5. Check ML waste prediction in **Dashboard** page.
5. View trends in **Analytics** page.
6. If surplus risk is high, use **Donation Locator** page.
7. Use **Expiry Check** page for image-based mock freshness status.
8. Use **Dish Suggestions** page for ML recommendations.

## 3) How to Fill Each Page (Textbox-by-Textbox)

## Dashboard (`/`)
Use this page to predict demand and surplus.

- `Kitchen ID`: Enter your kitchen identifier. Example: `kitchen-nyc-001`
- `Past consumption CSV`: Comma-separated previous daily meal counts. Example: `120,130,115,140,125,132,138`
- `Day of Week`: Plain day text. Example: `Friday`
- `Expected People`: Number of people expected today. Example: `145`
- `Events CSV`: Comma-separated event names (optional). Example: `Founders Day,Music Fest`
- `Weather`: Simple text (optional). Example: `Rainy`

Click `Predict Demand`.

### Food Waste Prediction (ML)
Use this section to run the integrated food waste model.

- `Occupancy rate`: value from `0` to `1` (example: `0.85`)
- `Temperature (°C)`: numeric (example: `28`)
- `Prev day meals`: numeric
- `Prev 7-day avg meals`: numeric
- `Meals prepared`: numeric
- `Weather`: one of `clear`, `cold`, `hot`, `humid`, `rain`
- `Menu type`: one of `high_protein`, `light_meal`, `regional_special`, `special_festival`, `standard_nonveg`, `standard_veg`
- `Facility type`: example: `hostel`

Click `Predict Waste`.

Result meaning:
- `Predicted Quantity`: Suggested total meals to prepare
- `Surplus Risk`: `Yes` means likely overproduction
- `Donation Recommended`: `Yes` when surplus risk is true

## Menu Management (`/menu`)
Use this page to add dishes.

- `Kitchen ID`: Same kitchen ID you use elsewhere. Example: `kitchen-nyc-001`
- `Dish Name`: Dish label. Example: `Vegetable Pulao`
- `Ingredient ID`: Mongo `_id` of an ingredient already added in Inventory
- `Ingredient Name`: Readable ingredient name. Example: `Rice`
- `Amount per Meal`: Quantity of this ingredient needed for 1 meal. Example: `0.18`
- `Unit`: Unit for amount. Example: `kg`
- `Quantity per Person`: Portion multiplier per person. Example: `1`

Click `Add Dish`.

Important:
- Add ingredient(s) in Inventory first.
- `Ingredient ID` must be a valid MongoDB ID from your ingredient list.

## Inventory Tracking (`/inventory`)
Use this page to add stock items.

- `Kitchen ID`: Example: `kitchen-nyc-001`
- `Ingredient Name`: Example: `Rice`
- `Stock`: Current available quantity. Example: `85`
- `Unit`: Example: `kg`
- `Low-stock alert at`: Minimum safe stock level. If stock reaches this number or goes below it, app shows `Low Stock`. Example: `20`

Click `Add Ingredient`.

Status meaning:
- `Low Stock` when current stock is less than or equal to your low-stock alert value
- `Healthy` otherwise

## Daily Consumption Entry (`/consumption`)
Use this page to log how much was cooked and consumed.

- `Kitchen ID`: Example: `kitchen-nyc-001`
- `Select Dish`: Choose from existing dishes
- `Cooked`: Total meals cooked. Example: `140`
- `Consumed`: Total meals consumed. Example: `126`
- `Date`: Select the log date

Click `Save Log`.

System behavior:
- `Leftover = Cooked - Consumed`
- If consumed is more than cooked, request is rejected
- Ingredient stock auto-reduces based on dish recipe and cooked quantity

## Waste Analytics (`/analytics`)
Use this page for reports.

- `Kitchen ID`: Example: `kitchen-nyc-001`

Click `Load Analytics`.

Displays:
- Weekly sustainability report (`totalWaste`, `wasteReductionPercent`, `estimatedSavings`)
- Dish-wise waste list

## Image Expiry Detection (`/expiry`)
Use this page for mock freshness detection.

- File upload textbox: Choose a food image (`.jpg`, `.png`, etc.)

Click `Check Expiry`.

Returns mock status:
- `Fresh`
- `NearExpiry`
- `Spoiled`

## Donation Locator (`/donations`)
Use this page when surplus is likely.

- `Kitchen ID`: Example: `kitchen-nyc-001`
- `Radius (km)`: Search distance around your live location. Example: `10`

What happens:
- Browser asks location permission
- Map centers on your live location
- Nearby NGOs load as markers
- Data refreshes every 15 seconds

## 4) NGO Setup (Needed Before Locator Shows Results)

If no NGOs appear, create NGOs first via API.

### Create NGO API

`POST /api/donations/ngos`

Example body:

```json
{
  "kitchenId": "kitchen-nyc-001",
  "name": "City Harvest Outreach",
  "contactPerson": "Maya Collins",
  "phone": "+1-212-555-1901",
  "email": "pickup@cityharvest.org",
  "address": "150 W 30th St, New York, NY",
  "acceptedFoodTypes": ["Cooked Meals", "Packaged Meals"],
  "pickupAvailable": true,
  "operatingHours": "08:00 - 20:00",
  "location": {
    "type": "Point",
    "coordinates": [-73.9942, 40.7484]
  }
}
```

Note:
- `location.coordinates` format is `[longitude, latitude]`.

## 5) Main APIs

- `POST /api/predict-demand`
- `POST /api/predict-waste`
- `POST /api/recommend-dishes`
- `POST /api/events`
- `GET /api/events`
- `CRUD /api/menu`
- `CRUD /api/inventory`
- `POST /api/inventory/calculate-requirements`
- `POST /api/consumption`
- `GET /api/consumption`
- `GET /api/analytics/waste-dashboard`
- `GET /api/analytics/weekly-report`
- `POST /api/check-expiry`
- `POST /api/donations/ngos`
- `GET /api/donations/ngos`
- `GET /api/donations/nearby-ngos?lat=<lat>&lng=<lng>&radiusKm=10&kitchenId=kitchen-nyc-001`

## 6) Common Mistakes and Fixes

- Dish create fails with ingredient ID error:
  - Add ingredient first and use that exact Mongo `_id`.
- Donation map shows none:
  - Add NGO records and confirm matching `kitchenId`.
- Location not updating:
  - Allow browser location permission.
- CORS issues in browser:
  - Set backend `CORS_ORIGIN` to frontend URL (for example `http://localhost:5173`).
