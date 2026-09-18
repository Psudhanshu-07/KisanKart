import pytest
from app.database import SessionLocal, Base, engine
from app.models import User, ProduceListing
from app.seed_data import seed_database
from app.engines.matching_engine import SmartMatchingEngine
from app.engines.demand_pool_engine import DemandPoolEngine
from app.engines.forecasting_engine import DemandForecastingEngine
from app.engines.logistics_engine import LogisticsOptimisationEngine
from app.engines.trust_engine import TrustEngine

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    seed_database()
    db = SessionLocal()
    yield db
    db.close()

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
    assert len(plan.matched_suppliers) >= 2  # Must aggregate multiple suppliers
    assert plan.overall_matching_score > 80.0
    # Check explainable subscores exist
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

def test_demand_forecasting_engine():
    forecast = DemandForecastingEngine.generate_forecast(crop="Tomato", region="Mumbai")
    assert forecast["current_demand_kg"] > 0
    assert forecast["forecast_demand_kg"] > forecast["current_demand_kg"]
    assert forecast["pct_change"] > 0
    assert "List Additional" in forecast["action_cta"]

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
    assert "11:48 AM" in delayed_route["eta_text"]

def test_trust_engine_breakdown():
    pricing = TrustEngine.get_price_breakdown(32.0)
    assert pricing["buyer_price"] == 32.0
    assert pricing["farmer_realisation"] > 20.0
    assert pricing["logistics"] > 0
    assert pricing["platform_service"] > 0


def test_default_marketplace_starts_empty():
    # Production mode should not preload demo sellers, buyers, or stock.
    db = SessionLocal()
    try:
        db.query(User).delete()
        db.commit()
        seed_database(db)
        assert db.query(User).count() == 0
        assert db.query(ProduceListing).count() == 0
    finally:
        db.close()

