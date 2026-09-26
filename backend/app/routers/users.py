from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.core.security import hash_password, verify_password
from app.database.database import get_db
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.services.audit import record_audit_event
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


class ProfileUpdate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class TechnicianCreate(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    department_id: int = Field(..., gt=0)
    phone: str | None = Field(default=None, max_length=30)


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "employee_id": current_user.employee_id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.name,
        "department": (
            current_user.department.name
            if current_user.department
            else None
        ),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
    }


@router.patch("/me")
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_email = (
        db.query(User)
        .filter(User.email == profile_data.email, User.id != current_user.id)
        .first()
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    old_value = f"{current_user.first_name} {current_user.last_name} <{current_user.email}>"
    current_user.first_name = profile_data.first_name.strip()
    current_user.last_name = profile_data.last_name.strip()
    current_user.email = str(profile_data.email)
    current_user.phone = profile_data.phone.strip() if profile_data.phone else None

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="UPDATE_PROFILE",
        entity_type="User",
        entity_id=current_user.id,
        old_value=old_value,
        new_value=f"{current_user.first_name} {current_user.last_name} <{current_user.email}>",
    )

    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@router.post("/me/password")
def change_my_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if verify_password(password_data.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password",
        )

    current_user.password_hash = hash_password(password_data.new_password)
    record_audit_event(
        db=db,
        user_id=current_user.id,
        action="CHANGE_PASSWORD",
        entity_type="User",
        entity_id=current_user.id,
        new_value="Password changed",
    )
    db.commit()
    AuthService.revoke_all_tokens(db, current_user.id)
    return {"message": "Password updated successfully"}


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.name if user.role else None,
        "department": user.department.name if user.department else None,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


@router.post("/admin/technicians", status_code=status.HTTP_201_CREATED)
def create_technician(
    technician_data: TechnicianCreate,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == technician_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    if db.query(User).filter(User.employee_id == technician_data.employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID is already registered",
        )

    department = db.get(Department, technician_data.department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    technician_role = db.query(Role).filter(Role.name == "Technician").first()
    if technician_role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Technician role has not been created",
        )

    technician = User(
        employee_id=technician_data.employee_id.strip(),
        first_name=technician_data.first_name.strip(),
        last_name=technician_data.last_name.strip(),
        email=str(technician_data.email),
        password_hash=hash_password(technician_data.password),
        phone=technician_data.phone.strip() if technician_data.phone else None,
        department_id=department.id,
        role_id=technician_role.id,
        is_active=True,
    )

    try:
        db.add(technician)
        db.flush()
        record_audit_event(
            db=db,
            user_id=current_user.id,
            action="CREATE_TECHNICIAN",
            entity_type="User",
            entity_id=technician.id,
            new_value=f"{technician.first_name} {technician.last_name} ({technician.email})",
        )
        db.commit()
        db.refresh(technician)
        return serialize_user(technician)
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create technician account",
        ) from error


@router.get("/admin/all")
def get_all_users(
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    try:
        users = (
            db.query(User)
            .order_by(User.created_at.desc())
            .all()
        )
        return [serialize_user(user) for user in users]
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load users",
        ) from error


def set_user_active_state(
    user_id: int,
    is_active: bool,
    current_user: User,
    db: Session,
):
    if user_id == current_user.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_active == is_active:
        state = "active" if is_active else "inactive"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User account is already {state}",
        )

    try:
        user.is_active = is_active
        record_audit_event(
            db=db,
            user_id=current_user.id,
            action="ACTIVATE" if is_active else "DEACTIVATE",
            entity_type="User",
            entity_id=user.id,
            old_value="Active" if not is_active else "Inactive",
            new_value="Active" if is_active else "Inactive",
        )
        db.commit()
        db.refresh(user)
        return serialize_user(user)
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update user account",
        ) from error


@router.patch("/admin/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    return set_user_active_state(user_id, False, current_user, db)


@router.patch("/admin/{user_id}/activate")
def activate_user(
    user_id: int,
    current_user: User = Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    return set_user_active_state(user_id, True, current_user, db)