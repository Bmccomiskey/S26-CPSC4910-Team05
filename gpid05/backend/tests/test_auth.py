"""
Tests for /auth endpoints:
  - POST /auth/register
  - POST /auth/login
  - POST /auth/logout
  - GET  /auth/me
  - POST /auth/forgot-password
  - POST /auth/reset-password
  - Account lockout after 5 failed logins
"""

import pytest
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------
class TestRegister:
    def test_register_success(self, client):
        res = client.post("/auth/register", json={
            "email": "newuser@test.com",
            "password": "StrongPass123!",
            "role": "user",
        })
        assert res.status_code == 200
        assert "registered" in res.json()["message"].lower()

    def test_register_duplicate_email(self, client, driver_user):
        res = client.post("/auth/register", json={
            "email": "driver@test.com",
            "password": "StrongPass123!",
            "role": "user",
        })
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_register_weak_password(self, client):
        res = client.post("/auth/register", json={
            "email": "weak@test.com",
            "password": "weak",
            "role": "user",
        })
        assert res.status_code == 400

    def test_register_invalid_role(self, client):
        res = client.post("/auth/register", json={
            "email": "bad@test.com",
            "password": "StrongPass123!",
            "role": "superuser",
        })
        assert res.status_code == 400

    def test_register_missing_fields(self, client):
        res = client.post("/auth/register", json={"email": "x@test.com"})
        assert res.status_code == 422  # Pydantic validation


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class TestLogin:
    def test_login_success(self, client, driver_user):
        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 200
        assert "session_token" in res.cookies

    def test_login_wrong_password(self, client, driver_user):
        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "WrongPassword1!",
        })
        assert res.status_code == 401

    def test_login_unknown_email(self, client):
        res = client.post("/auth/login", json={
            "email": "nobody@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 401

    def test_login_inactive_user(self, client, db, driver_user):
        driver_user.is_active = False
        db.commit()

        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 401

    def test_login_sets_session_cookie(self, client, driver_user):
        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 200
        assert res.cookies.get("session_token") is not None


# ---------------------------------------------------------------------------
# Account lockout
# ---------------------------------------------------------------------------
class TestAccountLockout:
    def test_lockout_after_five_failures(self, client, driver_user):
        for _ in range(5):
            client.post("/auth/login", json={
                "email": "driver@test.com",
                "password": "WrongPassword1!",
            })

        # 6th attempt should be rejected as locked
        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 403
        assert "locked" in res.json()["detail"].lower()

    def test_correct_login_before_lockout_resets_count(self, client, db, driver_user):
        # 4 failures
        for _ in range(4):
            client.post("/auth/login", json={
                "email": "driver@test.com",
                "password": "WrongPassword1!",
            })
        # Correct login — should succeed and not lock
        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 200

    def test_locked_account_cannot_login(self, client, db, driver_user):
        driver_user.locked_until = datetime.utcnow() + timedelta(minutes=5)
        db.commit()

        res = client.post("/auth/login", json={
            "email": "driver@test.com",
            "password": "TestPass123!",
        })
        assert res.status_code == 403
        assert "locked" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------
class TestLogout:
    def test_logout_clears_session(self, client, driver_cookies):
        res = client.post("/auth/logout", cookies=driver_cookies)
        assert res.status_code == 200

    def test_logout_without_session(self, client):
        res = client.post("/auth/logout")
        # Should not crash — graceful handling
        assert res.status_code in (200, 401)


# ---------------------------------------------------------------------------
# /auth/me
# ---------------------------------------------------------------------------
class TestMe:
    def test_me_returns_current_user(self, client, driver_user, driver_cookies):
        res = client.get("/auth/me", cookies=driver_cookies)
        assert res.status_code == 200
        assert res.json()["email"] == "driver@test.com"

    def test_me_without_session(self, client):
        res = client.get("/auth/me")
        assert res.status_code == 401


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------
class TestPasswordReset:
    def test_forgot_password_known_email(self, client, driver_user):
        # Should succeed silently even though SMTP isn't configured
        res = client.post("/auth/forgot-password", json={"email": "driver@test.com"})
        assert res.status_code == 200

    def test_forgot_password_unknown_email(self, client):
        res = client.post("/auth/forgot-password", json={"email": "nobody@test.com"})
        # Should return 200 to avoid email enumeration
        assert res.status_code == 200

    def test_reset_password_with_valid_token(self, client, db, driver_user):
        from resetTokenModels import PasswordResetToken
        import secrets

        token = secrets.token_hex(32)
        record = PasswordResetToken(
            user_id=driver_user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=30),
            used=False,
        )
        db.add(record)
        db.commit()

        res = client.post("/auth/reset-password", json={
            "token": token,
            "new_password": "NewStrongPass1!",
        })
        assert res.status_code == 200

    def test_reset_password_expired_token(self, client, db, driver_user):
        from resetTokenModels import PasswordResetToken
        import secrets

        token = secrets.token_hex(32)
        record = PasswordResetToken(
            user_id=driver_user.id,
            token=token,
            expires_at=datetime.utcnow() - timedelta(minutes=1),  # already expired
            used=False,
        )
        db.add(record)
        db.commit()

        res = client.post("/auth/reset-password", json={
            "token": token,
            "new_password": "NewStrongPass1!",
        })
        assert res.status_code == 400

    def test_reset_password_invalid_token(self, client):
        res = client.post("/auth/reset-password", json={
            "token": "notarealtoken",
            "new_password": "NewStrongPass1!",
        })
        assert res.status_code == 400

    def test_reset_password_weak_new_password(self, client, db, driver_user):
        from resetTokenModels import PasswordResetToken
        import secrets

        token = secrets.token_hex(32)
        record = PasswordResetToken(
            user_id=driver_user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(minutes=30),
            used=False,
        )
        db.add(record)
        db.commit()

        res = client.post("/auth/reset-password", json={
            "token": token,
            "new_password": "weak",
        })
        assert res.status_code == 400
