from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import BuyerRequirement, MatchPlan, MatchItem
from app.schemas import SmartSupplyPlan
from app.engines.matching_engine import SmartMatchingEngine

router = APIRouter(prefix="/matching", tags=["Smart Matching Engine"])

class DirectMatchRequest(BaseModel):
    crop: str
    quantity: float
    grade: Optional[str] = "A"
    district: Optional[str] = "Mumbai"
    delivery_date: Optional[str] = None
    max_budget: Optional[float] = None
    requirement_id: Optional[int] = None

@router.post("/generate", response_model=SmartSupplyPlan)
def generate_smart_supply_plan(
    req: DirectMatchRequest,
    db: Session = Depends(get_db)
):
    """
    Generates a Multi-Supplier Smart Supply Plan with Explainable Subscores.
    Evaluates 5-factor normalized weights:
      - Quantity (38.1%)
      - Distance (19.05%)
      - Price (14.29%)
      - Quality (14.29%)
      - Reliability (9.52%)
    Aggregates supply across multiple verified Farmers / FPOs.
    """
    plan = SmartMatchingEngine.generate_smart_supply_plan(
        db=db,
        crop=req.crop,
        required_quantity=req.quantity,
        preferred_grade=req.grade or "A",
        destination_district=req.district or "Mumbai",
        max_budget=req.max_budget,
        requirement_id=req.requirement_id
    )
    return plan

@router.get("/{requirement_id}", response_model=SmartSupplyPlan)
def get_matching_for_requirement(requirement_id: int, db: Session = Depends(get_db)):
    req = db.query(BuyerRequirement).filter(BuyerRequirement.id == requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    plan = SmartMatchingEngine.generate_smart_supply_plan(
        db=db,
        crop=req.crop,
        required_quantity=req.quantity_required,
        preferred_grade=req.preferred_grade,
        destination_district=req.district,
        max_budget=req.max_budget_per_unit,
        requirement_id=req.id
    )
    return plan

