# Quick Start Guide - Food Waste Management App

## ⚡ Fast Setup (3 Terminals)

### Terminal 1: Backend
```powershell
cd c:\Users\Admin\Desktop\Food_waste_management\backend
npm install
npm start
```
✅ Backend running on http://localhost:5000

### Terminal 2: ML Service
```powershell
cd c:\Users\Admin\Desktop\Food_waste_management\ml-service
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 5001
```
✅ ML Service running on http://localhost:5001

### Terminal 3: Frontend
```powershell
cd c:\Users\Admin\Desktop\Food_waste_management\frontend
npm install
npm run dev
```
✅ Frontend running on http://localhost:5173

## 🚀 Access the App
Open browser: **http://localhost:5173**

Navigate to: **Impact Dashboard** → See the unified ML Demand Prediction form

## 🎯 What Changed?
✅ Unified Box 1 (Prediction Inputs) with ML backend integration  
✅ Uses original Box 1 fields: Kitchen ID, Past Consumption, Day of Week, Expected People, Events, Weather  
✅ Connects to `/predict-demand` endpoint with ML fallback support  
✅ Renamed to "Demand Prediction" (not "ML Demand Prediction")  
✅ All other features preserved  

## 📝 Test the Prediction
1. Go to Dashboard page
2. Form is pre-filled with sample data:
   - Past Consumption: 120,130,115,140,125,132,138
   - Expected People: 145
   - Events: Founders Day
   - Weather: Rainy
3. Click "Predict Demand"
4. View prediction results with quantity, surplus risk, and donation recommendation

## ⚠️ Important
- Backend connects to MongoDB Atlas (already configured)
- ML service fallback works even without .pkl models
- All backend logic and UI/UX preserved
- Works on Windows, macOS, and Linux

## 🆘 Troubleshooting

**Port already in use?**
```powershell
# Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**MongoDB connection issues?**
- Database is already hosted on MongoDB Atlas
- Connection string is in backend/.env
- No local MongoDB required

**ML Service not starting?**
- Ensure Python 3.7+ is installed
- Check: `python --version`
- Update pip: `python -m pip install --upgrade pip`

**Frontend won't start?**
- Ensure Node.js 16+ is installed
- Check: `node --version`
- Clear cache: `npm cache clean --force`

## 📂 Project Structure
```
Food_waste_management/
├── backend/          # Express.js API server
├── frontend/         # React + Vite UI
├── ml-service/       # Python FastAPI ML service
├── CHANGES_SUMMARY.md    # Detailed changes documentation
└── QUICK_START.md    # This file
```

---
**Ready to run! 🎉**
