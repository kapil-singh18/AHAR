# ML Service

This service loads the two `.pkl` models in the repo-level `models/` folder and exposes HTTP endpoints used by the Node backend.

## Setup

From `code/ml-service`:

```bash
python -m pip install -r requirements.txt
```

## Run

From `code/ml-service`:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 5001
```

## Endpoints

- `GET /health`
- `GET /ready`
- `POST /predict` (food waste model)
- `POST /predict-demand` (restaurant demand model)
- `POST /recommend` (dish recommender model)

## Demand request schema

`POST /predict-demand` expects:

```json
{
  "features": {
    "date": "2026-11-21",
    "meal_slot": "lunch",
    "is_weekend": false,
    "holiday": false,
    "special_event_effect": "none",
    "event_size": "none",
    "last_day_customers": 96,
    "last_7_day_avg": 88,
    "temperature": 74,
    "weather_condition": "cloudy"
  }
}
```

The model expects 18 numeric one-hot/input features derived from the request. The current
artifact is a scikit-learn `RandomForestRegressor` and must be loaded with the same
scikit-learn version used for the production build.

