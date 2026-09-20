from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    name: Optional[str] = None
    fullName: Optional[str] = None
    farmer_name: Optional[str] = None
    password: str
    role: str  # farmer, fpo, buyer, driver, admin
    phone: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- Produce Listing Schemas ---
class ListingCreate(BaseModel):
    produce_name: Optional[str] = None
    crop_name: Optional[str] = None
    crop: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = "Vegetable"
    quantity_available: Optional[float] = None
    quantity_kg: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = "kg"
    grade: Optional[str] = "A"  # A, B, C
    price_per_unit: Optional[float] = None
    price_per_kg: Optional[float] = None
    rate_per_kg: Optional[float] = None
    farmer_price: Optional[float] = None
    location_name: Optional[str] = "Pimpalgaon Farm Cluster"
    district: Optional[str] = "Nashik"
    state: Optional[str] = "Maharashtra"
    freshness_window_days: Optional[int] = 4
    shelf_life_days: Optional[int] = 4
    freshness_priority: Optional[str] = "HIGH"

class ListingResponse(BaseModel):
    id: int
    user_id: int
    produce_name: str
    category: str
    quantity_available: float
    quantity_initial: float
    unit: str
    grade: str
    price_per_unit: float
    location_name: str
    district: str
    state: str
    harvest_date: datetime
    freshness_window_days: int
    recommended_delivery_deadline: Optional[datetime]
    freshness_priority: str
    status: str
    is_fpo_aggregated: bool
    created_at: datetime
    farmer_name: Optional[str] = None
    trust_score: Optional[float] = 94.0

    class Config:
        from_attributes = True

class VoiceListingParseRequest(BaseModel):
    text: str  # e.g., "Mere paas 500 kilo tomato hai, grade A, Nashik se" or "I have 300 kg onion grade B"

class VoiceListingParseResponse(BaseModel):
    crop: str
    category: str
    quantity: float
    unit: str
    grade: str
    district: str
    inferred_shelf_life_days: int
    suggested_price_per_kg: float
    raw_text: str

# --- Buyer Requirement Schemas ---
class RequirementCreate(BaseModel):
    crop: str
    category: Optional[str] = "Vegetable"
    quantity_required: float = Field(gt=0)
    unit: Optional[str] = "kg"
    preferred_grade: Optional[str] = "A"
    location_name: str
    district: str
    target_delivery_date: datetime
    max_budget_per_unit: Optional[float] = None

class RequirementResponse(BaseModel):
    id: int
    buyer_id: int
    crop: str
    category: str
    quantity_required: float
    unit: str
    preferred_grade: str
    location_name: str
    district: str
    target_delivery_date: datetime
    max_budget_per_unit: Optional[float]
    status: str
    created_at: datetime
    buyer_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Smart Matching Schemas ---
class ExplainableSubscores(BaseModel):
    quantity_score: float  # out of 100
    distance_score: float
    price_score: float
    quality_score: float
    reliability_score: float
    # Weighted contribution
    quantity_weight: float = 38.1
    distance_weight: float = 19.05
    price_weight: float = 14.29
    quality_weight: float = 14.29
    reliability_weight: float = 9.52
    explanation_notes: List[str]

class MatchItemDetail(BaseModel):
    listing_id: int
    supplier_id: int
    supplier_name: str
    supplier_type: str  # Farmer or FPO
    quantity_allocated: float
    unit: str = "kg"
    price_per_unit: float
    pickup_location: str
    distance_km: float
    score_percentage: float
    subscores: ExplainableSubscores
    freshness_priority: str = "HIGH"

class SmartSupplyPlan(BaseModel):
    requirement_id: Optional[int] = None
    crop: str
    required_quantity: float
    matched_quantity: float
    fulfillment_percentage: float
    average_price: float
    supplier_count: int
    pickup_points_count: int
    overall_matching_score: float
    estimated_delivery: str
    total_estimated_amount: float
    matched_suppliers: List[MatchItemDetail]
    price_breakdown: Dict[str, float]  # {farmer_realisation, logistics, platform, packaging, total}
    is_simulation: bool = False

# --- Demand Pool Schemas ---
class DemandPoolResponse(BaseModel):
    id: int
    pool_code: str
    crop: str
    district: str
    total_quantity_kg: float
    target_delivery_date: datetime
    status: str
    estimated_savings_pct: float
    fewer_trips_pct: float
    created_at: datetime
    buyers_count: int
    items: List[Dict[str, Any]]

# --- Order & Tracking Schemas ---
class ConfirmPlanRequest(BaseModel):
    requirement_id: int
    plan_data: Optional[Dict[str, Any]] = None
    delivery_address: str
    destination_city: str

class OrderResponse(BaseModel):
    id: int
    order_code: str
    buyer_id: int
    crop: str
    total_amount: float
    total_quantity_kg: float
    status: str
    delivery_address: str
    destination_city: str
    estimated_delivery: Optional[datetime]
    created_at: datetime
    timeline: List[Dict[str, Any]]
    items: List[Dict[str, Any]]
    digital_lots: List[str]

class OrderStatusUpdate(BaseModel):
    status: str  # CONFIRMED, PRODUCE_COLLECTED, QUALITY_CHECKED, IN_TRANSIT, DELIVERED
    actor: str
    location: str
    notes: Optional[str] = None

# --- Digital Lot & QR Schemas ---
class LotEventResponse(BaseModel):
    id: int
    event_name: str
    actor: str
    location: str
    timestamp: datetime
    notes: Optional[str]
    is_completed: bool

