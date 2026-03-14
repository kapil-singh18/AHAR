from __future__ import annotations

import sys
import importlib
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


APP_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_ROOT))
CODE_ROOT = APP_ROOT.parent           # .../code
REPO_ROOT = CODE_ROOT.parent          # .../Reckon 7.0

# Prefer models inside `code/ml-models`, fall back to legacy top-level `models/`.
PRIMARY_MODELS_DIR = CODE_ROOT / "ml-models"
FALLBACK_MODELS_DIR = REPO_ROOT / "models"
MODELS_DIR = PRIMARY_MODELS_DIR if PRIMARY_MODELS_DIR.exists() else FALLBACK_MODELS_DIR

FOOD_WASTE_MODEL_PATH = MODELS_DIR / "food_waste_model.pkl"
DISH_RECOMMENDER_MODEL_PATH = MODELS_DIR / "dish_recommender_model.pkl"
DEMAND_MODEL_PATH = APP_ROOT / "restaurant_demand_model.pkl"


app = FastAPI(title="Reckon ML Service", version="1.0.0")
class DemandFeatures(BaseModel):
    date: str
    meal_slot: str = Field(pattern="^(breakfast|lunch|dinner)$")
    is_weekend: bool
    holiday: bool = False
    special_event_effect: str = Field(default="none", pattern="^(decrease|none|increase)$")
    event_size: str = Field(default="none", pattern="^(large|medium|small|none)$")
    last_day_customers: int = Field(ge=0)
    last_7_day_avg: float = Field(ge=0)
    temperature: float = Field(ge=-40, le=150)
    weather_condition: str = Field(default="cloudy", pattern="^(sunny|cloudy|rainy|storm)$")


class DemandRequest(BaseModel):
    features: DemandFeatures



_food_waste_bundle: Optional[dict] = None
_dish_bundle: Optional[dict] = None
_demand_model: Optional[Any] = None


def _load_bundle(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    bundle = joblib.load(path)
    if not isinstance(bundle, dict) or "model" not in bundle:
        raise ValueError(f"Unexpected model bundle format in {path.name}")
    return bundle


def _get_food_waste_bundle() -> dict:
    global _food_waste_bundle
    if _food_waste_bundle is None:
        _food_waste_bundle = _load_bundle(FOOD_WASTE_MODEL_PATH)
    return _food_waste_bundle


def _get_dish_bundle() -> dict:
    global _dish_bundle
    if _dish_bundle is None:
        _dish_bundle = _load_bundle(DISH_RECOMMENDER_MODEL_PATH)
    return _dish_bundle


def _get_demand_model() -> Any:
    global _demand_model
    if _demand_model is None:
        if not DEMAND_MODEL_PATH.exists():
            raise FileNotFoundError(f"Demand model file not found: {DEMAND_MODEL_PATH}")
        # Compatibility bridge for model artifacts that reference numpy._core.
        try:
            importlib.import_module("numpy._core")
        except ModuleNotFoundError:
            import numpy.core as np_core
            sys.modules["numpy._core"] = np_core
            import numpy.core.multiarray as np_multiarray
            sys.modules["numpy._core.multiarray"] = np_multiarray
        _demand_model = joblib.load(DEMAND_MODEL_PATH)
    return _demand_model


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "models_dir": str(MODELS_DIR),
        "food_waste_model_present": FOOD_WASTE_MODEL_PATH.exists(),
        "dish_recommender_model_present": DISH_RECOMMENDER_MODEL_PATH.exists(),
        "demand_model_present": DEMAND_MODEL_PATH.exists(),
    }


@app.get("/ready")
def ready() -> Dict[str, Any]:
    try:
        _get_demand_model()
        return {"ok": True, "demand_model_loaded": True}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"Model readiness failed: {e}") from e


