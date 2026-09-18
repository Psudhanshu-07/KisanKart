import hashlib
import json
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog

router = APIRouter(prefix="/audit", tags=["Immutable Audit Trail"])

@router.get("/logs")
def get_audit_logs(
    action_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if action_type:
        q = q.filter(AuditLog.action_type == action_type.upper())
    logs = q.order_by(AuditLog.created_at.desc()).limit(limit).all()

    results = []
    for l in logs:
        hash_payload = f"{l.id}:{l.user_name}:{l.action_type}:{l.entity_type}:{l.created_at}"
        r_hash = hashlib.sha256(hash_payload.encode()).hexdigest()
        details_str = ""
        if l.details_json:
            if isinstance(l.details_json, dict):
                details_str = ", ".join(f"{k}: {v}" for k, v in l.details_json.items() if not str(k).startswith("_"))
            else:
                details_str = str(l.details_json)

        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user_name,
            "actor": l.user_name,
            "role": l.role,
            "action_type": l.action_type,
            "action": l.action_type.replace("_", " "),
            "entity_type": l.entity_type,
            "entity": l.entity_type,
            "entity_id": l.entity_id,
            "details_json": l.details_json,
            "details": details_str,
            "record_hash": r_hash,
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return results

