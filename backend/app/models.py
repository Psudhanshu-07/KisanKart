from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # farmer, fpo, buyer, driver, admin
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False)
    fpo_profile = relationship("FPOProfile", back_populates="user", uselist=False)
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False)
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False)
    produce_listings = relationship("ProduceListing", back_populates="user")
    buyer_requirements = relationship("BuyerRequirement", back_populates="buyer")
    orders = relationship("Order", back_populates="buyer")
    notifications = relationship("Notification", back_populates="user")


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    farm_name = Column(String(255), nullable=True)
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Maharashtra")
    land_size_acres = Column(Float, default=2.5)
    kyc_status = Column(String(50), default="VERIFIED")  # VERIFIED, PENDING, REVIEW_REQUIRED
    bank_verified = Column(Boolean, default=True)
    fpo_affiliation = Column(String(255), nullable=True)
    upi_id = Column(String(100), nullable=True)

    user = relationship("User", back_populates="farmer_profile")


class FPOProfile(Base):
    __tablename__ = "fpo_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    fpo_name = Column(String(255), nullable=False)
    registration_no = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Maharashtra")
    member_count = Column(Integer, default=120)
    collection_centers_count = Column(Integer, default=3)
    verification_status = Column(String(50), default="VERIFIED")

    user = relationship("User", back_populates="fpo_profile")


class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    business_name = Column(String(255), nullable=False)
    buyer_type = Column(String(50), default="restaurant")  # restaurant, hotel, hostel, institution, retailer, consumer
    gstin = Column(String(50), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), default="Maharashtra")
    delivery_address = Column(Text, nullable=False)
    verification_status = Column(String(50), default="VERIFIED")

    user = relationship("User", back_populates="buyer_profile")


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    license_number = Column(String(100), nullable=True)
    vehicle_number = Column(String(100), nullable=True)
    vehicle_type = Column(String(50), default="Tata Ace (1.2 Ton)")
    vehicle_capacity_kg = Column(Float, default=1000.0)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    verification_status = Column(String(50), default="VERIFIED")

    user = relationship("User", back_populates="driver_profile")


class Produce(Base):
    __tablename__ = "produce"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), default="Vegetable")
    standard_unit = Column(String(20), default="kg")
    typical_shelf_life_days = Column(Integer, default=5)
    base_market_price = Column(Float, default=25.0)


class ProduceListing(Base):
    __tablename__ = "produce_listings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    produce_name = Column(String(100), nullable=False)  # Tomato, Onion, Potato, etc.
    category = Column(String(50), default="Vegetable")
    quantity_available = Column(Float, nullable=False)
    quantity_initial = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    grade = Column(String(10), default="A")  # A, B, C
    price_per_unit = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=False)  # Village / Farm / Collection Center
    district = Column(String(100), nullable=False)  # Nashik, Pune, etc.
    state = Column(String(100), default="Maharashtra")
    harvest_date = Column(DateTime, default=datetime.utcnow)
    freshness_window_days = Column(Integer, default=4)
    recommended_delivery_deadline = Column(DateTime, nullable=True)
    freshness_priority = Column(String(20), default="HIGH")  # HIGH, MEDIUM, LOW
    status = Column(String(50), default="AVAILABLE")  # AVAILABLE, RESERVED, SOLD
    is_fpo_aggregated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="produce_listings")


class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop = Column(String(100), nullable=False)
    category = Column(String(50), default="Vegetable")
    quantity_required = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    preferred_grade = Column(String(10), default="A")
    location_name = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False)
    target_delivery_date = Column(DateTime, nullable=False)
    max_budget_per_unit = Column(Float, nullable=True)
    status = Column(String(50), default="OPEN")  # OPEN, MATCHED, POOLED, FULFILLED
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="buyer_requirements")
    match_plans = relationship("MatchPlan", back_populates="requirement")


