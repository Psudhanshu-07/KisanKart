from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DigitalLot, LotEvent
from app.schemas import DigitalLotResponse, LotEventResponse
from app.engines.trust_engine import TrustEngine

router = APIRouter(prefix="/lots", tags=["Digital Lot & Produce Passport"])

@router.get("/{lot_code}", response_model=DigitalLotResponse)
def get_digital_lot_passport(lot_code: str, db: Session = Depends(get_db)):
    """
    Produce Passport / Digital Lot Traceability Page.
    Displays:
      - Origin: Nashik, Maharashtra
      - Farmer/FPO: FPO-102 (Sahyadri)
      - Quantity: 500 kg, Grade: A
      - Harvest: 15 Sept, 6:30 AM
      - Pickup: 17 Sept, Destination: Mumbai
      - Status: In Transit
      - QR Code
      - Provenance Timeline: Farm -> FPO -> Collection -> Transport -> Buyer
      - Transparent Price Breakdown: ₹32/kg (Farmer ₹25, Logistics ₹4, Platform ₹2, Other ₹1)
    """
    lot = db.query(DigitalLot).filter(DigitalLot.lot_code == lot_code).first()
    if not lot:
        # Generate demo passport if not found in db
        demo_pass = TrustEngine.create_digital_lot_passport(
            lot_code=lot_code,
            crop="Tomato",
            grade="A",
            quantity_kg=500.0,
            origin_location="Nashik, Maharashtra",
            destination_location="Mumbai",
            farmer_name="Ramesh Patil",
            fpo_name="Sahyadri Farmers Producer Co."
        )
        return DigitalLotResponse(
            id=421,
            lot_code=lot_code,
            order_id=1,
            crop=demo_pass["crop"],
            grade=demo_pass["grade"],
            quantity_kg=demo_pass["quantity_kg"],
            origin_location=demo_pass["origin_location"],
            destination_location=demo_pass["destination_location"],
            farmer_name=demo_pass["farmer_name"],
            fpo_name=demo_pass["fpo_name"],
            harvest_date=demo_pass["harvest_date"],
            pickup_date=demo_pass["pickup_date"],
            recommended_delivery_deadline=demo_pass["recommended_delivery_deadline"],
            freshness_priority=demo_pass["freshness_priority"],
            status=demo_pass["status"],
            price_farmer_realisation=25.0,
            price_logistics=4.0,
            price_platform=2.0,
            price_other=1.0,
            total_buyer_price=32.0,
            events=[LotEventResponse(**ev) for ev in demo_pass["events"]]
        )

    events = db.query(LotEvent).filter(LotEvent.lot_id == lot.id).order_by(LotEvent.timestamp.asc()).all()

    return DigitalLotResponse(
        id=lot.id,
        lot_code=lot.lot_code,
        order_id=lot.order_id,
        crop=lot.crop,
        grade=lot.grade,
        quantity_kg=lot.quantity_kg,
        origin_location=lot.origin_location,
        destination_location=lot.destination_location,
        farmer_name=lot.farmer_name,
        fpo_name=lot.fpo_name,
        harvest_date=lot.harvest_date,
        pickup_date=lot.pickup_date,
        recommended_delivery_deadline=lot.recommended_delivery_deadline,
        freshness_priority=lot.freshness_priority,
        status=lot.status,
        price_farmer_realisation=lot.price_farmer_realisation,
        price_logistics=lot.price_logistics,
        price_platform=lot.price_platform,
        price_other=lot.price_other,
        total_buyer_price=lot.total_buyer_price,
        events=[
            LotEventResponse(
                id=ev.id,
                event_name=ev.event_name,
                actor=ev.actor,
                location=ev.location,
                timestamp=ev.timestamp,
                notes=ev.notes,
                is_completed=ev.is_completed
            ) for ev in events
        ]
    )

@router.get("/{lot_code}/qr")
def get_lot_qr(lot_code: str):
    """
    Returns base64 data URI of QR code for direct rendering.
    """
    qr_b64 = TrustEngine.generate_qr_code_base64(lot_code, "Nashik, Maharashtra", "Tomato")
    return {"lot_code": lot_code, "qr_data_uri": qr_b64}

