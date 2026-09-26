import os
from dotenv import load_dotenv
from app.database.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.core.security import hash_password
load_dotenv()

db = SessionLocal()

try:
    # Read test passwords from environment variables.
    # These values should be stored in your local .env file.
    technician_password = os.getenv("TEST_TECHNICIAN_PASSWORD")
    admin_password = os.getenv("TEST_ADMIN_PASSWORD")

    if not technician_password:
        raise Exception("TEST_TECHNICIAN_PASSWORD is not set")

    if not admin_password:
        raise Exception("TEST_ADMIN_PASSWORD is not set")

    technician_role = (
        db.query(Role)
        .filter(Role.name == "Technician")
        .first()
    )

    admin_role = (
        db.query(Role)
        .filter(Role.name == "Administrator")
        .first()
    )

    department = (
        db.query(Department)
        .first()
    )

    if technician_role is None:
        raise Exception("Technician role not found")

    if admin_role is None:
        raise Exception("Administrator role not found")

    if department is None:
        raise Exception("No department found")

    # Create technician
    technician = (
        db.query(User)
        .filter(User.email == "technician@example.com")
        .first()
    )

    if technician is None:
        technician = User(
            employee_id="TECH001",
            first_name="John",
            last_name="Technician",
            email="technician@example.com",
            password_hash=hash_password(technician_password),
            role_id=technician_role.id,
            department_id=department.id,
            is_active=True,
        )

        db.add(technician)

    # Create administrator
    administrator = (
        db.query(User)
        .filter(User.email == "admin@example.com")
        .first()
    )

    if administrator is None:
        administrator = User(
            employee_id="ADMIN001",
            first_name="System",
            last_name="Administrator",
            email="admin@example.com",
            password_hash=hash_password(admin_password),
            role_id=admin_role.id,
            department_id=department.id,
            is_active=True,
        )

        db.add(administrator)

    db.commit()

    print("Test users created successfully.")

finally:
    db.close()
