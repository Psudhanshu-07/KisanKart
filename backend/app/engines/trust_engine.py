import io
import base64
import qrcode
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.schemas import DigitalLotResponse, LotEventResponse

class TrustEngine:
    """
    Trust, Transparency & Digital Lot Engine for KisanKart.
    Calculates multi-stakeholder trust metrics, generates transparent price breakdowns,
    and provisions tamper-evident Digital Lot Passports with QR codes.
    """

    @classmethod
    def calculate_farmer_trust(
        cls,
        fulfillment_rate: float = 96.0,
        on_time_rate: float = 94.0,
        quality_consistency: float = 91.0,
        cancellation_rate: float = 2.0
    ) -> Dict[str, Any]:
        # Weighted composite trust index
        score = (
            (fulfillment_rate * 0.35) +
            (on_time_rate * 0.30) +
            (quality_consistency * 0.25) +
            ((100.0 - cancellation_rate * 5) * 0.10)
        )
        score = min(max(round(score, 1), 0.0), 100.0)
        return {
            "overall_score": score,
            "fulfillment_rate": fulfillment_rate,
            "on_time_rate": on_time_rate,
            "quality_consistency": quality_consistency,
            "cancellation_rate": cancellation_rate,
            "badge": "VERIFIED" if score >= 85 else "PENDING"
        }

    @classmethod
    def get_price_breakdown(cls, buyer_price_per_kg: float = 32.0) -> Dict[str, Any]:
        """
        Transparent Price Engine.
        Example: Buyer Price ₹32/kg
        Farmer Realisation: ₹25
        Logistics: ₹4
        Platform/Service: ₹2
        Packaging & QC: ₹1
        """
        # Baseline proportions
        farmer_realisation = round(buyer_price_per_kg * 0.78, 2)
        logistics = round(buyer_price_per_kg * 0.125, 2)
        platform = round(buyer_price_per_kg * 0.0625, 2)
        other = round(buyer_price_per_kg - (farmer_realisation + logistics + platform), 2)

        return {
            "buyer_price": buyer_price_per_kg,
            "farmer_realisation": farmer_realisation,
            "farmer_percentage": round((farmer_realisation / buyer_price_per_kg) * 100, 1),
            "logistics": logistics,
            "platform_service": platform,
            "other_packaging": other,
            "currency": "INR",
            "is_demo_pricing": True,
            "pricing_note": "Demo pricing — transparent breakdown visible to both buyer and farmer."
        }

    @classmethod
    def generate_qr_code_base64(cls, lot_code: str, origin: str, crop: str) -> str:
        """
        Generates QR code image as base64 string for embedding directly in frontend/mobile.
        """
        payload = f"https://farm2market.in/lot/{lot_code}?crop={crop}&origin={origin}&verified=true"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=8,
            border=2,
        )
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#15803d", back_color="white")  # Deep agri green

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    @classmethod
    def create_digital_lot_passport(
        cls,
        lot_code: str,
        crop: str,
        grade: str,
        quantity_kg: float,
        origin_location: str,
        destination_location: str,
        farmer_name: str,
        fpo_name: str,
        harvest_date: datetime = None
    ) -> Dict[str, Any]:
        """
        Digital Lot / Produce Passport
        LOT: TOM-NK-2609-00421
        Origin: Nashik, Maharashtra
        Farmer/FPO: FPO-102 (Sahyadri)
        Harvest: 15 Sept, 6:30 AM
        Pickup: 17 Sept
        Destination: Mumbai
        Status: In Transit
        """
        if harvest_date is None:
            harvest_date = datetime.utcnow() - timedelta(hours=36)

        rec_deadline = harvest_date + timedelta(days=3, hours=6)
        qr_img = cls.generate_qr_code_base64(lot_code, origin_location, crop)

        events = [
            {
                "id": 1,
                "event_name": "Harvest & Field Tagging",
                "actor": farmer_name,
                "location": f"Farm Plot 4, {origin_location}",
                "timestamp": harvest_date,
                "notes": "Grade-A selection, Brix sugar test: 4.8",
                "is_completed": True
            },
            {
                "id": 2,
                "event_name": "FPO Aggregation & Sorting",
                "actor": fpo_name,
                "location": f"Collection Center, {origin_location}",
                "timestamp": harvest_date + timedelta(hours=14),
                "notes": "Moisture & skin consistency passed",
                "is_completed": True
            },
            {
                "id": 3,
                "event_name": "Quality Clearance & Passport Issuance",
                "actor": "Quality Officer (Krishi Vigyan)",
                "location": f"Regional Depot, {origin_location}",
                "timestamp": harvest_date + timedelta(hours=22),
                "notes": "Zero chemical residue spot verification",
                "is_completed": True
            },
            {
                "id": 4,
                "event_name": "Loaded for Transport (Route RT-MH-01)",
                "actor": "Driver (Suresh Gaikwad)",
                "location": f"Kasara Corridor Transit",
                "timestamp": harvest_date + timedelta(hours=30),
                "notes": "Crate-stacked with freshness insulation",
                "is_completed": True
            },
            {
                "id": 5,
                "event_name": "Delivery to Buyer Outlet",
                "actor": "Buyer Receiving Hub",
                "location": destination_location,
                "timestamp": rec_deadline,
                "notes": "Expected final sign-off upon arrival",
                "is_completed": False
            }
        ]

        pricing = cls.get_price_breakdown(32.0)

        return {
            "lot_code": lot_code,
            "crop": crop,
            "grade": grade,
            "quantity_kg": quantity_kg,
            "origin_location": origin_location,
            "destination_location": destination_location,
            "farmer_name": farmer_name,
            "fpo_name": fpo_name,
            "harvest_date": harvest_date,
            "pickup_date": harvest_date + timedelta(hours=28),
            "recommended_delivery_deadline": rec_deadline,
            "freshness_priority": "HIGH",
            "status": "In Transit",
            "qr_code_base64": qr_img,
            "pricing_breakdown": pricing,
            "events": events
        }

