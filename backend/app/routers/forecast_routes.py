from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ForecastRecord
from app.schemas import ForecastResponse
from app.engines.forecasting_engine import DemandForecastingEngine

router = APIRouter(prefix="/forecast", tags=["Demand Forecasting Engine"])

@router.get("/{region}/{crop}", response_model=ForecastResponse)
def get_crop_forecast(region: str, crop: str, db: Session = Depends(get_db)):
    """
    AI Demand Forecasting API.
    Returns current demand, forecasted demand, % change, seasonal/festival effects,
    and converts predictions into actionable recommendations (AI -> Recommendation -> Action).
    """
    # Check if record exists in DB, otherwise generate
    rec = db.query(ForecastRecord).filter(
        ForecastRecord.region.ilike(f"%{region}%"),
        ForecastRecord.crop.ilike(f"%{crop}%")
    ).first()

    if rec:
        return ForecastResponse(
            id=rec.id,
            crop=rec.crop,
            region=rec.region,
            current_demand_kg=rec.current_demand_kg,
            forecast_demand_kg=rec.forecast_demand_kg,
            pct_change=rec.pct_change,
            period=rec.period,
            confidence_pct=rec.confidence_pct,
            festival_factor=rec.festival_factor,
            recommendation_text=rec.recommendation_text,
            action_cta=rec.action_cta,
            is_simulated=rec.is_simulated
        )

    try:
        generated = DemandForecastingEngine.generate_forecast(crop=crop, region=region, db=db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return ForecastResponse(id=0, **generated)

@router.get("/decision-cards/all")
def get_decision_cards(role: str = Query(default="farmer"), region: str = Query(default="Mumbai"), db: Session = Depends(get_db)):
    """
    Returns role-specific actionable decision cards for Farmer, Buyer, Driver, and Government.
    """
    return []

