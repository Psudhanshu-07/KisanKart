import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Invoice, AuditLog, User, ProduceListing
from app.schemas import InvoiceResponse, FPOPurchaseRequest
from app.auth import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices & Settlement Ledgers"])

def _enrich_invoice(inv: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=inv.id,
        invoice_code=inv.invoice_code,
        invoice_number=inv.invoice_code,
        invoice_type=inv.invoice_type,
        order_id=inv.order_id,
        buyer_id=inv.buyer_id,
        seller_id=inv.seller_id,
        buyer_name=inv.buyer_name,
        seller_name=inv.seller_name,
        recipient_name=inv.buyer_name,
        issuer_name=inv.seller_name,
        crop=inv.crop,
        grade=inv.grade,
        quantity_kg=inv.quantity_kg,
        unit_price=inv.unit_price,
        rate_per_kg=inv.unit_price,
        gross_amount=inv.gross_amount,
        total_amount=inv.gross_amount,
        farmer_realisation=inv.farmer_realisation,
        logistics_fee=inv.logistics_fee,
        platform_fee=inv.platform_fee,
        payment_status=inv.payment_status,
        status=inv.payment_status,
        payment_ref=inv.payment_ref,
        created_at=inv.created_at
    )

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(
    invoice_type: Optional[str] = None,
    user_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Invoice)
    if invoice_type:
        q = q.filter(Invoice.invoice_type == invoice_type.upper())
    if user_name:
        q = q.filter(
            (Invoice.seller_name.ilike(f"%{user_name}%")) |
            (Invoice.buyer_name.ilike(f"%{user_name}%"))
        )
    invs = q.order_by(Invoice.created_at.desc()).all()
    return [_enrich_invoice(i) for i in invs]

@router.get("/{invoice_code}", response_model=InvoiceResponse)
def get_invoice_by_code(invoice_code: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.invoice_code == invoice_code).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _enrich_invoice(inv)

@router.post("/pay/{id}")
@router.post("/{id}/pay")
def mark_invoice_as_paid(id: int, db: Session = Depends(get_db)):
    """
    Simulated Payment Settlement Mechanism for SIH Demo.
    Marks payment as Paid and generates a reference number.
    """
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv.payment_status = "Paid"
    inv.payment_ref = f"F2M-PAY-{datetime.utcnow().strftime('%d%m')}-{uuid.uuid4().hex[:6].upper()}"
    db.commit()

    db.add(AuditLog(
        user_name="Admin Settlement Service",
        role="admin",
        action_type="PAYMENT_STATUS",
        entity_type="Invoice",
        entity_id=str(inv.id),
        details_json={
            "invoice_code": inv.invoice_code,
            "status": "Paid",
            "payment_ref": inv.payment_ref,
            "amount": inv.gross_amount,
            "note": "Payment marked as settled via platform simulated escrow"
        }
    ))
    db.commit()

    return {"status": "success", "invoice_code": inv.invoice_code, "payment_status": inv.payment_status, "payment_ref": inv.payment_ref}

@router.post("/fpo-purchase", response_model=InvoiceResponse)
def create_fpo_purchase(req: FPOPurchaseRequest, db: Session = Depends(get_db)):
    """
    FPO Flow: FPO purchases directly from member farmer.
    Automatically generates:
      FARMER -> FPO PURCHASE INVOICE
      Invoice: F2M-FPO-XXXXXX
      FPO: Nashik Farmers FPO
      Farmer: Ramesh Patil
      Farmer payable: ₹13,500
      Status: Payment Pending / Paid
    """
    farmer_name = req.member_farmer_name or req.farmer_name
    if not farmer_name:
        farmer_user = db.query(User).filter(User.id == req.farmer_id).first()
        farmer_name = farmer_user.full_name if farmer_user else "Ramesh Patil"

    crop_val = req.produce_name or req.crop or "Tomato"
    qty_val = float(req.quantity_kg if req.quantity_kg is not None else (req.quantity if req.quantity is not None else 100.0))
    rate_val = float(req.rate_per_kg if req.rate_per_kg is not None else (req.unit_price if req.unit_price is not None else 27.0))

    gross = round(qty_val * rate_val, 2)
    inv_code = f"F2M-FPO-{datetime.utcnow().strftime('%d%m')}-{uuid.uuid4().hex[:5].upper()}"

    inv = Invoice(
        invoice_code=inv_code,
        invoice_type="FPO_PURCHASE",
        buyer_name="Nashik Farmers FPO",
        seller_name=farmer_name,
        seller_id=req.farmer_id or 1,
        crop=crop_val,
        grade=req.grade or "A",
        quantity_kg=qty_val,
        unit_price=rate_val,
        gross_amount=gross,
        farmer_realisation=gross,
        logistics_fee=0.0,
        platform_fee=0.0,
        payment_status="Paid",
        payment_ref=f"F2M-PAY-FPO-{uuid.uuid4().hex[:6].upper()}"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    db.add(AuditLog(
        user_name="Nashik Farmers FPO",
        role="fpo",
        action_type="FPO_PURCHASE",
        entity_type="Invoice",
        entity_id=str(inv.id),
        details_json={
            "invoice_code": inv.invoice_code,
            "farmer": farmer_name,
            "crop": crop_val,
            "quantity_kg": qty_val,
            "gross_amount": gross,
            "payment_ref": inv.payment_ref
        }
    ))
    db.commit()

    return _enrich_invoice(inv)

