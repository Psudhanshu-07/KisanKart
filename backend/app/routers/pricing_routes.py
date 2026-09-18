from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PriceRule, PriceHistory, AuditLog, User
from app.schemas import PriceRuleCreate, PriceRuleResponse, PriceHistoryResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/pricing", tags=["Admin Price Management Engine"])

def _enrich_rule(rule: PriceRule) -> PriceRuleResponse:
    return PriceRuleResponse(
        id=rule.id,
        crop=rule.crop,
        region=rule.region,
        grade=rule.grade,
        base_indicative_price=rule.base_indicative_price,
        consumer_price=rule.consumer_price,
        indicative_market_price=rule.consumer_price,
        farmer_realisation=rule.farmer_realisation,
        farmer_base_price=rule.farmer_realisation,
        logistics_cost=rule.logistics_cost,
        platform_fee=rule.platform_fee,
        platform_margin=rule.platform_fee,
        is_active=rule.is_active,
        updated_by=rule.updated_by,
        updated_at=rule.updated_at
    )

@router.get("/rules", response_model=List[PriceRuleResponse])
def get_price_rules(
    crop: Optional[str] = None,
    region: Optional[str] = None,
    grade: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(PriceRule).filter(PriceRule.is_active == True)
    if crop:
        q = q.filter(PriceRule.crop.ilike(f"%{crop}%"))
    if region:
        q = q.filter(PriceRule.region.ilike(f"%{region}%"))
    if grade:
        q = q.filter(PriceRule.grade == grade.upper())
    rules = q.order_by(PriceRule.crop.asc()).all()
    return [_enrich_rule(r) for r in rules]

@router.get("/rule", response_model=PriceRuleResponse)
def get_single_price_rule(
    crop: str,
    region: str = "Maharashtra",
    grade: str = "A",
    db: Session = Depends(get_db)
):
    rule = db.query(PriceRule).filter(
        PriceRule.crop.ilike(f"%{crop}%"),
        PriceRule.region.ilike(f"%{region}%"),
        PriceRule.grade == grade.upper(),
        PriceRule.is_active == True
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="No pricing rule exists for this crop and region")
    return _enrich_rule(rule)

@router.post("/rule", response_model=PriceRuleResponse)
@router.post("/rules", response_model=PriceRuleResponse)
def set_platform_price(
    req: PriceRuleCreate,
    db: Session = Depends(get_db)
):
    c_price = float(req.indicative_market_price if req.indicative_market_price is not None else (req.consumer_price or 32.0))
    f_price = float(req.farmer_base_price if req.farmer_base_price is not None else (req.farmer_realisation or 27.0))
    l_cost = float(req.logistics_cost if req.logistics_cost is not None else 3.0)
    p_fee = float(req.platform_margin if req.platform_margin is not None else (req.platform_fee or 2.0))
    base_price = float(req.base_indicative_price if req.base_indicative_price is not None else f_price)

    existing = db.query(PriceRule).filter(
        PriceRule.crop.ilike(f"%{req.crop}%"),
        PriceRule.region.ilike(f"%{req.region}%"),
        PriceRule.grade == req.grade.upper()
    ).first()

    old_price = existing.consumer_price if existing else c_price

    if existing:
        existing.base_indicative_price = base_price
        existing.consumer_price = c_price
        existing.farmer_realisation = f_price
        existing.logistics_cost = l_cost
        existing.platform_fee = p_fee
        existing.updated_by = req.admin_email or "Admin"
        existing.updated_at = datetime.utcnow()
        rule = existing
    else:
        rule = PriceRule(
            crop=req.crop.capitalize(),
            region=req.region.capitalize(),
            grade=req.grade.upper(),
            base_indicative_price=base_price,
            consumer_price=c_price,
            farmer_realisation=f_price,
            logistics_cost=l_cost,
            platform_fee=p_fee,
            updated_by=req.admin_email or "Admin"
        )
        db.add(rule)

    db.commit()
    db.refresh(rule)

    # 1. Record Price History
    history = PriceHistory(
        price_rule_id=rule.id,
        crop=rule.crop,
        region=rule.region,
        grade=rule.grade,
        old_price=old_price,
        new_price=c_price,
        changed_by=req.admin_email or "Admin"
    )
    db.add(history)

    # 2. Record Immutable Audit Log
    db.add(AuditLog(
        user_name=req.admin_email or "Admin (Directorate)",
        role="admin",
        action_type="PRICE_UPDATE",
        entity_type="PriceRule",
        entity_id=str(rule.id),
        details_json={
            "crop": rule.crop,
            "region": rule.region,
            "old_price": old_price,
            "new_consumer_price": c_price,
            "farmer_realisation": f_price,
            "logistics_cost": l_cost,
            "platform_fee": p_fee,
            "reason": req.reason or "Platform baseline update"
        }
    ))
    db.commit()

    return _enrich_rule(rule)

@router.get("/history", response_model=List[PriceHistoryResponse])
def get_price_history(
    crop: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    q = db.query(PriceHistory)
    if crop:
        q = q.filter(PriceHistory.crop.ilike(f"%{crop}%"))
    if region:
        q = q.filter(PriceHistory.region.ilike(f"%{region}%"))
    return q.order_by(PriceHistory.timestamp.desc()).limit(limit).all()

