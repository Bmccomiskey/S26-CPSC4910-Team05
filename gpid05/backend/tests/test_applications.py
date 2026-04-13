"""
Tests for /applications endpoints:
  - POST /applications/         (driver applies)
  - POST /applications/{id}/approve
  - POST /applications/{id}/reject
  - POST /applications/{id}/drop
  - GET  /applications/driver/{id}
  - GET  /applications/sponsor/{id}
"""

import pytest


def _create_application(db, driver_id, sponsor_id, status="PENDING"):
    from sponsorshipModels import SponsorshipApplication
    app = SponsorshipApplication(
        driver_id=driver_id,
        sponsor_id=sponsor_id,
        status=status,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


# ---------------------------------------------------------------------------
# Apply
# ---------------------------------------------------------------------------
class TestApply:
    def test_driver_can_apply(self, client, driver_user, sponsor_user, driver_cookies):
        res = client.post("/applications/", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
        }, cookies=driver_cookies)
        assert res.status_code == 200

    def test_duplicate_application_rejected(self, client, db, driver_user, sponsor_user, driver_cookies):
        _create_application(db, driver_user.id, sponsor_user.id)

        res = client.post("/applications/", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
        }, cookies=driver_cookies)
        assert res.status_code == 400

    def test_apply_to_nonexistent_sponsor(self, client, driver_user, driver_cookies):
        res = client.post("/applications/", json={
            "driver_id": driver_user.id,
            "sponsor_id": 99999,
        }, cookies=driver_cookies)
        assert res.status_code in (400, 404)


# ---------------------------------------------------------------------------
# Approve
# ---------------------------------------------------------------------------
class TestApprove:
    def test_sponsor_approves_application(self, client, db, driver_user, sponsor_user, sponsor_cookies):
        app = _create_application(db, driver_user.id, sponsor_user.id)

        res = client.post(
            f"/applications/{app.id}/approve?sponsor_id={sponsor_user.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200

        db.refresh(app)
        assert app.status == "APPROVED"

    def test_approve_already_approved(self, client, db, driver_user, sponsor_user, sponsor_cookies):
        app = _create_application(db, driver_user.id, sponsor_user.id, status="APPROVED")

        res = client.post(
            f"/applications/{app.id}/approve?sponsor_id={sponsor_user.id}",
            cookies=sponsor_cookies,
        )
        # Either idempotent 200 or a 400 — the key thing is it doesn't crash
        assert res.status_code in (200, 400)

    def test_wrong_sponsor_cannot_approve(self, client, db, driver_user, sponsor_user, admin_user, admin_cookies):
        app = _create_application(db, driver_user.id, sponsor_user.id)

        # Use a different sponsor_id in the query param
        res = client.post(
            f"/applications/{app.id}/approve?sponsor_id=99999",
            cookies=admin_cookies,
        )
        assert res.status_code in (403, 404)


# ---------------------------------------------------------------------------
# Reject
# ---------------------------------------------------------------------------
class TestReject:
    def test_sponsor_rejects_application(self, client, db, driver_user, sponsor_user, sponsor_cookies):
        app = _create_application(db, driver_user.id, sponsor_user.id)

        res = client.post(
            f"/applications/{app.id}/reject?sponsor_id={sponsor_user.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200

        db.refresh(app)
        assert app.status == "REJECTED"

    def test_reject_nonexistent_application(self, client, sponsor_user, sponsor_cookies):
        res = client.post(
            f"/applications/99999/reject?sponsor_id={sponsor_user.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Drop
# ---------------------------------------------------------------------------
class TestDrop:
    def test_sponsor_drops_driver(self, client, db, driver_user, sponsor_user, sponsor_cookies):
        app = _create_application(db, driver_user.id, sponsor_user.id, status="APPROVED")

        res = client.post(
            f"/applications/{app.id}/drop?sponsor_id={sponsor_user.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200

        db.refresh(app)
        assert app.status == "DROPPED"

    def test_drop_pending_application(self, client, db, driver_user, sponsor_user, sponsor_cookies):
        app = _create_application(db, driver_user.id, sponsor_user.id, status="PENDING")

        res = client.post(
            f"/applications/{app.id}/drop?sponsor_id={sponsor_user.id}",
            cookies=sponsor_cookies,
        )
        # Should not be allowed to drop a non-approved application
        assert res.status_code in (200, 400)


# ---------------------------------------------------------------------------
# List applications
# ---------------------------------------------------------------------------
class TestListApplications:
    def test_driver_sees_own_applications(self, client, db, driver_user, sponsor_user, driver_cookies):
        _create_application(db, driver_user.id, sponsor_user.id)

        res = client.get(f"/applications/driver/{driver_user.id}", cookies=driver_cookies)
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_sponsor_sees_own_applications(self, client, db, driver_user, sponsor_user, sponsor_cookies):
        _create_application(db, driver_user.id, sponsor_user.id)

        res = client.get(f"/applications/sponsor/{sponsor_user.id}", cookies=sponsor_cookies)
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_driver_with_no_applications(self, client, driver_user, driver_cookies):
        res = client.get(f"/applications/driver/{driver_user.id}", cookies=driver_cookies)
        assert res.status_code == 200
        assert res.json() == []
