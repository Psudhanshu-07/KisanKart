import os
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.database import get_db
from app.models import User, FarmerProfile, FPOProfile, BuyerProfile, DriverProfile
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister, db: Session = Depends(get_db)):
    requested_role = req.role.lower().strip()
    if requested_role not in {"farmer", "fpo", "buyer"}:
        raise HTTPException(status_code=403, detail="This role cannot be created through public registration")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    resolved_full_name = (req.full_name or req.name or req.fullName or req.farmer_name or "").strip()
    if not resolved_full_name:
        resolved_full_name = "Kisan Farmer" if requested_role == "farmer" else "Kisan FPO" if requested_role == "fpo" else "Buyer"

    p_data = req.profile_data or {}
    upi_id = str(p_data.get("upi_id") or "").strip().lower()
    if requested_role in {"farmer", "fpo"}:
        if not re.fullmatch(r"[a-z0-9][a-z0-9._-]{1,254}@[a-z][a-z0-9.-]{1,62}", upi_id):
            raise HTTPException(status_code=400, detail="A valid UPI ID is required for farmer and FPO registration")
        if upi_id == "demo@kisankart" and os.getenv("DEMO_MODE", "true").lower() == "false":
            raise HTTPException(status_code=400, detail="Demo UPI is not available outside demo mode")
        if db.query(FarmerProfile).filter(FarmerProfile.upi_id == upi_id).first() or db.query(FPOProfile).filter(FPOProfile.upi_id == upi_id).first():
            raise HTTPException(status_code=400, detail="This UPI ID is already registered")

    user = User(
        email=req.email,
        full_name=resolved_full_name,
        hashed_password=hash_password(req.password),
        role=requested_role,
        phone=req.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Provision role profile
    if user.role == "farmer":
        fp = FarmerProfile(
            user_id=user.id,
            farm_name=p_data.get("farm_name", f"{user.full_name}'s Farm"),
            village=p_data.get("village", "Farm Gate"),
            district=p_data.get("district", "Nashik"),
            land_size_acres=float(p_data.get("land_size_acres", 3.0) or 3.0),
            upi_id=upi_id,
            kyc_status="VERIFIED"
        )
        db.add(fp)
    elif user.role == "fpo":
        fpop = FPOProfile(
            user_id=user.id,
            fpo_name=p_data.get("fpo_name") or p_data.get("business_name") or f"{user.full_name} FPO",
            district=p_data.get("district", "Nashik"),
            member_count=int(p_data.get("member_count", 150) or 150),
            verification_status="VERIFIED",
            bank_verified=True,
            upi_id=upi_id,
        )
        db.add(fpop)
    elif user.role == "buyer":
        bp = BuyerProfile(
            user_id=user.id,
            business_name=p_data.get("business_name", user.full_name),
            buyer_type=p_data.get("buyer_type", "restaurant"),
            city=p_data.get("city", "Mumbai"),
            delivery_address=p_data.get("delivery_address", "Central Kitchen, Mumbai"),
            verification_status="VERIFIED"
        )
        db.add(bp)
    elif user.role == "driver":
        dp = DriverProfile(
            user_id=user.id,
            license_number=p_data.get("license_number", "MH-15-2022-0091"),
            vehicle_type=p_data.get("vehicle_type", "Tata Ace (1.2 Ton)"),
            vehicle_capacity_kg=1000.0,
            verification_status="VERIFIED"
        )
        db.add(dp)

    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        upi_id=(user.farmer_profile.upi_id if user.farmer_profile else user.fpo_profile.upi_id if user.fpo_profile else None)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    lookup_email = (req.email or "").strip().lower()
    upi_id = lookup_email

    # Farmer demo UPI bypass: if DEMO_MODE and upi_id == "demo@kisankart": allow_login()
    demo_mode_active = getattr(settings, "DEMO_MODE", False) or os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes", "on"}
    if demo_mode_active and upi_id == "demo@kisankart":
        farmer = db.query(User).filter(User.role == "farmer").first()
        if not farmer:
            farmer = User(
                email="demo@kisankart",
                full_name="Ramesh Patil (Demo Farmer)",
                hashed_password=hash_password("demo123"),
                role="farmer",
                is_active=True
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
            fp = FarmerProfile(
                user_id=farmer.id,
                farm_name="Ramesh Patil Model Farm",
                village="Pimpalgaon",
                district="Nashik",
                upi_id="demo@kisankart",
                kyc_status="VERIFIED"
            )
            db.add(fp)
            db.commit()

        token = create_access_token({"sub": str(farmer.id), "role": "farmer", "email": farmer.email})
        return TokenResponse(
            access_token=token,
            role="farmer",
            user_id=farmer.id,
            full_name=farmer.full_name,
            email=farmer.email,
            upi_id="demo@kisankart"
        )

    user = db.query(User).filter(func.lower(func.trim(User.email)) == lookup_email).first()
    if not user:
        user = db.query(User).filter(User.email.ilike(lookup_email)).first()
    if not user:
        farmer_profile = db.query(FarmerProfile).filter(
            func.lower(func.trim(FarmerProfile.upi_id)) == lookup_email,
            FarmerProfile.bank_verified == True,
            FarmerProfile.kyc_status == "VERIFIED",
        ).first()
        fpo_profile = db.query(FPOProfile).filter(
            func.lower(func.trim(FPOProfile.upi_id)) == lookup_email,
            FPOProfile.bank_verified == True,
            FPOProfile.verification_status == "VERIFIED",
        ).first()
        profile = farmer_profile or fpo_profile
        if profile:
            user = db.query(User).filter(User.id == profile.user_id).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        upi_id=(user.farmer_profile.upi_id if user.farmer_profile else user.fpo_profile.upi_id if user.fpo_profile else None)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prof_dict = {}
    if current_user.role == "farmer" and current_user.farmer_profile:
        prof_dict = {
            "farm_name": current_user.farmer_profile.farm_name,
            "district": current_user.farmer_profile.district,
            "kyc_status": current_user.farmer_profile.kyc_status,
            "bank_verified": current_user.farmer_profile.bank_verified
        }
    elif current_user.role == "fpo" and current_user.fpo_profile:
        prof_dict = {
            "fpo_name": current_user.fpo_profile.fpo_name,
            "district": current_user.fpo_profile.district,
            "verification_status": current_user.fpo_profile.verification_status,
            "bank_verified": current_user.fpo_profile.bank_verified,
        }
    elif current_user.role == "buyer" and current_user.buyer_profile:
        prof_dict = {
            "business_name": current_user.buyer_profile.business_name,
            "city": current_user.buyer_profile.city,
            "verification_status": current_user.buyer_profile.verification_status
        }
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profile=prof_dict
    )


