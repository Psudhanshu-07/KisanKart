import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import ProduceListing, User, FarmerProfile, FPOProfile, TrustScore
from app.schemas import SmartSupplyPlan, MatchItemDetail, ExplainableSubscores

# DISTANCE APPROXIMATION MATRIX (Maharashtra Agri Hubs in km)
DISTANCES = {
    ("Nashik", "Mumbai"): 165.0,
    ("Nashik", "Pune"): 210.0,
    ("Nashik", "Ahmednagar"): 155.0,
    ("Nashik", "Satara"): 315.0,
    ("Nashik", "Nagpur"): 650.0,
    ("Pune", "Mumbai"): 150.0,
    ("Pune", "Ahmednagar"): 120.0,
    ("Pune", "Satara"): 110.0,
    ("Pune", "Nagpur"): 710.0,
    ("Ahmednagar", "Mumbai"): 250.0,
    ("Ahmednagar", "Pune"): 120.0,
    ("Satara", "Mumbai"): 255.0,
    ("Nagpur", "Mumbai"): 800.0,
}

def get_approx_distance(origin: str, destination: str) -> float:
    if origin.lower() == destination.lower():
        return 15.0
    key = (origin, destination)
    rev_key = (destination, origin)
    if key in DISTANCES:
        return DISTANCES[key]
    if rev_key in DISTANCES:
        return DISTANCES[rev_key]
    return 120.0  # default regional average

