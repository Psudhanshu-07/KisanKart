from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database
from app.routers import (
    auth_routes,
    produce_routes,
    buyer_routes,
    matching_routes,
    demand_pool_routes,
    forecast_routes,
    logistics_routes,
    orders_routes,
    lot_routes,
    admin_routes,
    pricing_routes,
    invoice_routes,
    audit_routes
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KisanKart API",
    description="Production-ready public agricultural marketplace for farmer-to-consumer direct trading.",
    version="1.0.0"
)

# Enable CORS for local Next.js frontend & mobile preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(produce_routes.router, prefix="/api")
app.include_router(buyer_routes.router, prefix="/api")
app.include_router(matching_routes.router, prefix="/api")
app.include_router(demand_pool_routes.router, prefix="/api")
app.include_router(forecast_routes.router, prefix="/api")
app.include_router(logistics_routes.router, prefix="/api")
app.include_router(orders_routes.router, prefix="/api")
app.include_router(lot_routes.router, prefix="/api")
app.include_router(admin_routes.router, prefix="/api")
app.include_router(pricing_routes.router, prefix="/api")
app.include_router(invoice_routes.router, prefix="/api")
app.include_router(audit_routes.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    # Public deployment should not preload demo products or fake sellers.
    pass

@app.get("/")
def root():
    return {
        "platform": "KisanKart",
        "description": "Direct farmer-to-consumer agricultural marketplace with transparent pricing.",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {
        "status": "healthy",
        "database": "connected",
        "database_url_scheme": settings.DATABASE_URL.split(":", 1)[0],
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_PUBLISHABLE_KEY),
        "demo_mode": settings.DEMO_MODE
    }
