"""
Shared pytest fixtures for the backend test suite.

Uses an in-memory SQLite database so tests never touch the real MySQL instance.
The FastAPI app's get_db dependency is overridden for every request.
"""

import sys
import os
import pytest
from datetime import datetime

from sqlalchemy import create_engine, BigInteger
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles

# SQLite does not auto-increment BIGINT primary keys — compile as INTEGER instead
@compiles(BigInteger, "sqlite")
def _big_int_as_int(element, compiler, **kw):
    return "INTEGER"
from fastapi.testclient import TestClient

# Make sure the backend package root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import Base and ALL model modules so every table is registered before create_all
from db import Base, get_db
import userModels          # users
import sessionModels       # sessions
import resetTokenModels    # password_reset_tokens
import sponsorshipModels   # sponsorship_applications
import profileModels       # user_profiles
import auditModels         # audit_logs
import notificationHistory # notification_history
import scheduledNotifications  # scheduled_notifications
import sysModels           # Version_Info
import orgModels           # organizations
import redemptionModels    # catalog_redemptions
import catalogModels       # catalog_items
import points              # point_transactions, point_goals, personal_goals
import catalog             # catalog_config

from main import app
from security import hash_password
from sessions import create_session

# In-memory SQLite engine (shared across the whole test session)
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Create / drop tables once per test session
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Wipe all rows between tests so state doesn't leak
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def clean_db():
    yield
    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# TestClient
# ---------------------------------------------------------------------------
@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Helper: create a raw DB session for fixture setup
# ---------------------------------------------------------------------------
@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------
def _make_user(db, email, role, password="TestPass123!"):
    from userModels import User
    user = User(
        email=email,
        role=role,
        password_hash=hash_password(password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    return _make_user(db, "admin@test.com", "admin")


@pytest.fixture
def sponsor_user(db):
    return _make_user(db, "sponsor@test.com", "sponsor")


@pytest.fixture
def driver_user(db):
    return _make_user(db, "driver@test.com", "user")


# ---------------------------------------------------------------------------
# Session / cookie helpers
# ---------------------------------------------------------------------------
def _session_cookie(db, user):
    """Create a real session in the test DB and return the cookie dict."""
    token = create_session(db, user.id)
    return {"session_token": token}


@pytest.fixture
def admin_cookies(db, admin_user):
    return _session_cookie(db, admin_user)


@pytest.fixture
def sponsor_cookies(db, sponsor_user):
    return _session_cookie(db, sponsor_user)


@pytest.fixture
def driver_cookies(db, driver_user):
    return _session_cookie(db, driver_user)


# ---------------------------------------------------------------------------
# Approved sponsorship fixture
# ---------------------------------------------------------------------------
@pytest.fixture
def approved_sponsorship(db, sponsor_user, driver_user):
    from sponsorshipModels import SponsorshipApplication
    app_obj = SponsorshipApplication(
        driver_id=driver_user.id,
        sponsor_id=sponsor_user.id,
        status="APPROVED",
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj
