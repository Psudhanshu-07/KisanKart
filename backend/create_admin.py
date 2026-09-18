import getpass
import os

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import User


def main() -> None:
    Base.metadata.create_all(bind=engine)
    email = os.getenv("ADMIN_EMAIL") or input("Admin email: ").strip().lower()
    full_name = os.getenv("ADMIN_NAME") or input("Admin full name: ").strip()
    password = os.getenv("ADMIN_PASSWORD")
    if password is None:
        password = getpass.getpass("Admin password (hidden; type and press Enter): ")
        if not password:
            password = input("Password fallback (visible; type and press Enter): ")

    if not email or not full_name or not password:
        raise SystemExit("Admin email, name, and a non-empty password are required")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role != "admin":
                raise SystemExit("That email already belongs to a non-admin account")
            existing.full_name = full_name
            existing.hashed_password = hash_password(password)
            existing.is_active = True
            message = "Admin account updated"
        else:
            db.add(User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                role="admin",
                is_active=True,
            ))
            message = "Admin account created"
        db.commit()
        print(message)
    finally:
        db.close()


if __name__ == "__main__":
    main()
