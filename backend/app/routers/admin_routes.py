from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Order, ProduceListing, Notification, BuyerRequirement, Route, RouteStop
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

    return AdminDashboardStats(
        total_farmers=farmers,
        total_fpos=fpos,
        total_buyers=buyers,
        total_drivers=drivers,
        active_orders=active_orders,
        active_listings=active_listings,
        total_volume_kg=float(total_volume),
        regional_gaps=[]
        ,total_gmv=float(total_gmv)
        ,active_routes=len(routes)
        ,demand_analysis=demand_analysis
        ,route_records=route_records
        ,order_records=order_records
    )

@router.get("/drivers")
def get_drivers(db: Session = Depends(get_db)):
    return [
        {"id": driver.id, "full_name": driver.full_name, "phone": driver.phone}
        for driver in db.query(User).filter(User.role == "driver", User.is_active == True).order_by(User.full_name).all()
    ]

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