def _create_demand_feature_vector(features: Dict[str, Any]) -> pd.DataFrame:
    date_value = pd.to_datetime(features.get("date"), errors="coerce")
    if pd.isna(date_value):
        date_value = pd.Timestamp.now()

    meal_slot = str(features.get("meal_slot", "lunch")).strip().lower()
    weather_condition = str(features.get("weather_condition", "cloudy")).strip().lower()
    special_event = str(features.get("special_event_effect", "none")).strip().lower()
    event_size = str(features.get("event_size", "none")).strip().lower()

    def to_int(name: str, default: int = 0) -> int:
        try:
            return int(features.get(name, default))
        except Exception:
            return default

    def to_float(name: str, default: float = 0.0) -> float:
        try:
            return float(features.get(name, default))
        except Exception:
            return default

    row = {
        "is_weekend": int(bool(features.get("is_weekend", False))),
        "holiday": int(bool(features.get("holiday", False))),
        "last_day_customers": to_int("last_day_customers", 0),
        "last_7_day_avg": to_float("last_7_day_avg", 0.0),
        "temperature": to_float("temperature", 70.0),
        "day_of_week": int(date_value.weekday()),
        "month": int(date_value.month),
        "day": int(date_value.day),
        "meal_slot_dinner": 1 if meal_slot == "dinner" else 0,
        "meal_slot_lunch": 1 if meal_slot == "lunch" else 0,
        "special_event_effect_increase": 1 if special_event == "increase" else 0,
        "special_event_effect_none": 1 if special_event == "none" else 0,
        "event_size_medium": 1 if event_size == "medium" else 0,
        "event_size_none": 1 if event_size == "none" else 0,
        "event_size_small": 1 if event_size == "small" else 0,
        "weather_condition_rainy": 1 if weather_condition == "rainy" else 0,
        "weather_condition_storm": 1 if weather_condition == "storm" else 0,
        "weather_condition_sunny": 1 if weather_condition == "sunny" else 0,
    }

    return pd.DataFrame([row])


@app.post("/predict-demand")
def predict_demand(body: DemandRequest) -> Dict[str, Any]:
    """
    Predict demand using the Restaurant Random Forest model.

    Accepts either:
    - { "features": { ... } }
    - { ... }  (treated as features)
    """
    model = _get_demand_model()
    features = body.features.model_dump()

    try:
        X = _create_demand_feature_vector(features)
        y = model.predict(X)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Demand model predict failed: {e}") from e

    prediction = y[0] if hasattr(y, "__len__") else y
    try:
        prediction_value = float(prediction)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Demand model returned non-numeric value: {prediction}") from e

    return {
        "prediction": prediction_value,
        "model": "restaurant_demand_model",
        "model_path": str(DEMAND_MODEL_PATH),
        "input_columns": list(X.columns),
    }


