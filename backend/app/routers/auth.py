from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.database.database import get_db
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import Token, TokenRefresh, UserRegister
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    existing_employee = (
        db.query(User)
        .filter(User.employee_id == user_data.employee_id)
        .first()
    )
    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID is already registered",
        )

    department = db.get(Department, user_data.department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    employee_role = db.query(Role).filter(Role.name == "employee").first()
    if employee_role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee role has not been created",
        )

    password_hash = hash_password(user_data.password)

    new_user = User(
        employee_id=user_data.employee_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        password_hash=password_hash,
        phone=user_data.phone,
        department_id=user_data.department_id,
        role_id=employee_role.id,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "employee_id": new_user.employee_id,
        "email": new_user.email,
        "role": employee_role.name,
    }


@router.post(
    "/login",
    response_model=Token,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    tokens = AuthService.issue_tokens(db, user)
    return tokens


@router.post(
    "/refresh",
    response_model=Token,
)
def refresh_token(payload: TokenRefresh, db: Session = Depends(get_db)):
    return AuthService.rotate_refresh_token(db, payload.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
)
def logout(payload: TokenRefresh, db: Session = Depends(get_db)):
    AuthService.revoke_refresh_token(db, payload.refresh_token)
    return {"message": "Logged out successfully"}

   