class DigitalLotResponse(BaseModel):
    id: int
    lot_code: str
    order_id: Optional[int]
    crop: str
    grade: str
    quantity_kg: float
    origin_location: str
    destination_location: str
    farmer_name: Optional[str]
    fpo_name: Optional[str]
    harvest_date: datetime
    pickup_date: Optional[datetime]
    recommended_delivery_deadline: Optional[datetime]
    freshness_priority: str
    status: str
    price_farmer_realisation: float
    price_logistics: float
    price_platform: float
    price_other: float
    total_buyer_price: float
    events: List[LotEventResponse]

# --- Route & Logistics Schemas ---
class RouteStopResponse(BaseModel):
    id: int
    stop_sequence: int
    stop_type: str
    location_name: str
    scheduled_time: str
    actual_time: Optional[str]
    quantity_kg: float
    cumulative_load_kg: float
    contact_name: Optional[str]
    contact_phone: Optional[str]
    status: str

class RouteResponse(BaseModel):
    id: int
    route_code: str
    driver_id: int
    driver_name: Optional[str]
    vehicle_capacity_kg: float
    current_load_kg: float
    total_distance_km: float
    estimated_duration_mins: int
    status: str
    delay_minutes: int
    delay_reason: Optional[str]
    eta_text: str
    stops: List[RouteStopResponse]

class DelayReportRequest(BaseModel):
    delay_minutes: int
    reason: str

class RouteCreateRequest(BaseModel):
    order_id: int
    driver_id: Optional[int] = None

# --- Forecast Schemas ---
class ForecastResponse(BaseModel):
    id: int
    crop: str
    region: str
    current_demand_kg: float
    forecast_demand_kg: float
    pct_change: float
    period: str
    confidence_pct: float
    festival_factor: Optional[str]
    recommendation_text: str
    action_cta: str
    is_simulated: bool

# --- Admin Schemas ---
class RegionSupplyDemandGap(BaseModel):
    region: str
    crop: str
    demand_kg: float
    supply_kg: float
    gap_kg: float
    status: str  # Shortage, Surplus, Balanced, Logistics Bottleneck
    recommendation: str
    is_simulated: bool = True

class AdminDashboardStats(BaseModel):
    total_farmers: int
    total_fpos: int
    total_buyers: int
    total_drivers: int
    active_orders: int
    active_listings: int
    total_volume_kg: float
    regional_gaps: List[RegionSupplyDemandGap]
    total_gmv: float = 0.0
    active_routes: int = 0
    demand_analysis: List[Dict[str, Any]] = []
    route_records: List[Dict[str, Any]] = []
    order_records: List[Dict[str, Any]] = []


# --- Pricing Engine Schemas ---
class PriceRuleCreate(BaseModel):
    crop: str
    region: str
    grade: Optional[str] = "A"
    base_indicative_price: Optional[float] = None
    consumer_price: Optional[float] = None
    indicative_market_price: Optional[float] = None
    farmer_realisation: Optional[float] = None
    farmer_base_price: Optional[float] = None
    logistics_cost: Optional[float] = 3.0
    platform_fee: Optional[float] = None
    platform_margin: Optional[float] = None
    reason: Optional[str] = None
    admin_email: Optional[str] = None

class PriceRuleResponse(BaseModel):
    id: int
    crop: str
    region: str
    grade: str
    base_indicative_price: float
    consumer_price: float
    indicative_market_price: Optional[float] = None
    farmer_realisation: float
    farmer_base_price: Optional[float] = None
    logistics_cost: float
    platform_fee: float
    platform_margin: Optional[float] = None
    is_active: bool
    updated_by: str
    updated_at: datetime

    class Config:
        from_attributes = True

class PriceHistoryResponse(BaseModel):
    id: int
    price_rule_id: Optional[int]
    crop: str
    region: str
    grade: str
    old_price: float
    new_price: float
    changed_by: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Invoice Schemas ---
class InvoiceResponse(BaseModel):
    id: int
    invoice_code: str
    invoice_number: Optional[str] = None
    invoice_type: str  # FARMER_SALE, CONSUMER_PURCHASE, FPO_PURCHASE
    order_id: Optional[int] = None
    buyer_id: Optional[int] = None
    seller_id: Optional[int] = None
    buyer_name: str
    seller_name: str
    recipient_name: Optional[str] = None
    issuer_name: Optional[str] = None
    crop: str
    grade: str
    quantity_kg: float
    unit_price: float
    rate_per_kg: Optional[float] = None
    gross_amount: float
    total_amount: Optional[float] = None
    farmer_realisation: float
    logistics_fee: float
    platform_fee: float
    payment_status: str
    status: Optional[str] = None
    payment_ref: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FPOPurchaseRequest(BaseModel):
    farmer_id: Optional[int] = 1
    farmer_name: Optional[str] = None
    member_farmer_name: Optional[str] = None
    produce_name: Optional[str] = None
    crop: Optional[str] = None
    quantity: Optional[float] = None
    quantity_kg: Optional[float] = None
    rate_per_kg: Optional[float] = None
    unit_price: Optional[float] = None
    grade: Optional[str] = "A"
    notes: Optional[str] = None

# --- Consumer Cart & Direct Checkout ---
class CartItemSchema(BaseModel):
    produce_id: Optional[int] = None
    id: Optional[int] = None
    produce_name: Optional[str] = None
    crop: Optional[str] = None
    grade: Optional[str] = "A"
    quantity: Optional[float] = None
    quantity_kg: Optional[float] = None
    price_per_kg: Optional[float] = None
    farmer_name: Optional[str] = None
    farmer_id: Optional[int] = None
    district: Optional[str] = None

class ConsumerCheckoutRequest(BaseModel):
    items: List[CartItemSchema]
    delivery_address: str
    city: Optional[str] = None
    destination_city: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    total_amount: Optional[float] = None

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_name: str
    role: str
    action_type: str
    entity_type: str
    entity_id: Optional[str]
    details_json: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


