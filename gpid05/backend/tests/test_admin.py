"""
Tests for /admin endpoints:
  - GET    /admin/users
  - POST   /admin/users
  - DELETE /admin/users/{id}
  - POST   /admin/users/{id}/lock
  - POST   /admin/users/{id}/unlock
  - GET    /admin/users/{id}/profile
  - PUT    /admin/users/{id}/profile
  - POST   /admin/impersonate/start/{id}
  - POST   /admin/impersonate/stop
"""

import pytest


# ---------------------------------------------------------------------------
# List users
# ---------------------------------------------------------------------------
class TestListUsers:
    def test_admin_can_list_users(self, client, admin_user, driver_user, admin_cookies):
        res = client.get("/admin/users", cookies=admin_cookies)
        assert res.status_code == 200
        emails = [u["email"] for u in res.json()]
        assert "driver@test.com" in emails

    def test_non_admin_cannot_list_users(self, client, driver_cookies):
        res = client.get("/admin/users", cookies=driver_cookies)
        assert res.status_code == 403

    def test_unauthenticated_cannot_list_users(self, client):
        res = client.get("/admin/users")
        assert res.status_code == 401


# ---------------------------------------------------------------------------
# Create user
# ---------------------------------------------------------------------------
class TestCreateUser:
    def test_admin_creates_user(self, client, admin_cookies):
        res = client.post("/admin/users", json={
            "email": "newdriver@test.com",
            "password": "NewPass123!",
            "role": "user",
        }, cookies=admin_cookies)
        assert res.status_code == 200

    def test_create_duplicate_user(self, client, driver_user, admin_cookies):
        res = client.post("/admin/users", json={
            "email": "driver@test.com",
            "password": "NewPass123!",
            "role": "user",
        }, cookies=admin_cookies)
        assert res.status_code == 400

    def test_non_admin_cannot_create_user(self, client, sponsor_cookies):
        res = client.post("/admin/users", json={
            "email": "sneaky@test.com",
            "password": "NewPass123!",
            "role": "user",
        }, cookies=sponsor_cookies)
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Lock / Unlock
# ---------------------------------------------------------------------------
class TestLockUnlock:
    def test_admin_locks_user(self, client, db, driver_user, admin_cookies):
        res = client.post(f"/admin/users/{driver_user.id}/lock", cookies=admin_cookies)
        assert res.status_code == 200

        db.refresh(driver_user)
        assert driver_user.is_active is False

    def test_admin_unlocks_user(self, client, db, driver_user, admin_cookies):
        driver_user.is_active = False
        db.commit()

        res = client.post(f"/admin/users/{driver_user.id}/unlock", cookies=admin_cookies)
        assert res.status_code == 200

        db.refresh(driver_user)
        assert driver_user.is_active is True

    def test_lock_nonexistent_user(self, client, admin_cookies):
        res = client.post("/admin/users/99999/lock", cookies=admin_cookies)
        assert res.status_code == 404

    def test_non_admin_cannot_lock(self, client, driver_user, sponsor_cookies):
        res = client.post(f"/admin/users/{driver_user.id}/lock", cookies=sponsor_cookies)
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Delete user
# ---------------------------------------------------------------------------
class TestDeleteUser:
    def test_admin_deletes_user(self, client, db, driver_user, admin_cookies):
        user_id = driver_user.id
        res = client.delete(f"/admin/users/{user_id}", cookies=admin_cookies)
        assert res.status_code == 200

        from userModels import User
        assert db.query(User).filter(User.id == user_id).first() is None

    def test_delete_nonexistent_user(self, client, admin_cookies):
        res = client.delete("/admin/users/99999", cookies=admin_cookies)
        assert res.status_code == 404

    def test_non_admin_cannot_delete(self, client, driver_user, sponsor_cookies):
        res = client.delete(f"/admin/users/{driver_user.id}", cookies=sponsor_cookies)
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Profile management
# ---------------------------------------------------------------------------
class TestUserProfile:
    def test_admin_gets_driver_profile(self, client, driver_user, admin_cookies):
        res = client.get(f"/admin/users/{driver_user.id}/profile", cookies=admin_cookies)
        assert res.status_code == 200
        assert "user" in res.json()
        assert res.json()["user"]["email"] == "driver@test.com"

    def test_admin_updates_driver_profile(self, client, driver_user, admin_cookies):
        res = client.put(f"/admin/users/{driver_user.id}/profile", json={
            "first_name": "John",
            "last_name": "Doe",
            "phone": "555-1234",
        }, cookies=admin_cookies)
        assert res.status_code == 200

    def test_admin_updates_sponsor_profile(self, client, sponsor_user, admin_cookies):
        res = client.put(f"/admin/users/{sponsor_user.id}/profile", json={
            "company_name": "ACME Corp",
            "contact_name": "Jane Smith",
        }, cookies=admin_cookies)
        assert res.status_code == 200

    def test_get_profile_nonexistent_user(self, client, admin_cookies):
        res = client.get("/admin/users/99999/profile", cookies=admin_cookies)
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Impersonation
# ---------------------------------------------------------------------------
class TestImpersonation:
    def test_admin_can_impersonate_driver(self, client, driver_user, admin_cookies):
        res = client.post(
            f"/admin/impersonate/start/{driver_user.id}",
            cookies=admin_cookies,
        )
        assert res.status_code == 200
        assert res.json()["user"]["email"] == "driver@test.com"

    def test_admin_cannot_impersonate_admin(self, client, admin_user, admin_cookies):
        res = client.post(
            f"/admin/impersonate/start/{admin_user.id}",
            cookies=admin_cookies,
        )
        assert res.status_code in (400, 403)

    def test_stop_impersonation(self, client, driver_user, admin_cookies):
        # Start
        client.post(f"/admin/impersonate/start/{driver_user.id}", cookies=admin_cookies)

        # Stop
        res = client.post("/admin/impersonate/stop", cookies=admin_cookies)
        assert res.status_code == 200

    def test_non_admin_cannot_impersonate(self, client, driver_user, sponsor_cookies):
        res = client.post(
            f"/admin/impersonate/start/{driver_user.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 403
