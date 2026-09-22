from typing import List
import re
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Order, OrderItem, MatchItem, ProduceListing, Notification, BuyerRequirement, Route, RouteStop, FarmerProfile, FPOProfile
from app.schemas import AdminDashboardStats, RegionSupplyDemandGap

router = APIRouter(prefix="/admin", tags=["Admin & Government Intelligence Dashboard"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(db: Session = Depends(get_db)):
    farmers = db.query(User).filter(User.role == "farmer").count()
    fpos = db.query(User).filter(User.role == "fpo").count()
    buyers = db.query(User).filter(User.role == "buyer").count()
    drivers = db.query(User).filter(User.role == "driver").count()
    active_orders = db.query(Order).count()
    active_listings = db.query(ProduceListing).filter(ProduceListing.status == "AVAILABLE").count()

    total_volume = db.query(func.coalesce(func.sum(Order.total_quantity_kg), 0.0)).scalar() or 0.0
    total_gmv = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0
    active_route_query = db.query(Route).filter(Route.status.in_(["ASSIGNED", "IN_PROGRESS", "DELAYED"]))
    routes = active_route_query.all()

    demand_rows = db.query(
        BuyerRequirement.crop,
        BuyerRequirement.district,
        func.sum(BuyerRequirement.quantity_required),
    ).filter(BuyerRequirement.status.in_(["OPEN", "MATCHED", "POOLED"])).group_by(
        BuyerRequirement.crop, BuyerRequirement.district
    ).all()
    demand_analysis = []
    for crop, district, demand_kg in demand_rows:
        supply_kg = db.query(func.coalesce(func.sum(ProduceListing.quantity_available), 0.0)).filter(
            ProduceListing.status == "AVAILABLE",
            ProduceListing.produce_name.ilike(crop),
            ProduceListing.district.ilike(district),
        ).scalar() or 0.0
        gap_kg = float(demand_kg or 0.0) - float(supply_kg)
        demand_analysis.append({
            "crop": crop,
            "district": district,
            "demand_kg": float(demand_kg or 0.0),
            "supply_kg": float(supply_kg),
            "gap_kg": gap_kg,
            "status": "Shortage" if gap_kg > 0 else "Covered",
        })

    route_records = []
    for route in routes:
        stops = db.query(RouteStop).filter(RouteStop.route_id == route.id).order_by(RouteStop.stop_sequence.asc()).all()
        driver = db.query(User).filter(User.id == route.driver_id).first()
        route_records.append({
            "id": route.id,
            "route_code": route.route_code,
            "driver_name": driver.full_name if driver else "Unknown driver",
            "status": route.status,
            "current_load_kg": route.current_load_kg,
            "vehicle_capacity_kg": route.vehicle_capacity_kg,
            "path": " -> ".join(stop.location_name for stop in stops),
        })

    order_records = []
    for order in db.query(Order).order_by(Order.created_at.desc()).limit(100).all():
        buyer = db.query(User).filter(User.id == order.buyer_id).first()
        order_records.append({
            "id": order.id,
            "order_code": order.order_code,
            "buyer_name": buyer.full_name if buyer else "Unknown buyer",
            "crop": order.crop,
            "quantity_kg": order.total_quantity_kg,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "route_assigned": bool(order.routes),
        })

    farmer_users = db.query(User).filter(User.role.in_(["farmer", "fpo"]), User.is_active == True).order_by(User.created_at.desc()).all()
    farmers_list = []
    for f in farmer_users:
        f_prof = db.query(FarmerProfile).filter(FarmerProfile.user_id == f.id).first()
        fpo_prof = db.query(FPOProfile).filter(FPOProfile.user_id == f.id).first() if f.role == "fpo" else None
        listings_count = db.query(ProduceListing).filter(ProduceListing.user_id == f.id).count()
        total_kg = db.query(func.coalesce(func.sum(ProduceListing.quantity_available), 0.0)).filter(ProduceListing.user_id == f.id).scalar() or 0.0

        farm_name = fpo_prof.fpo_name if fpo_prof else (f_prof.farm_name if f_prof and f_prof.farm_name else f"{f.full_name}'s Farm")
        district = fpo_prof.district if fpo_prof else (f_prof.district if f_prof and f_prof.district else "Nashik")
        upi_id = f_prof.upi_id if f_prof and f_prof.upi_id else (fpo_prof.upi_id if fpo_prof and fpo_prof.upi_id else "Not verified")
        kyc = f_prof.kyc_status if f_prof else (fpo_prof.verification_status if fpo_prof else "VERIFIED")

        farmers_list.append({
            "id": f.id,
            "full_name": f.full_name,
            "email": f.email,
            "phone": f.phone or "N/A",
            "role": f.role,
            "farm_name": farm_name,
            "village": f_prof.village if f_prof and f_prof.village else "Farm Gate",
            "district": district,
            "state": f_prof.state if f_prof else "Maharashtra",
            "upi_id": upi_id,
            "land_size_acres": f_prof.land_size_acres if f_prof else (120 if f.role == "fpo" else 2.5),
            "kyc_status": kyc,
            "listings_count": listings_count,
            "total_produce_kg": float(total_kg),
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "is_active": f.is_active,
        })

    produce_records = []
    for item in db.query(ProduceListing).order_by(ProduceListing.created_at.desc()).all():
        farmer_user = db.query(User).filter(User.id == item.user_id).first()
        produce_records.append({
            "id": item.id,
            "user_id": item.user_id,
            "farmer_name": farmer_user.full_name if farmer_user else "Registered Producer",
            "farmer_email": farmer_user.email if farmer_user else "",
            "produce_name": item.produce_name,
            "category": item.category,
            "grade": item.grade,
            "quantity_available": item.quantity_available or 0.0,
            "quantity_initial": item.quantity_initial or item.quantity_available or 0.0,
            "unit": item.unit or "kg",
            "price_per_unit": item.price_per_unit or 0.0,
            "total_value": round((item.quantity_available or 0.0) * (item.price_per_unit or 0.0), 2),
            "district": item.district or "Nashik",
            "location_name": item.location_name or "Farm Cluster",
            "harvest_date": item.harvest_date.isoformat() if item.harvest_date else None,
            "freshness_window_days": item.freshness_window_days or 5,
            "status": item.status or "AVAILABLE",
            "is_fpo_aggregated": bool(item.is_fpo_aggregated),
            "created_at": item.created_at.isoformat() if item.created_at else None,
        })

    return AdminDashboardStats(
        total_farmers=farmers,
        total_fpos=fpos,
        total_buyers=buyers,
        total_drivers=drivers,
        active_orders=active_orders,
        active_listings=active_listings,
        total_volume_kg=float(total_volume),
        regional_gaps=[],
        total_gmv=float(total_gmv),
        active_routes=len(routes),
        demand_analysis=demand_analysis,
        route_records=route_records,
        order_records=order_records,
        farmers_list=farmers_list,
        produce_listings=produce_records,
    )

@router.get("/farmers")
def get_admin_farmers(db: Session = Depends(get_db)):
    dash = get_admin_dashboard(db)
    return dash.farmers_list

@router.get("/produce")
def get_admin_produce(db: Session = Depends(get_db)):
    dash = get_admin_dashboard(db)
    return dash.produce_listings

@router.delete("/produce/{listing_id}")
def delete_admin_produce(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(ProduceListing).filter(ProduceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Produce listing not found")

    has_matches = db.query(MatchItem).filter(MatchItem.listing_id == listing_id).first()
    has_orders = db.query(OrderItem).filter(OrderItem.listing_id == listing_id).first()
    if has_matches or has_orders:
        raise HTTPException(
            status_code=409,
            detail="This listing is linked to an order or matching record and cannot be removed.",
        )

    db.delete(listing)
    db.commit()
    return {"deleted": True, "id": listing_id}

@router.get("/drivers")
def get_drivers(db: Session = Depends(get_db)):
    return [
        {"id": driver.id, "full_name": driver.full_name, "phone": driver.phone}
        for driver in db.query(User).filter(User.role == "driver", User.is_active == True).order_by(User.full_name).all()
    ]

@router.delete("/farmers/{user_id}")
def remove_admin_producer(user_id: int, db: Session = Depends(get_db)):
    producer = db.query(User).filter(User.id == user_id, User.role.in_(["farmer", "fpo"])).first()
    if not producer:
        raise HTTPException(status_code=404, detail="Farmer or FPO not found")
    producer.is_active = False
    db.query(ProduceListing).filter(
        ProduceListing.user_id == user_id,
        ProduceListing.status == "AVAILABLE",
    ).update({"status": "REMOVED"}, synchronize_session=False)
    db.commit()
    return {"removed": True, "id": user_id}

@router.patch("/farmers/{user_id}")
def update_admin_producer(user_id: int, changes: dict = Body(...), db: Session = Depends(get_db)):
    producer = db.query(User).filter(User.id == user_id, User.role.in_(["farmer", "fpo"])).first()
    if not producer:
        raise HTTPException(status_code=404, detail="Farmer or FPO not found")

    if "full_name" in changes:
        producer.full_name = str(changes["full_name"]).strip()
    if "phone" in changes:
        producer.phone = str(changes["phone"]).strip()

    upi_id = str(changes.get("upi_id") or "").strip().lower()
    if upi_id and not re.fullmatch(r"[a-z0-9][a-z0-9._-]{1,254}@[a-z][a-z0-9.-]{1,62}", upi_id):
        raise HTTPException(status_code=400, detail="Enter a valid UPI ID")

    if producer.role == "farmer":
        profile = producer.farmer_profile
        if not profile:
            raise HTTPException(status_code=404, detail="Farmer profile not found")
        if "farm_name" in changes:
            profile.farm_name = str(changes["farm_name"]).strip()
        if "district" in changes:
            profile.district = str(changes["district"]).strip()
        if upi_id and upi_id != profile.upi_id:
            duplicate = db.query(FarmerProfile).filter(FarmerProfile.upi_id == upi_id, FarmerProfile.user_id != user_id).first()
            duplicate = duplicate or db.query(FPOProfile).filter(FPOProfile.upi_id == upi_id, FPOProfile.user_id != user_id).first()
            if duplicate:
                raise HTTPException(status_code=400, detail="This UPI ID is already registered")
            profile.upi_id = upi_id
            profile.bank_verified = True
    else:
        profile = producer.fpo_profile
        if not profile:
            raise HTTPException(status_code=404, detail="FPO profile not found")
        if "farm_name" in changes:
            profile.fpo_name = str(changes["farm_name"]).strip()
        if "district" in changes:
            profile.district = str(changes["district"]).strip()
        if upi_id and upi_id != profile.upi_id:
            duplicate = db.query(FarmerProfile).filter(FarmerProfile.upi_id == upi_id, FarmerProfile.user_id != user_id).first()
            duplicate = duplicate or db.query(FPOProfile).filter(FPOProfile.upi_id == upi_id, FPOProfile.user_id != user_id).first()
            if duplicate:
                raise HTTPException(status_code=400, detail="This UPI ID is already registered")
            profile.upi_id = upi_id
            profile.bank_verified = True

    db.commit()
    return {"updated": True, "id": user_id}

@router.get("/notifications")
def get_notifications(role: str = None, db: Session = Depends(get_db)):
    q = db.query(Notification)
    if role and role != "all":
        q = q.filter(Notification.role_target.in_([role.lower(), "all"]))
    notifs = q.order_by(Notification.created_at.desc()).limit(15).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notif_type": n.notif_type,
            "action_link": n.action_link,
            "created_at": n.created_at,
            "is_read": n.is_read
        } for n in notifs
    ]

