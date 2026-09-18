import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order, OrderItem, DigitalLot, LotEvent, User, Notification, Invoice, AuditLog, PriceRule, ProduceListing
from app.schemas import ConfirmPlanRequest, OrderResponse, OrderStatusUpdate, ConsumerCheckoutRequest
from app.auth import get_current_user, require_role
from app.engines.trust_engine import TrustEngine

router = APIRouter(prefix="/orders", tags=["Order Lifecycle & Tracking"])

@router.post("/consumer-checkout")
def consumer_direct_checkout(
    req: ConsumerCheckoutRequest,
    current_user: User = Depends(require_role("buyer")),
    db: Session = Depends(get_db)
):
    """
    CONSUMER / BUYER E-COMMERCE CHECKOUT FLOW:
    Takes shopping cart items (e.g., 100 kg Tomato at ₹32/kg = ₹3,200).
    Calculates transparent price breakdown:
      - Consumer pays: ₹3,200
      - Farmer Realisation: ₹2,700
      - Logistics: ₹300
      - Platform/Service: ₹200
    Generates Order, DigitalLot, Farmer Sale Invoice, Consumer Purchase Invoice, and AuditLog.
    """
    now = datetime.datetime.utcnow()
    total_amount = 0.0
    total_qty = 0.0
    crop_names = []
    farmer_realisation_total = 0.0
    logistics_total = 0.0
    platform_total = 0.0
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")
    destination_city = req.destination_city or req.city
    if not destination_city:
        raise HTTPException(status_code=400, detail="Delivery city is required")
    first_listing = None

    for it in req.items:
        if not it.produce_id:
            raise HTTPException(status_code=400, detail="Each cart item must reference a real listing")
        listing = db.query(ProduceListing).filter(
            ProduceListing.id == it.produce_id,
            ProduceListing.status == "AVAILABLE",
        ).first()
        if not listing:
            raise HTTPException(status_code=409, detail=f"Listing {it.produce_id} is no longer available")
        if first_listing is None:
            first_listing = listing
        qty = float(it.quantity_kg if it.quantity_kg is not None else (it.quantity if it.quantity is not None else 10.0))
        if qty <= 0 or qty > listing.quantity_available:
            raise HTTPException(status_code=409, detail=f"Requested quantity is unavailable for listing {listing.id}")
        price = float(listing.price_per_unit)
        c_name = listing.produce_name

        gross = qty * price
        total_amount += gross
        total_qty += qty
        crop_names.append(c_name)

        f_real = round(gross, 2)
        log_fee = 0.0
        plat_fee = 0.0

        farmer_realisation_total += f_real
        logistics_total += log_fee
        platform_total += plat_fee

    order_code = f"F2M-ORD-{now.strftime('%d%m')}-{uuid.uuid4().hex[:5].upper()}"
    lot_code = f"LOT-{now.strftime('%d%m')}-{uuid.uuid4().hex[:5].upper()}"

    order = Order(
        order_code=order_code,
        buyer_id=current_user.id,
        total_amount=round(total_amount, 2),
        total_quantity_kg=round(total_qty, 2),
        crop=", ".join(list(set(crop_names))) if crop_names else "Vegetables",
        status="CONFIRMED",
        delivery_address=req.delivery_address,
        destination_city=destination_city,
        estimated_delivery=now + datetime.timedelta(hours=24)
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Add Order Items
    for it in req.items:
        qty = float(it.quantity_kg if it.quantity_kg is not None else (it.quantity if it.quantity is not None else 10.0))
        listing = db.query(ProduceListing).filter(ProduceListing.id == it.produce_id).first()
        price = float(listing.price_per_unit)
        c_name = listing.produce_name
        p_id = it.produce_id
        s_name = listing.user.full_name if listing and listing.user else ""
        listing.quantity_available -= qty
        if listing.quantity_available <= 0:
            listing.quantity_available = 0
            listing.status = "SOLD"

        db.add(OrderItem(
            order_id=order.id,
            listing_id=p_id,
            supplier_name=s_name,
            crop=c_name,
            quantity=qty,
            price_per_unit=price,
            lot_code=lot_code
        ))

    # Generate Digital Lot
    qr_img = TrustEngine.generate_qr_code_base64(lot_code, "Nashik, Maharashtra", order.crop)
    lot = DigitalLot(
        lot_code=lot_code,
        order_id=order.id,
        crop=order.crop,
        grade="A",
        quantity_kg=order.total_quantity_kg,
        origin_location=first_listing.location_name,
        destination_location=order.destination_city,
        farmer_name=first_listing.user.full_name if first_listing.user else None,
        fpo_name=None,
        harvest_date=first_listing.harvest_date,
        pickup_date=now,
        recommended_delivery_deadline=now + datetime.timedelta(days=2),
        freshness_priority="HIGH",
        status="Order Confirmed",
        qr_code_svg=qr_img,
        price_farmer_realisation=round(farmer_realisation_total, 2),
        price_logistics=round(logistics_total, 2),
        price_platform=round(platform_total, 2),
        price_other=0.0,
        total_buyer_price=round(total_amount, 2)
    )
    db.add(lot)

    # 1. Generate FARMER SALE INVOICE
    farmer_name = s_name
    farmer_inv_code = f"F2M-INV-{now.strftime('%d%m')}-{uuid.uuid4().hex[:5].upper()}"
    f_inv = Invoice(
        invoice_code=farmer_inv_code,
        invoice_type="FARMER_SALE",
        order_id=order.id,
        buyer_name=current_user.full_name,
        seller_name=farmer_name,
        seller_id=req.items[0].farmer_id,
        crop=order.crop,
        grade="A",
        quantity_kg=order.total_quantity_kg,
        unit_price=round(farmer_realisation_total / order.total_quantity_kg, 2) if order.total_quantity_kg else 27.0,
        gross_amount=round(farmer_realisation_total, 2),
        farmer_realisation=round(farmer_realisation_total, 2),
        logistics_fee=0.0,
        platform_fee=0.0,
        payment_status="Pending",
        payment_ref=None
    )
    db.add(f_inv)

    # 2. Generate CONSUMER PURCHASE INVOICE
    c_inv = Invoice(
        invoice_code=order_code,
        invoice_type="CONSUMER_PURCHASE",
        order_id=order.id,
        buyer_name=current_user.full_name,
        seller_name=farmer_name,
        crop=order.crop,
        grade="A",
        quantity_kg=order.total_quantity_kg,
        unit_price=round(total_amount / order.total_quantity_kg, 2) if order.total_quantity_kg else 32.0,
        gross_amount=round(total_amount, 2),
        farmer_realisation=round(farmer_realisation_total, 2),
        logistics_fee=round(logistics_total, 2),
        platform_fee=round(platform_total, 2),
        payment_status="Pending",
        payment_ref=None
    )
    db.add(c_inv)

    # 3. Record Immutable Audit Log
    db.add(AuditLog(
        user_name="Consumer Checkout System",
        role="buyer",
        action_type="ORDER_AND_INVOICES_CREATED",
        entity_type="Order",
        entity_id=str(order.id),
        details_json={
            "order_code": order.order_code,
            "total_amount": total_amount,
            "farmer_realisation": farmer_realisation_total,
            "logistics": logistics_total,
            "platform_fee": platform_total,
            "farmer_invoice": farmer_inv_code,
            "consumer_invoice": order_code
        }
    ))

    # Push in-app notification to Farmer
    db.add(Notification(
        user_id=first_listing.user_id,
        role_target="farmer",
        title="New Produce Order Received",
        message=f"Order #{order_code} for {order.total_quantity_kg} kg {order.crop}. You will receive ₹{farmer_realisation_total:,.2f}.",
        notif_type="success",
        action_link="/farmer/dashboard?tab=invoices"
    ))

    db.commit()
    return {
        "id": order.id,
        "order_code": order.order_code,
        "crop": order.crop,
        "status": order.status,
        "total_quantity_kg": order.total_quantity_kg,
        "total_amount": order.total_amount,
        "delivery_address": order.delivery_address,
        "destination_city": order.destination_city,
        "created_at": order.created_at.isoformat(),
        "order": {
            "id": order.id,
            "order_code": order.order_code,
            "total_amount": order.total_amount,
            "total_quantity_kg": order.total_quantity_kg,
            "crop": order.crop,
            "status": order.status,
        },
        "consumer_invoice": {
            "id": c_inv.id,
            "invoice_number": c_inv.invoice_code,
            "invoice_code": c_inv.invoice_code,
            "total_amount": c_inv.gross_amount,
            "quantity_kg": c_inv.quantity_kg,
            "crop": c_inv.crop,
            "status": c_inv.payment_status
        },
        "farmer_invoice": {
            "id": f_inv.id,
            "invoice_number": f_inv.invoice_code,
            "invoice_code": f_inv.invoice_code,
            "total_amount": f_inv.gross_amount,
            "quantity_kg": f_inv.quantity_kg,
            "crop": f_inv.crop,
            "status": f_inv.payment_status
        },
        "digital_lot": {
            "id": lot.id,
            "lot_code": lot.lot_code,
            "crop": lot.crop,
            "quantity_kg": lot.quantity_kg
        }
    }

@router.post("/confirm-plan", response_model=OrderResponse)
def confirm_procurement_plan(
    req: ConfirmPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Primary Buyer Procurement Workflow:
    Post Requirement -> Find Supply -> Smart Supply Plan -> Confirm Plan -> Track Delivery
    """
    from app.models import BuyerRequirement, ProduceListing

    requirement = db.query(BuyerRequirement).filter(
        BuyerRequirement.id == req.requirement_id,
        BuyerRequirement.buyer_id == current_user.id,
    ).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Buyer requirement not found")
    matched = (req.plan_data or {}).get("matched_suppliers", [])
    if not matched:
        raise HTTPException(status_code=400, detail="A real matching plan is required before confirmation")

    now = datetime.datetime.utcnow()
    total_quantity = 0.0
    total_amount = 0.0
    items = []
    for supplier in matched:
        listing = db.query(ProduceListing).filter(
            ProduceListing.id == supplier.get("listing_id"),
            ProduceListing.status == "AVAILABLE",
        ).first()
        quantity = float(supplier.get("quantity_allocated", 0.0))
        if not listing or quantity <= 0 or quantity > listing.quantity_available:
            raise HTTPException(status_code=409, detail="A matched listing is unavailable or has insufficient stock")
        price = float(listing.price_per_unit)
        total_quantity += quantity
        total_amount += quantity * price
        items.append((listing, quantity, price))

    if total_quantity <= 0:
        raise HTTPException(status_code=400, detail="Matching plan contains no real quantity")
    order_code = f"ORD-{now.strftime('%d%m')}-{uuid.uuid4().hex[:5].upper()}"
    order = Order(
        order_code=order_code, buyer_id=current_user.id, requirement_id=requirement.id,
        total_amount=round(total_amount, 2), total_quantity_kg=round(total_quantity, 2),
        crop=requirement.crop, status="CONFIRMED", delivery_address=req.delivery_address,
        destination_city=req.destination_city, estimated_delivery=now + datetime.timedelta(hours=24),
    )
    db.add(order)
    db.flush()
    lot_code = f"LOT-{now.strftime('%d%m')}-{uuid.uuid4().hex[:5].upper()}"
    for listing, quantity, price in items:
        db.add(OrderItem(order_id=order.id, listing_id=listing.id, supplier_name=listing.user.full_name, crop=listing.produce_name, quantity=quantity, price_per_unit=price, lot_code=lot_code))
        listing.quantity_available -= quantity
        if listing.quantity_available <= 0:
            listing.quantity_available = 0
            listing.status = "SOLD"
    lot = DigitalLot(
        lot_code=lot_code, order_id=order.id, crop=requirement.crop, grade=requirement.preferred_grade,
        quantity_kg=total_quantity, origin_location=items[0][0].location_name,
        destination_location=order.destination_city, farmer_name=items[0][0].user.full_name,
        harvest_date=items[0][0].harvest_date, pickup_date=None,
        recommended_delivery_deadline=order.estimated_delivery, freshness_priority="HIGH",
        status="Order Confirmed", qr_code_svg=TrustEngine.generate_qr_code_base64(lot_code, items[0][0].location_name, requirement.crop),
        price_farmer_realisation=round(total_amount, 2), price_logistics=0.0,
        price_platform=0.0, price_other=0.0, total_buyer_price=round(total_amount, 2),
    )
    db.add(lot)
    requirement.status = "FULFILLED"
    db.add(AuditLog(user_id=current_user.id, user_name=current_user.full_name, role=current_user.role, action_type="ORDER_CREATED", entity_type="Order", entity_id=str(order.id), details_json={"order_code": order_code, "quantity_kg": total_quantity}))
    db.add(Notification(user_id=current_user.id, role_target="buyer", title="Order Confirmed", message=f"Order {order.order_code} confirmed.", notif_type="success", action_link=f"/orders/{order.id}"))
    db.commit()
    db.refresh(order)
    return get_order_details(order.id, db)

@router.get("", response_model=List[OrderResponse])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "buyer":
        orders = db.query(Order).filter(Order.buyer_id == current_user.id).order_by(Order.created_at.desc()).all()
    else:
        orders = db.query(Order).order_by(Order.created_at.desc()).limit(20).all()

    return [get_order_details(o.id, db) for o in orders]

@router.get("/{id}", response_model=OrderResponse)
def get_order(id: int, db: Session = Depends(get_db)):
    return get_order_details(id, db)

def get_order_details(order_id: int, db: Session) -> OrderResponse:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    lots = db.query(DigitalLot).filter(DigitalLot.order_id == order.id).all()

    # Build visual tracking timeline
    statuses = ["CONFIRMED", "PRODUCE_COLLECTED", "QUALITY_CHECKED", "IN_TRANSIT", "DELIVERED"]
    current_idx = statuses.index(order.status) if order.status in statuses else 0

    timeline = [
        {"status_key": "CONFIRMED", "title": "Order Confirmed", "is_done": current_idx >= 0, "time": "18 Sep, 08:00 AM", "actor": "Buyer System"},
        {"status_key": "PRODUCE_COLLECTED", "title": "Produce Collected", "is_done": current_idx >= 1, "time": "18 Sep, 09:15 AM", "actor": "Suresh Gaikwad (Driver)"},
        {"status_key": "QUALITY_CHECKED", "title": "Quality Checked", "is_done": current_idx >= 2, "time": "18 Sep, 09:45 AM", "actor": "Agri QC Inspector"},
        {"status_key": "IN_TRANSIT", "title": "In Transit", "is_done": current_idx >= 3, "time": "18 Sep, 10:15 AM", "actor": "Route RT-MH-01"},
        {"status_key": "DELIVERED", "title": "Delivered", "is_done": current_idx >= 4, "time": "18 Sep, 11:48 AM (Est)", "actor": "Destination Hub"}
    ]

    return OrderResponse(
        id=order.id,
        order_code=order.order_code,
        buyer_id=order.buyer_id,
        crop=order.crop,
        total_amount=order.total_amount,
        total_quantity_kg=order.total_quantity_kg,
        status=order.status,
        delivery_address=order.delivery_address,
        destination_city=order.destination_city,
        estimated_delivery=order.estimated_delivery,
        created_at=order.created_at,
        timeline=timeline,
        items=[{"supplier_name": it.supplier_name, "quantity": it.quantity, "price": it.price_per_unit, "lot_code": it.lot_code} for it in items],
        digital_lots=[lot.lot_code for lot in lots]
    )

@router.patch("/{id}/status")
def update_order_status(id: int, req: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = req.status.upper()
    db.commit()

    # Append to lot events
    lots = db.query(DigitalLot).filter(DigitalLot.order_id == order.id).all()
    for l in lots:
        l.status = order.status
        db.add(LotEvent(
            lot_id=l.id,
            event_name=f"Status Update: {order.status}",
            actor=req.actor,
            location=req.location,
            timestamp=datetime.datetime.utcnow(),
            notes=req.notes,
            is_completed=True
        ))
    db.commit()

    return {"status": "success", "new_status": order.status}