class DemandPool(Base):
    __tablename__ = "demand_pools"

    id = Column(Integer, primary_key=True, index=True)
    pool_code = Column(String(50), unique=True, index=True)
    crop = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    total_quantity_kg = Column(Float, default=0.0)
    target_delivery_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="FORMING")  # FORMING, MATCHED, FULFILLED
    estimated_savings_pct = Column(Float, default=12.5)
    fewer_trips_pct = Column(Float, default=40.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("DemandPoolItem", back_populates="demand_pool")


class DemandPoolItem(Base):
    __tablename__ = "demand_pool_items"

    id = Column(Integer, primary_key=True, index=True)
    demand_pool_id = Column(Integer, ForeignKey("demand_pools.id"), nullable=False)
    buyer_requirement_id = Column(Integer, ForeignKey("buyer_requirements.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    buyer_name = Column(String(255), nullable=True)

    demand_pool = relationship("DemandPool", back_populates="items")
    requirement = relationship("BuyerRequirement")


class MatchPlan(Base):
    __tablename__ = "match_plans"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("buyer_requirements.id"), nullable=True)
    demand_pool_id = Column(Integer, ForeignKey("demand_pools.id"), nullable=True)
    required_quantity = Column(Float, nullable=False)
    matched_quantity = Column(Float, nullable=False)
    average_price = Column(Float, nullable=False)
    supplier_count = Column(Integer, default=1)
    pickup_points_count = Column(Integer, default=1)
    overall_score = Column(Float, default=90.0)
    estimated_delivery = Column(String(100), nullable=True)
    status = Column(String(50), default="GENERATED")  # GENERATED, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    requirement = relationship("BuyerRequirement", back_populates="match_plans")
    items = relationship("MatchItem", back_populates="match_plan")
    orders = relationship("Order", back_populates="match_plan")


class MatchItem(Base):
    __tablename__ = "match_items"

    id = Column(Integer, primary_key=True, index=True)
    match_plan_id = Column(Integer, ForeignKey("match_plans.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("produce_listings.id"), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    supplier_type = Column(String(50), default="Farmer")  # Farmer or FPO
    quantity_allocated = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    pickup_location = Column(String(255), nullable=False)
    distance_km = Column(Float, default=15.0)
    score_percentage = Column(Float, default=94.0)
    # Explainable subscores stored as JSON {quantity, distance, price, quality, reliability}
    subscores_json = Column(JSON, nullable=True)

    match_plan = relationship("MatchPlan", back_populates="items")
    listing = relationship("ProduceListing")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("buyer_requirements.id"), nullable=True)
    match_plan_id = Column(Integer, ForeignKey("match_plans.id"), nullable=True)
    total_amount = Column(Float, nullable=False)
    total_quantity_kg = Column(Float, nullable=False)
    crop = Column(String(100), nullable=False)
    status = Column(String(50), default="CONFIRMED")  
    # Lifecycle: CONFIRMED -> PRODUCE_COLLECTED -> QUALITY_CHECKED -> IN_TRANSIT -> DELIVERED
    delivery_address = Column(Text, nullable=False)
    destination_city = Column(String(100), default="Mumbai")
    estimated_delivery = Column(DateTime, nullable=True)
    actual_delivery = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="orders")
    match_plan = relationship("MatchPlan", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    digital_lots = relationship("DigitalLot", back_populates="order")
    routes = relationship("Route", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("produce_listings.id"), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    crop = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    lot_code = Column(String(50), nullable=True)

    order = relationship("Order", back_populates="items")


class DigitalLot(Base):
    __tablename__ = "digital_lots"

    id = Column(Integer, primary_key=True, index=True)
    lot_code = Column(String(100), unique=True, index=True)  # e.g., LOT-TOM-NK-2609-00421
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    listing_id = Column(Integer, ForeignKey("produce_listings.id"), nullable=True)
    crop = Column(String(100), nullable=False)
    grade = Column(String(10), default="A")
    quantity_kg = Column(Float, nullable=False)
    origin_location = Column(String(255), nullable=False)  # Nashik, Maharashtra
    destination_location = Column(String(255), nullable=False)  # Mumbai
    farmer_name = Column(String(255), nullable=True)
    fpo_name = Column(String(255), nullable=True)
    harvest_date = Column(DateTime, default=datetime.utcnow)
    pickup_date = Column(DateTime, nullable=True)
    recommended_delivery_deadline = Column(DateTime, nullable=True)
    freshness_priority = Column(String(20), default="HIGH")
    status = Column(String(50), default="In Transit")  # Farm, Collection, Transport, Buyer
    qr_code_svg = Column(Text, nullable=True)
    price_farmer_realisation = Column(Float, default=25.0)
    price_logistics = Column(Float, default=4.0)
    price_platform = Column(Float, default=2.0)
    price_other = Column(Float, default=1.0)
    total_buyer_price = Column(Float, default=32.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="digital_lots")
    events = relationship("LotEvent", back_populates="lot", cascade="all, delete-orphan")


class LotEvent(Base):
    __tablename__ = "lot_events"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("digital_lots.id"), nullable=False)
    event_name = Column(String(100), nullable=False)  # Farm, FPO Collection, Quality Checked, In Transit, Delivered
    actor = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(String(255), nullable=True)
    is_completed = Column(Boolean, default=True)

    lot = relationship("DigitalLot", back_populates="events")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String(50), unique=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    vehicle_capacity_kg = Column(Float, default=1000.0)
    current_load_kg = Column(Float, default=700.0)
    total_distance_km = Column(Float, default=184.0)
    estimated_duration_mins = Column(Integer, default=240)
    status = Column(String(50), default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, DELAYED, COMPLETED
    delay_minutes = Column(Integer, default=0)
    delay_reason = Column(String(255), nullable=True)
    eta_text = Column(String(100), default="Today, 11:30 AM")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    stop_type = Column(String(50), nullable=False)  # PICKUP, COLLECTION_CENTER, DELIVERY
    location_name = Column(String(255), nullable=False)
    scheduled_time = Column(String(50), nullable=False)
    actual_time = Column(String(50), nullable=True)
    quantity_kg = Column(Float, nullable=False)
    cumulative_load_kg = Column(Float, nullable=False)
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, REACHED, COMPLETED

    route = relationship("Route", back_populates="stops")


class ForecastRecord(Base):
    __tablename__ = "forecast_records"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)  # Mumbai, Pune, Nashik, etc.
    current_demand_kg = Column(Float, nullable=False)
    forecast_demand_kg = Column(Float, nullable=False)
    pct_change = Column(Float, nullable=False)
    period = Column(String(50), default="Next 7 Days")
    confidence_pct = Column(Float, default=89.5)
    festival_factor = Column(String(100), nullable=True)  # e.g., Ganesh Festival Demand Surge
    recommendation_text = Column(Text, nullable=False)
    action_cta = Column(String(100), default="List Additional Supply")
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # FARMER, FPO, BUYER, DRIVER
    entity_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    overall_score = Column(Float, default=94.0)  # 0 to 100
    fulfillment_rate = Column(Float, default=96.0)
    on_time_rate = Column(Float, default=94.0)
    quality_consistency = Column(Float, default=91.0)
    cancellation_rate = Column(Float, default=2.0)
    verification_badge = Column(String(50), default="VERIFIED")  # VERIFIED, PENDING, REVIEW_REQUIRED
    updated_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role_target = Column(String(50), nullable=True)  # farmer, buyer, driver, admin, all
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notif_type = Column(String(50), default="info")  # alert, success, warning, info
    action_link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class PriceRule(Base):
    __tablename__ = "price_rules"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)  # Mumbai, Pune, Nashik, etc.
    grade = Column(String(10), default="A")
    base_indicative_price = Column(Float, nullable=False, default=28.0)
    consumer_price = Column(Float, nullable=False, default=32.0)
    farmer_realisation = Column(Float, nullable=False, default=27.0)
    logistics_cost = Column(Float, nullable=False, default=3.0)
    platform_fee = Column(Float, nullable=False, default=2.0)
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(100), default="Admin")
    updated_at = Column(DateTime, default=datetime.utcnow)


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    price_rule_id = Column(Integer, ForeignKey("price_rules.id"), nullable=True)
    crop = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)
    grade = Column(String(10), default="A")
    old_price = Column(Float, nullable=False)
    new_price = Column(Float, nullable=False)
    changed_by = Column(String(100), default="Admin")
    timestamp = Column(DateTime, default=datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_code = Column(String(50), unique=True, index=True)  # F2M-INV-000912, F2M-FPO-000421
    invoice_type = Column(String(50), nullable=False)  # FARMER_SALE, CONSUMER_PURCHASE, FPO_PURCHASE
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    buyer_id = Column(Integer, nullable=True)
    seller_id = Column(Integer, nullable=True)
    buyer_name = Column(String(255), nullable=False)
    seller_name = Column(String(255), nullable=False)
    crop = Column(String(100), nullable=False)
    grade = Column(String(10), default="A")
    quantity_kg = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    gross_amount = Column(Float, nullable=False)
    farmer_realisation = Column(Float, nullable=False)
    logistics_fee = Column(Float, default=0.0)
    platform_fee = Column(Float, default=0.0)
    payment_status = Column(String(50), default="Pending")  # Pending, Processing, Paid
    payment_ref = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(255), default="System")
    role = Column(String(50), default="admin")
    action_type = Column(String(100), nullable=False)  # PRICE_UPDATE, INVOICE_GENERATED, PAYMENT_UPDATE, ORDER_STATUS
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


