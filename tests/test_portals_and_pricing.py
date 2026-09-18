import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_public_user_login():
    # Farmer login
    res = client.post("/api/auth/login", json={
        "email": "ramesh@nashikfarm.in",
        "password": "farmer123"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "farmer"
    assert "access_token" in data

    # Consumer / Buyer login
    res2 = client.post("/api/auth/login", json={
        "email": "priya@freshmart.in",
        "password": "buyer123"
    })
    assert res2.status_code == 200, res2.text
    data2 = res2.json()
    assert data2["role"] == "buyer"

def test_admin_login():
    res = client.post("/api/auth/login", json={
        "email": "admin@farm2market.demo",
        "password": "F2M@Admin2026!"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "admin"
    assert "access_token" in data

def test_pricing_management():
    # Fetch rules
    res = client.get("/api/pricing/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) > 0

    # Fetch specific rule
    res_rule = client.get("/api/pricing/rule?crop=Tomato&region=Maharashtra&grade=A")
    assert res_rule.status_code == 200
    rule = res_rule.json()
    assert rule["crop"] == "Tomato"
    assert rule["indicative_market_price"] > 0

    # Update pricing rule
    update_res = client.post("/api/pricing/rule", json={
        "crop": "Tomato",
        "region": "Maharashtra",
        "grade": "A",
        "indicative_market_price": 34.0,
        "farmer_base_price": 28.5,
        "logistics_cost": 3.5,
        "platform_margin": 2.0,
        "reason": "Test suite automated price adjustment",
        "admin_email": "admin@farm2market.demo"
    })
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["indicative_market_price"] == 34.0
    assert updated["farmer_base_price"] == 28.5

def test_fpo_member_purchase():
    res = client.post("/api/invoices/fpo-purchase", json={
        "member_farmer_name": "Suresh Gawli",
        "crop": "Tomato",
        "quantity": 500.0,
        "rate_per_kg": 27.0,
        "notes": "Pimpalgaon Batch 102"
    })
    assert res.status_code == 200
    inv = res.json()
    assert inv["invoice_number"].startswith("F2M-FPO-")
    assert inv["invoice_type"] == "FPO_PURCHASE"
    assert inv["total_amount"] == 13500.0

def test_consumer_checkout_and_invoices():
    payload = {
        "customer_name": "Hotel Taj Grand Kitchens",
        "customer_email": "procurement@tajgrand.in",
        "delivery_address": "Dock 4, Colaba, Mumbai",
        "destination_city": "Mumbai",
        "items": [
            {
                "crop": "Tomato",
                "grade": "A",
                "quantity": 100.0,
                "price_per_kg": 32.0,
                "farmer_name": "Ramesh Patil",
                "farmer_id": 1
            }
        ],
        "total_amount": 3200.0
    }
    res = client.post("/api/orders/consumer-checkout", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "order" in data
    assert "consumer_invoice" in data
    assert "farmer_invoice" in data
    assert "digital_lot" in data

    assert data["consumer_invoice"]["invoice_number"].startswith("F2M-ORD-")
    assert data["farmer_invoice"]["invoice_number"].startswith("F2M-INV-")
    assert data["digital_lot"]["lot_code"].startswith("LOT-")

def test_audit_logs():
    res = client.get("/api/audit/logs")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    # verify sha256 hash existence
    for l in logs:
        assert "record_hash" in l
        assert len(l["record_hash"]) == 64  # valid SHA-256 hex string