class SmartMatchingEngine:
    """
    Smart Multi-Supplier Matching Engine for Farm2Market.
    Formula rebalanced to guarantee exactly 100.0%:
      - Quantity Match: 40.0%
      - Distance:       20.0%
      - Price:          15.0%
      - Quality:        15.0%
      - Reliability:    10.0%
      Total:            100.0%
    """

    WEIGHT_QUANTITY = 40.0
    WEIGHT_DISTANCE = 20.0
    WEIGHT_PRICE = 15.0
    WEIGHT_QUALITY = 15.0
    WEIGHT_RELIABILITY = 10.0

    @classmethod
    def calculate_match_score(
        cls,
        listing: ProduceListing,
        required_qty: float,
        preferred_grade: str,
        destination_district: str,
        max_budget: float = None,
        supplier_trust_score: float = 94.0
    ) -> Tuple[float, ExplainableSubscores]:
        # 1. Quantity Match Score (0 to 100)
        # Ratio of available quantity to required, or batch readiness
        if listing.quantity_available >= required_qty:
            quantity_score = 100.0
        else:
            # High score for meaningful supply batch
            ratio = listing.quantity_available / required_qty
            quantity_score = min(100.0, max(85.0, 75.0 + (ratio * 25.0)))

        # 2. Distance Score (0 to 100)
        dist = get_approx_distance(listing.district, destination_district)
        # 165 km corridor (Nashik - Mumbai) scores ~88%
        distance_score = max(50.0, 100.0 - (dist / 14.0))

        # 3. Price Score (0 to 100)
        ref_price = max_budget if max_budget and max_budget > 0 else 30.0
        if listing.price_per_unit <= ref_price:
            price_score = min(100.0, 88.0 + ((ref_price - listing.price_per_unit) / ref_price) * 12.0)
        else:
            pct_over = (listing.price_per_unit - ref_price) / ref_price
            price_score = max(40.0, 85.0 - (pct_over * 100.0))

        # 4. Quality Grade Score (0 to 100)
        grade_order = {"A": 3, "B": 2, "C": 1}
        list_grade_val = grade_order.get(listing.grade, 2)
        pref_grade_val = grade_order.get(preferred_grade, 3)

        if list_grade_val >= pref_grade_val:
            quality_score = 100.0
        elif list_grade_val == pref_grade_val - 1:
            quality_score = 80.0
        else:
            quality_score = 60.0

        # 5. Reliability Score (0 to 100)
        reliability_score = min(max(supplier_trust_score, 60.0), 100.0)

        # Compute weighted total out of 100
        overall = (
            (quantity_score * (cls.WEIGHT_QUANTITY / 100.0)) +
            (distance_score * (cls.WEIGHT_DISTANCE / 100.0)) +
            (price_score * (cls.WEIGHT_PRICE / 100.0)) +
            (quality_score * (cls.WEIGHT_QUALITY / 100.0)) +
            (reliability_score * (cls.WEIGHT_RELIABILITY / 100.0))
        )

        notes = []
        if quantity_score >= 90:
            notes.append("Quantity requirement fully matched in allocation")
        else:
            notes.append(f"Substantial volume contribution ({round(listing.quantity_available)} kg ready)")

        if quality_score == 100:
            notes.append(f"Exact Grade {listing.grade} quality match")
        else:
            notes.append(f"Grade {listing.grade} available (Grade {preferred_grade} requested)")

        if distance_score >= 80:
            notes.append(f"Nearby collection center ({round(dist)} km from {destination_district})")
        else:
            notes.append(f"Regional transport corridor ({round(dist)} km)")

        if price_score >= 85:
            notes.append(f"Competitive price: ₹{listing.price_per_unit}/kg")

        if reliability_score >= 90:
            notes.append(f"Reliable verified supplier (Trust: {round(reliability_score)}/100)")

        subscores = ExplainableSubscores(
            quantity_score=round(quantity_score, 1),
            distance_score=round(distance_score, 1),
            price_score=round(price_score, 1),
            quality_score=round(quality_score, 1),
            reliability_score=round(reliability_score, 1),
            quantity_weight=cls.WEIGHT_QUANTITY,
            distance_weight=cls.WEIGHT_DISTANCE,
            price_weight=cls.WEIGHT_PRICE,
            quality_weight=cls.WEIGHT_QUALITY,
            reliability_weight=cls.WEIGHT_RELIABILITY,
            explanation_notes=notes
        )

        return round(overall, 1), subscores

    @classmethod
    def generate_smart_supply_plan(
        cls,
        db: Session,
        crop: str,
        required_quantity: float,
        preferred_grade: str,
        destination_district: str,
        target_delivery_date: str = None,
        max_budget: float = None,
        requirement_id: int = None
    ) -> SmartSupplyPlan:
        query = db.query(ProduceListing).filter(
            ProduceListing.produce_name.ilike(f"%{crop}%"),
            ProduceListing.status == "AVAILABLE",
            ProduceListing.quantity_available > 0
        )
        all_listings = query.all()

        candidates = []
        for l in all_listings:
            supplier_user = db.query(User).filter(User.id == l.user_id).first()
            s_name = supplier_user.full_name if supplier_user else f"Supplier #{l.user_id}"
            s_type = "FPO" if (supplier_user and supplier_user.role == "fpo") or l.is_fpo_aggregated else "Farmer"

            trust_rec = db.query(TrustScore).filter(TrustScore.entity_id == l.user_id).first()
            trust_val = trust_rec.overall_score if trust_rec else 94.0

            score, subscores = cls.calculate_match_score(
                listing=l,
                required_qty=required_quantity,
                preferred_grade=preferred_grade,
                destination_district=destination_district,
                max_budget=max_budget,
                supplier_trust_score=trust_val
            )
            candidates.append({
                "listing": l,
                "score": score,
                "subscores": subscores,
                "supplier_name": s_name,
                "supplier_type": s_type,
                "trust_val": trust_val,
                "distance": get_approx_distance(l.district, destination_district)
            })

        candidates.sort(key=lambda x: x["score"], reverse=True)

        matched_items: List[MatchItemDetail] = []
        accumulated_qty = 0.0
        total_weighted_cost = 0.0

        for cand in candidates:
            if accumulated_qty >= required_quantity:
                break
            l = cand["listing"]
            needed = required_quantity - accumulated_qty
            allocated = min(l.quantity_available, needed)

            if allocated > 0:
                accumulated_qty += allocated
                total_weighted_cost += allocated * l.price_per_unit

                item_detail = MatchItemDetail(
                    listing_id=l.id,
                    supplier_id=l.user_id,
                    supplier_name=cand["supplier_name"],
                    supplier_type=cand["supplier_type"],
                    quantity_allocated=round(allocated, 1),
                    unit=l.unit,
                    price_per_unit=l.price_per_unit,
                    pickup_location=f"{l.location_name}, {l.district}",
                    distance_km=cand["distance"],
                    score_percentage=cand["score"],
                    subscores=cand["subscores"],
                    freshness_priority=l.freshness_priority
                )
                matched_items.append(item_detail)

        is_sim = False
        if accumulated_qty < required_quantity:
            is_sim = True
            demo_suppliers = [
                ("Sahyadri Farmers FPO", "FPO", 0.40, 24.5, "Dindori Hub, Nashik", 165.0, 96.0, "A"),
                ("Ramesh Patil (Krishi Vigyan Farm)", "Farmer", 0.35, 25.0, "Pimpalgaon, Nashik", 175.0, 93.0, "A"),
                ("Godavari Agro Farmer Collective", "Farmer", 0.25, 26.0, "Niphad, Nashik", 185.0, 91.0, "A")
            ]
            matched_items.clear()
            accumulated_qty = 0.0
            total_weighted_cost = 0.0

            for name, stype, ratio, price, loc, dist, trust, gr in demo_suppliers:
                alloc = round(required_quantity * ratio, 1)
                accumulated_qty += alloc
                total_weighted_cost += alloc * price

                sub = ExplainableSubscores(
                    quantity_score=98.0,
                    distance_score=88.5,
                    price_score=94.0,
                    quality_score=100.0,
                    reliability_score=trust,
                    quantity_weight=cls.WEIGHT_QUANTITY,
                    distance_weight=cls.WEIGHT_DISTANCE,
                    price_weight=cls.WEIGHT_PRICE,
                    quality_weight=cls.WEIGHT_QUALITY,
                    reliability_weight=cls.WEIGHT_RELIABILITY,
                    explanation_notes=[
                        f"Allocates {alloc} kg toward total procurement plan",
                        f"Grade {gr} quality verified",
                        f"Direct collection at {loc}",
                        f"Reliability index {trust}/100"
                    ]
                )
                score = round(
                    sub.quantity_score * (cls.WEIGHT_QUANTITY / 100.0) +
                    sub.distance_score * (cls.WEIGHT_DISTANCE / 100.0) +
                    sub.price_score * (cls.WEIGHT_PRICE / 100.0) +
                    sub.quality_score * (cls.WEIGHT_QUALITY / 100.0) +
                    sub.reliability_score * (cls.WEIGHT_RELIABILITY / 100.0), 1
                )

                matched_items.append(MatchItemDetail(
                    listing_id=900 + len(matched_items),
                    supplier_id=100 + len(matched_items),
                    supplier_name=name,
                    supplier_type=stype,
                    quantity_allocated=alloc,
                    unit="kg",
                    price_per_unit=price,
                    pickup_location=loc,
                    distance_km=dist,
                    score_percentage=score,
                    subscores=sub,
                    freshness_priority="HIGH"
                ))

        avg_price = round(total_weighted_cost / accumulated_qty, 2) if accumulated_qty > 0 else 25.0
        fulfillment_pct = round((accumulated_qty / required_quantity) * 100.0, 1)
        avg_score = round(sum(item.score_percentage for item in matched_items) / len(matched_items), 1) if matched_items else 94.0

        farmer_realisation = avg_price
        logistics_fee = 4.0
        platform_fee = 2.0
        other_fee = 1.0
        total_buyer_unit_price = farmer_realisation + logistics_fee + platform_fee + other_fee

        return SmartSupplyPlan(
            requirement_id=requirement_id,
            crop=crop,
            required_quantity=required_quantity,
            matched_quantity=accumulated_qty,
            fulfillment_percentage=fulfillment_pct,
            average_price=avg_price,
            supplier_count=len(matched_items),
            pickup_points_count=len(set(item.pickup_location for item in matched_items)),
            overall_matching_score=avg_score,
            estimated_delivery="Within 24-36 hrs (Freshness Guard Route)",
            total_estimated_amount=round(accumulated_qty * total_buyer_unit_price, 2),
            matched_suppliers=matched_items,
            price_breakdown={
                "farmer_realisation": round(farmer_realisation, 2),
                "logistics": round(logistics_fee, 2),
                "platform_service": round(platform_fee, 2),
                "quality_packaging": round(other_fee, 2),
                "total_buyer_price_per_kg": round(total_buyer_unit_price, 2)
            },
            is_simulation=is_sim
        )

