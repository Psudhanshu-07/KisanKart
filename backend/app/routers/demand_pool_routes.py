from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DemandPool, DemandPoolItem
from app.schemas import DemandPoolResponse
from app.engines.demand_pool_engine import DemandPoolEngine

router = APIRouter(prefix="/demand-pools", tags=["Demand Aggregation & Pooling"])

class PoolGenerateRequest(BaseModel):
    crop: str
    district: str

@router.get("", response_model=List[DemandPoolResponse])
def list_demand_pools(db: Session = Depends(get_db)):
    pools = db.query(DemandPool).order_by(DemandPool.created_at.desc()).all()
    resp = []
    for p in pools:
        details = DemandPoolEngine.get_pool_details(db, p.id)
        if details:
            resp.append(DemandPoolResponse(**details))
    return resp

@router.post("/generate", response_model=DemandPoolResponse)
def trigger_demand_pooling(req: PoolGenerateRequest, db: Session = Depends(get_db)):
    """
    Groups open compatible buyer requirements into a consolidated Demand Pool.
    Communicates benefits: bulk procurement savings (~14%), fewer trips (~40%), better vehicle utilisation.
    """
    pool = DemandPoolEngine.aggregate_compatible_requirements(
        db=db,
        crop=req.crop,
        district=req.district
    )
    details = DemandPoolEngine.get_pool_details(db, pool.id)
    return DemandPoolResponse(**details)

@router.get("/{id}", response_model=DemandPoolResponse)
def get_demand_pool(id: int, db: Session = Depends(get_db)):
    details = DemandPoolEngine.get_pool_details(db, id)
    if not details:
        raise HTTPException(status_code=404, detail="Demand pool not found")
    return DemandPoolResponse(**details)

