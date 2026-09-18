import datetime
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal


def seed_database(db: Session = None):
    """KisanKart intentionally starts with an empty marketplace.

    Real production deployments should not insert fake farmers, FPOs, products,
    or transactions. Farmers and buyers will add live listings and orders once the
    system goes live.
    """
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()

    try:
        return {"status": "empty", "message": "KisanKart marketplace is empty by design"}
    finally:
        if db is not None:
            db.close()


if __name__ == "__main__":
    seed_database()