@app.post("/predict")
def predict(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict a single numeric value from the food waste model.

    Accepts either:
    - { "features": { ... } }
    - { ... }  (treated as features)
    - { "features": [ { ... }, { ... } ] } (batch)
    """
    bundle = _get_food_waste_bundle()
    model = bundle["model"]
    feature_names = bundle.get("feature_names")

    features = body.get("features", body)

    if isinstance(features, dict):
        X = pd.DataFrame([features])
    elif isinstance(features, list):
        if len(features) == 0:
            raise HTTPException(status_code=400, detail="features list is empty")
        if isinstance(features[0], dict):
            X = pd.DataFrame(features)
        else:
            X = pd.DataFrame([features])
    else:
        raise HTTPException(status_code=400, detail="features must be an object or an array")

    try:
        X_input = X

        if not feature_names or not isinstance(feature_names, list):
            raise ValueError("food_waste_model bundle is missing feature_names")

        X_vector = _vectorize_food_waste_inputs(X_input, feature_names)
        y = model.predict(X_vector)
    except Exception as e:  # noqa: BLE001 - surface model error to caller
        raise HTTPException(status_code=400, detail=f"Model predict failed: {e}") from e

    if hasattr(y, "tolist"):
        y = y.tolist()

    # Normalize to a single scalar response if possible.
    if isinstance(y, list) and len(y) == 1:
        prediction: Any = y[0]
    else:
        prediction = y

    return {
        "prediction": prediction,
        "model": "food_waste_model",
        "input_columns": list(X_input.columns),
        "feature_names": feature_names,
    }


def _vectorize_food_waste_inputs(raw_df: pd.DataFrame, feature_names: List[str]) -> pd.DataFrame:
    """
    Convert raw inputs into the one-hot + numeric vector expected by the stored LinearRegression.

    The saved sklearn preprocessing pipeline cannot be relied upon across sklearn versions
    (and fails on newer sklearn), so we encode the required features manually.
    """
    df = raw_df.copy()

    # Normalize likely input column names.
    rename = {
        "occupancyRate": "occupancy_rate",
        "temperatureC": "temperature_c",
        "prevDayMeals": "prev_day_meals",
        "prev7DayAvgMeals": "prev_7day_avg_meals",
        "mealsPrepared": "meals_prepared",
        "menuType": "menu_type",
        "facilityType": "facility_type",
    }
    df.rename(columns={k: v for k, v in rename.items() if k in df.columns}, inplace=True)

    out_rows: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        out: Dict[str, Any] = {name: 0 for name in feature_names}

        def get_num(key: str) -> float:
            val = row.get(key)
            try:
                return float(val)
            except Exception:
                return 0.0

        # Numeric core features.
        for key in ["occupancy_rate", "temperature_c", "prev_day_meals", "prev_7day_avg_meals", "meals_prepared"]:
            if key in out:
                out[key] = get_num(key)

        def norm_token(v: Any) -> str:
            s = str(v or "").strip().lower()
            s = s.replace(" ", "_")
            return s

        weather = norm_token(row.get("weather"))
        if "rain" in weather:
            weather = "rain"
        if weather:
            key = f"weather_{weather}"
            if key in out:
                out[key] = 1

        menu_type = norm_token(row.get("menu_type"))
        if menu_type:
            key = f"menu_type_{menu_type}"
            if key in out:
                out[key] = 1

        facility_type = norm_token(row.get("facility_type"))
        if facility_type:
            key = f"facility_type_{facility_type}"
            if key in out:
                out[key] = 1

        out_rows.append(out)

    return pd.DataFrame(out_rows, columns=feature_names)


@app.post("/recommend")
def recommend(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rank candidate dishes using the dish recommender model.

    Body options:
    - topK: int (default 5)
    - cuisine: str (optional)
    - menuType: str (optional)
    - maxPrepTimeMin: int (optional)
    - excludeMissingIngredients: bool (default false)
    """
    bundle = _get_dish_bundle()
    model = bundle["model"]
    feature_cols: List[str] = list(bundle.get("feature_cols") or [])
    candidates: List[dict] = list(bundle.get("candidate_dishes") or [])

    if not feature_cols or not candidates:
        raise HTTPException(status_code=500, detail="Dish model bundle is missing feature_cols or candidate_dishes")

    top_k = int(body.get("topK", 5))
    cuisine = body.get("cuisine")
    menu_type = body.get("menuType")
    max_prep = body.get("maxPrepTimeMin")
    exclude_missing = bool(body.get("excludeMissingIngredients", False))

    filtered: List[dict] = []
    for dish in candidates:
        if cuisine and str(dish.get("cuisine", "")).lower() != str(cuisine).lower():
            continue
        if menu_type and str(dish.get("menu_type", "")).lower() != str(menu_type).lower():
            continue
        if max_prep is not None and dish.get("prep_time_min") is not None:
            try:
                if int(dish["prep_time_min"]) > int(max_prep):
                    continue
            except Exception:
                pass
        if exclude_missing and dish.get("missing_ingredients"):
            continue
        filtered.append(dish)

    if not filtered:
        return {"recommendations": [], "model": "dish_recommender_model", "count": 0}

    X = pd.DataFrame(filtered)
    for col in feature_cols:
        if col not in X.columns:
            X[col] = 0
    X_feat = X.loc[:, feature_cols]

    try:
        scores = model.predict(X_feat)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Recommender predict failed: {e}") from e

    if hasattr(scores, "tolist"):
        scores = scores.tolist()

    ranked = []
    for dish, score in zip(filtered, scores):
        ranked.append(
            {
                "dishName": dish.get("dish_name"),
                "score": float(score) if score is not None else None,
                "cuisine": dish.get("cuisine"),
                "menuType": dish.get("menu_type"),
                "prepTimeMin": dish.get("prep_time_min"),
                "calories": dish.get("calories"),
                "missingIngredients": dish.get("missing_ingredients") or [],
                "ingredientCount": dish.get("ingredient_count"),
            }
        )

    ranked.sort(key=lambda x: (x["score"] is not None, x["score"]), reverse=True)
    ranked = ranked[: max(top_k, 0)]

    return {
        "recommendations": ranked,
        "model": "dish_recommender_model",
        "count": len(ranked),
        "featureCols": feature_cols,
    }

