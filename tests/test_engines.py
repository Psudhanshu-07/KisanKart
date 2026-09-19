import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, FarmerProfile, ProduceListing, BuyerRequirement
from app.engines.matching_engine import SmartMatchingEngine
from app.engines.demand_pool_engine import DemandPoolEngine
from app.engines.forecasting_engine import DemandForecastingEngine
from app.engines.logistics_engine import LogisticsOptimisationEngine
from app.engines.trust_engine import TrustEngine

TEST_ENGINE = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=TEST_ENGINE)
    db = TestingSessionLocal()

    # Seed test fixtures for testing engines
    u1 = User(id=101, email="test_farmer1@kisankart.in", full_name="Farmer One", hashed_password="x", role="farmer")
    u2 = User(id=102, email="test_farmer2@kisankart.in", full_name="Farmer Two", hashed_password="x", role="farmer")
    db.add_all([u1, u2])
    db.commit()

    fp1 = FarmerProfile(user_id=101, district="Nashik", kyc_status="VERIFIED")
    fp2 = FarmerProfile(user_id=102, district="Nashik", kyc_status="VERIFIED")
    db.add_all([fp1, fp2])
    db.commit()

    l1 = ProduceListing(
        id=201, user_id=101, produce_name="Tomato", grade="A",
        quantity_available=600.0, quantity_initial=600.0,
        price_per_unit=28.0, district="Nashik", location_name="Pimpalgaon Farm",
        harvest_date=datetime.utcnow(), status="AVAILABLE"
    )
    l2 = ProduceListing(
        id=202, user_id=102, produce_name="Tomato", grade="A",
        quantity_available=600.0, quantity_initial=600.0,
        price_per_unit=30.0, district="Nashik", location_name="Dindori Farm",
        harvest_date=datetime.utcnow(), status="AVAILABLE"
    )
    db.add_all([l1, l2])

    req1 = BuyerRequirement(
        id=301, buyer_id=101, crop="Tomato", quantity_required=400.0,
        max_budget_per_unit=32.0, district="Mumbai", location_name="Mumbai Central Kitchen",
        status="OPEN", target_delivery_date=datetime.utcnow() + timedelta(days=3)
    )
    req2 = BuyerRequirement(
        id=302, buyer_id=102, crop="Tomato", quantity_required=300.0,
        max_budget_per_unit=32.0, district="Mumbai", location_name="Navi Mumbai Hub",
        status="OPEN", target_delivery_date=datetime.utcnow() + timedelta(days=3)
    )
    db.add_all([req1, req2])
    db.commit()

    yield db
    db.close()
    Base.metadata.drop_all(bind=TEST_ENGINE)

def test_matching_score_weights():
    # Verify weights sum exactly to 100.0%
    total_weights = (
        SmartMatchingEngine.WEIGHT_QUANTITY +
        SmartMatchingEngine.WEIGHT_DISTANCE +
        SmartMatchingEngine.WEIGHT_PRICE +
        SmartMatchingEngine.WEIGHT_QUALITY +
        SmartMatchingEngine.WEIGHT_RELIABILITY
    )
    assert abs(total_weights - 100.0) < 0.01

def test_smart_matching_multi_supplier_aggregation(db_session):
    plan = SmartMatchingEngine.generate_smart_supply_plan(
        db=db_session,
        crop="Tomato",
        required_quantity=1000.0,
        preferred_grade="A",
        destination_district="Mumbai"
    )
    assert plan.required_quantity == 1000.0
    assert plan.matched_quantity == 1000.0
    assert plan.fulfillment_percentage == 100.0
    assert len(plan.matched_suppliers) >= 2  # Aggregates multiple suppliers
    assert plan.overall_matching_score > 70.0
    for supp in plan.matched_suppliers:
        assert supp.subscores.quantity_score >= 0
        assert supp.subscores.distance_score >= 0
        assert len(supp.subscores.explanation_notes) > 0

def test_demand_pool_aggregation(db_session):
    pool = DemandPoolEngine.aggregate_compatible_requirements(
        db=db_session,
        crop="Tomato",
        district="Mumbai"
    )
    assert pool.crop == "Tomato"
    assert pool.total_quantity_kg >= 500.0
    assert pool.estimated_savings_pct > 0
    assert pool.fewer_trips_pct > 0

def test_demand_forecasting_engine(db_session):
    forecast = DemandForecastingEngine.generate_forecast(crop="Tomato", region="Mumbai", db=db_session)
    assert forecast["current_demand_kg"] > 0
    assert forecast["forecast_demand_kg"] >= 0
    assert "Tomato" in forecast["crop"]
    assert "Mumbai" in forecast["region"]

def test_logistics_optimisation_engine():
    pickups = [
        {"location_name": "Farmer A", "quantity_kg": 300.0, "type": "PICKUP", "freshness_priority": "HIGH"},
        {"location_name": "FPO Hub", "quantity_kg": 400.0, "type": "COLLECTION_CENTER", "freshness_priority": "HIGH"},
        {"location_name": "Farmer C", "quantity_kg": 300.0, "type": "PICKUP", "freshness_priority": "HIGH"}
    ]
    dest = {"location_name": "Buyer Mumbai"}
    route = LogisticsOptimisationEngine.generate_optimised_route(
        driver_id=4,
        pickups=pickups,
        destination=dest,
        vehicle_capacity_kg=1000.0
    )
    assert route["vehicle_capacity_kg"] == 1000.0
    assert route["current_load_kg"] == 1000.0
    assert route["is_full"] is True
    assert len(route["stops"]) == 4  # 3 pickups + 1 delivery

    # Test delay reporting
    delayed_route = LogisticsOptimisationEngine.apply_delay(route, 18, "Traffic at Kasara Ghat")
    assert delayed_route["delay_minutes"] == 18
    assert delayed_route["status"] == "DELAYED"
    assert "eta_text" in delayed_route

def test_trust_engine_breakdown():
    pricing = TrustEngine.get_price_breakdown(32.0)
    assert pricing["buyer_price"] == 32.0
    assert pricing["farmer_realisation"] > 20.0
    assert pricing["logistics"] > 0
    assert pricing["platform_service"] > 0
