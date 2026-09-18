from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import BuyerRequirement, User
from app.schemas import RequirementCreate, RequirementResponse
from app.auth import get_current_user

router = APIRouter(prefix="/requirements", tags=["Buyer Requirements"])

@router.post("", response_model=RequirementResponse)
def create_requirement(
    req: RequirementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requirement = BuyerRequirement(
        buyer_id=current_user.id,
        crop=req.crop.capitalize(),
        category=req.category or "Vegetable",
        quantity_required=req.quantity_required,
        unit=req.unit or "kg",
        preferred_grade=req.preferred_grade or "A",
        location_name=req.location_name,
        district=req.district,
        target_delivery_date=req.target_delivery_date,
        max_budget_per_unit=req.max_budget_per_unit,
        status="OPEN"
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)

    return RequirementResponse(
        id=requirement.id,
        buyer_id=requirement.buyer_id,
        crop=requirement.crop,
        category=requirement.category,
        quantity_required=requirement.quantity_required,
        unit=requirement.unit,
        preferred_grade=requirement.preferred_grade,
        location_name=requirement.location_name,
        district=requirement.district,
        target_delivery_date=requirement.target_delivery_date,
        max_budget_per_unit=requirement.max_budget_per_unit,
        status=requirement.status,
        created_at=requirement.created_at,
        buyer_name=current_user.full_name
    )

@router.get("", response_model=List[RequirementResponse])
def get_requirements(
    crop: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(BuyerRequirement)
    if crop:
        q = q.filter(BuyerRequirement.crop.ilike(f"%{crop}%"))
    if district:
        q = q.filter(BuyerRequirement.district.ilike(f"%{district}%"))
    if status:
        q = q.filter(BuyerRequirement.status == status)

    reqs = q.order_by(BuyerRequirement.created_at.desc()).all()
    resp = []
    for r in reqs:
        b_user = db.query(User).filter(User.id == r.buyer_id).first()
        b_name = b_user.full_name if b_user else f"Buyer #{r.buyer_id}"
        resp.append(RequirementResponse(
            id=r.id,
            buyer_id=r.buyer_id,
            crop=r.crop,
            category=r.category,
            quantity_required=r.quantity_required,
            unit=r.unit,
            preferred_grade=r.preferred_grade,
            location_name=r.location_name,
            district=r.district,
            target_delivery_date=r.target_delivery_date,
            max_budget_per_unit=r.max_budget_per_unit,
            status=r.status,
            created_at=r.created_at,
            buyer_name=b_name
        ))
    return resp

@router.get("/{id}", response_model=RequirementResponse)
def get_requirement(id: int, db: Session = Depends(get_db)):
    r = db.query(BuyerRequirement).filter(BuyerRequirement.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Requirement not found")
    b_user = db.query(User).filter(User.id == r.buyer_id).first()
    b_name = b_user.full_name if b_user else f"Buyer #{r.buyer_id}"
    return RequirementResponse(
        id=r.id,
        buyer_id=r.buyer_id,
        crop=r.crop,
        category=r.category,
        quantity_required=r.quantity_required,
        unit=r.unit,
        preferred_grade=r.preferred_grade,
        location_name=r.location_name,
        district=r.district,
        target_delivery_date=r.target_delivery_date,
        max_budget_per_unit=r.max_budget_per_unit,
        status=r.status,
        created_at=r.created_at,
        buyer_name=b_name
    )

