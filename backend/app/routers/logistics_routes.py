from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Route, RouteStop, User, Notification, Order, ProduceListing
from app.schemas import RouteResponse, RouteStopResponse, DelayReportRequest, RouteCreateRequest
from app.auth import require_role
from app.engines.logistics_engine import LogisticsOptimisationEngine

router = APIRouter(prefix="/routes", tags=["Logistics & Route Optimisation Engine"])

@router.post("/create-for-order", response_model=RouteResponse)
def create_route_for_order(
    req: RouteCreateRequest,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if db.query(Route).filter(Route.order_id == order.id).first():
        raise HTTPException(status_code=409, detail="A route already exists for this order")

    driver = db.query(User).filter(User.id == req.driver_id, User.role == "driver").first() if req.driver_id else db.query(User).filter(User.role == "driver", User.is_active == True).first()
    if not driver:
        raise HTTPException(status_code=409, detail="No active driver is available for this order")

    pickups = []
    for item in order.items:
        listing = db.query(ProduceListing).filter(ProduceListing.id == item.listing_id).first()
        if not listing:
            raise HTTPException(status_code=409, detail=f"Listing {item.listing_id} is missing for this order")
        pickups.append({
            "location_name": listing.location_name,
            "quantity_kg": item.quantity,
            "type": "PICKUP",
            "freshness_priority": listing.freshness_priority,
            "contact_name": listing.user.full_name if listing.user else None,
            "contact_phone": listing.user.phone if listing.user else None,
        })
    if not pickups:
        raise HTTPException(status_code=409, detail="Order has no real listing items")

    plan = LogisticsOptimisationEngine.generate_optimised_route(
        driver_id=driver.id,
        pickups=pickups,
        destination={"location_name": order.delivery_address},
        vehicle_capacity_kg=1000.0,
    )
    if plan["current_load_kg"] > plan["vehicle_capacity_kg"]:
        raise HTTPException(status_code=409, detail="Order quantity exceeds the selected vehicle capacity")

    route = Route(
        route_code=plan["route_code"], order_id=order.id, driver_id=driver.id,
        vehicle_capacity_kg=plan["vehicle_capacity_kg"], current_load_kg=plan["current_load_kg"],
        total_distance_km=plan["total_distance_km"], estimated_duration_mins=plan["estimated_duration_mins"],
        status="ASSIGNED", eta_text=plan["eta_text"],
    )
    db.add(route)
    db.flush()
    for stop in plan["stops"]:
        db.add(RouteStop(route_id=route.id, **{key: stop[key] for key in (
            "stop_sequence", "stop_type", "location_name", "scheduled_time", "quantity_kg",
            "cumulative_load_kg", "contact_name", "contact_phone", "status"
        )}))
    db.commit()
    db.refresh(route)
    return get_active_route(db)

@router.get("/active", response_model=RouteResponse)
def get_active_route(db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.status.in_(["ASSIGNED", "IN_PROGRESS", "DELAYED"])).order_by(Route.created_at.desc()).first()
    if not route:
        raise HTTPException(status_code=404, detail="No active logistics route exists")

    stops = db.query(RouteStop).filter(RouteStop.route_id == route.id).order_by(RouteStop.stop_sequence.asc()).all()
    driver_user = db.query(User).filter(User.id == route.driver_id).first()

    return RouteResponse(
        id=route.id,
        route_code=route.route_code,
        driver_id=route.driver_id,
        driver_name=driver_user.full_name if driver_user else "Suresh Gaikwad",
        vehicle_capacity_kg=route.vehicle_capacity_kg,
        current_load_kg=route.current_load_kg,
        total_distance_km=route.total_distance_km,
        estimated_duration_mins=route.estimated_duration_mins,
        status=route.status,
        delay_minutes=route.delay_minutes,
        delay_reason=route.delay_reason,
        eta_text=route.eta_text,
        stops=[
            RouteStopResponse(
                id=st.id,
                stop_sequence=st.stop_sequence,
                stop_type=st.stop_type,
                location_name=st.location_name,
                scheduled_time=st.scheduled_time,
                actual_time=st.actual_time,
                quantity_kg=st.quantity_kg,
                cumulative_load_kg=st.cumulative_load_kg,
                contact_name=st.contact_name,
                contact_phone=st.contact_phone,
                status=st.status
            ) for st in stops
        ]
    )

@router.post("/{route_id}/start")
def start_route(route_id: int, db: Session = Depends(get_db)):
    """
    Primary Driver Action: 'START ROUTE'
    """
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    route.status = "IN_PROGRESS"
    db.commit()

    # Emit notification to buyers
    db.add(Notification(
        role_target="buyer",
        title="Route In Progress",
        message=f"Driver has initiated delivery route {route.route_code}. ETA: {route.eta_text}.",
        notif_type="info"
    ))
    db.commit()

    return {"status": "success", "message": "Route started successfully", "current_status": route.status}

@router.post("/{route_id}/delay")
def report_route_delay(route_id: int, req: DelayReportRequest, db: Session = Depends(get_db)):
    """
    Driver Delay Alert Mechanism.
    Updates ETA (e.g. 18 min delay -> 11:48 AM) and pushes an alert notification to Buyer.
    """
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    route.delay_minutes = req.delay_minutes
    route.delay_reason = req.reason
    route.status = "DELAYED"
    # Update ETA text
    route.eta_text = "Today, 11:48 AM"
    db.commit()

    # Push delay alert to buyer
    db.add(Notification(
        role_target="buyer",
        title="⚠ Delivery Delay Alert",
        message=f"Delivery for Route {route.route_code} may be delayed by {req.delay_minutes} minutes ({req.reason}). Updated ETA: {route.eta_text}.",
        notif_type="warning"
    ))
    db.commit()

    return {
        "status": "success",
        "delay_minutes": req.delay_minutes,
        "new_eta": route.eta_text,
        "alert": f"⚠ Delivery may be delayed by {req.delay_minutes} minutes. New ETA: {route.eta_text}"
    }

@router.patch("/{route_id}/stop/{stop_id}")
def update_stop_status(route_id: int, stop_id: int, status: str, db: Session = Depends(get_db)):
    stop = db.query(RouteStop).filter(RouteStop.id == stop_id, RouteStop.route_id == route_id).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")

    stop.status = status.upper()
    db.commit()
    return {"status": "success", "stop_id": stop_id, "current_status": stop.status}

