# Food Waste Management - Prediction Interface Update

## Changes Made

### 1. Unified Dashboard Interface (frontend/src/pages/Dashboard.jsx)
- **REMOVED**: Two separate prediction boxes ("Prediction Inputs" and "Food Waste Prediction (ML)")
- **ADDED**: Single unified "Demand Prediction" box with Box 1 input fields:
  - Kitchen ID
  - Past Consumption (CSV format)
  - Day of Week
  - Expected People
  - Events (CSV format)
  - Weather

### 2. ML Integration
- Unified form connects to `/predict-demand` endpoint
- Backend processes inputs and uses ML model or fallback calculation
- Results show:
  - Predicted Quantity
  - Surplus Risk (High Risk / Controlled)
  - Donation Recommended (Yes / No)
  - Adjustment Factors (Event & Weather multipliers)

### 3. Updated Translations (frontend/src/i18n.jsx)
- Added Hindi translations for all fields:
  - "Demand Prediction Dashboard"
  - "Demand Prediction"
  - "Past Consumption (CSV)", "Day of Week", "Expected People", "Events (CSV)", "Weather"
  - "Predict Demand"
  - "Prediction Results"
  - "Predicted Quantity", "Surplus Risk", "Donation Recommended"

## How to Run

### Prerequisites
Make sure you have:
- Node.js installed
- Python 3.7+ installed
- MongoDB running (or connection string configured)

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Install ML Service Dependencies
```bash
cd ml-service
pip install -r requirements.txt
```

### Step 4: Start the Services

#### Terminal 1 - Backend Server
```bash
cd backend
npm start
```
Backend runs on: http://localhost:5000

#### Terminal 2 - ML Service
```bash
cd ml-service
python -m uvicorn app:app --host 0.0.0.0 --port 5001
```
ML Service runs on: http://localhost:5001

#### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### Step 5: Access the Application
Open your browser and navigate to: **http://localhost:5173**

Click on "Impact Dashboard" to see the new unified ML Demand Prediction interface.

## What's Preserved
✅ All backend logic remains unchanged
✅ All UI/UX components maintained
✅ All other pages (Inventory, Menu, Analytics, etc.) untouched
✅ Database models and routes intact
✅ ML service integration working as before

## Testing the Prediction
1. Navigate to the Dashboard page
2. Fill in the form fields (default values are pre-populated):
   - Past Consumption: comma-separated numbers (e.g., 120,130,115,140,125)
   - Day of Week: any day name (e.g., Friday, Monday)
   - Expected People: number of people expected
   - Events: comma-separated event names (e.g., Founders Day, Festival)
   - Weather: description (e.g., Rainy, Sunny)
3. Click "Predict Demand"
4. View results showing predicted quantity, surplus risk, and donation recommendation

## Notes
- **ML Integration**: The backend `/predict-demand` endpoint processes these inputs and uses ML model integration with automatic fallback
- The model uses past consumption patterns, expected people, and adjustment factors (events, weather) to predict demand
- All numeric fields are validated for proper ranges
- Weather can include any description (the backend checks for keywords like "rain")
- Events are processed to adjust demand predictions based on special occasions
- The system automatically recommends donation if surplus risk is high (>15% overproduction)

## Database
The application uses MongoDB Atlas (connection string already configured in backend/.env). The database is already set up and ready to use.
