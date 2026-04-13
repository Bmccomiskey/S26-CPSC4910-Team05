"""
Tests for /points endpoints:
  - POST /points/award
  - GET  /points/driver/{id}/balance
  - GET  /points/driver/{id}/history
  - POST /points/redeem
  - POST /points/cancel/{transaction_id}
  - POST /points/goals  (sponsor goals)
  - POST /points/goals/personal  (driver personal goals)
"""

import pytest
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _add_transaction(db, driver_id, sponsor_id, points, description="Test"):
    from points import PointTransaction
    txn = PointTransaction(
        driver_id=driver_id,
        sponsor_id=sponsor_id,
        points=points,
        description=description,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


# ---------------------------------------------------------------------------
# Balance
# ---------------------------------------------------------------------------
class TestBalance:
    def test_balance_zero_with_no_transactions(self, client, driver_user, driver_cookies):
        res = client.get(f"/points/driver/{driver_user.id}/balance", cookies=driver_cookies)
        assert res.status_code == 200
        assert res.json()["balance"] == 0

    def test_balance_reflects_positive_transactions(self, client, db, driver_user, sponsor_user, driver_cookies):
        _add_transaction(db, driver_user.id, sponsor_user.id, 500)
        _add_transaction(db, driver_user.id, sponsor_user.id, 300)

        res = client.get(f"/points/driver/{driver_user.id}/balance", cookies=driver_cookies)
        assert res.status_code == 200
        assert res.json()["balance"] == 800

    def test_balance_reflects_redemption(self, client, db, driver_user, sponsor_user, driver_cookies):
        _add_transaction(db, driver_user.id, sponsor_user.id, 1000)
        _add_transaction(db, driver_user.id, sponsor_user.id, -400, "Redeemed: Widget")

        res = client.get(f"/points/driver/{driver_user.id}/balance", cookies=driver_cookies)
        assert res.status_code == 200
        assert res.json()["balance"] == 600


# ---------------------------------------------------------------------------
# Transaction history
# ---------------------------------------------------------------------------
class TestTransactionHistory:
    def test_history_returns_all_transactions(self, client, db, driver_user, sponsor_user, driver_cookies):
        _add_transaction(db, driver_user.id, sponsor_user.id, 100, "Bonus")
        _add_transaction(db, driver_user.id, sponsor_user.id, 200, "Award")

        res = client.get(f"/points/driver/{driver_user.id}/history", cookies=driver_cookies)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_history_empty_for_new_driver(self, client, driver_user, driver_cookies):
        res = client.get(f"/points/driver/{driver_user.id}/history", cookies=driver_cookies)
        assert res.status_code == 200
        assert res.json() == []


# ---------------------------------------------------------------------------
# Award points
# ---------------------------------------------------------------------------
class TestAwardPoints:
    def test_award_points_success(self, client, db, driver_user, sponsor_user, sponsor_cookies, approved_sponsorship):
        res = client.post("/points/award", json={
            "sponsor_id": sponsor_user.id,
            "driver_id": driver_user.id,
            "points": 500,
            "description": "Great job",
        }, cookies=sponsor_cookies)
        assert res.status_code == 200

        # Balance should reflect the award
        from points import PointTransaction
        total = db.query(PointTransaction).filter(
            PointTransaction.driver_id == driver_user.id
        ).all()
        assert sum(t.points for t in total) == 500

    def test_award_points_not_approved_sponsorship(self, client, driver_user, sponsor_user, sponsor_cookies):
        res = client.post("/points/award", json={
            "sponsor_id": sponsor_user.id,
            "driver_id": driver_user.id,
            "points": 500,
            "description": "Award",
        }, cookies=sponsor_cookies)
        assert res.status_code in (403, 404)

    def test_award_zero_points_rejected(self, client, db, driver_user, sponsor_user, sponsor_cookies, approved_sponsorship):
        res = client.post("/points/award", json={
            "sponsor_id": sponsor_user.id,
            "driver_id": driver_user.id,
            "points": 0,
            "description": "Nothing",
        }, cookies=sponsor_cookies)
        assert res.status_code == 400


# ---------------------------------------------------------------------------
# Redeem item
# ---------------------------------------------------------------------------
class TestRedeemItem:
    def test_redeem_success(self, client, db, driver_user, sponsor_user, driver_cookies, approved_sponsorship):
        _add_transaction(db, driver_user.id, sponsor_user.id, 1000)

        res = client.post("/points/redeem", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
            "item_id": 1,
            "item_name": "Test Widget",
            "point_cost": 400,
        }, cookies=driver_cookies)
        assert res.status_code == 200

    def test_redeem_insufficient_points(self, client, db, driver_user, sponsor_user, driver_cookies, approved_sponsorship):
        _add_transaction(db, driver_user.id, sponsor_user.id, 100)

        res = client.post("/points/redeem", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
            "item_id": 1,
            "item_name": "Expensive Item",
            "point_cost": 9999,
        }, cookies=driver_cookies)
        assert res.status_code == 400
        assert "insufficient" in res.json()["detail"].lower()

    def test_redeem_without_sponsorship(self, client, db, driver_user, sponsor_user, driver_cookies):
        _add_transaction(db, driver_user.id, sponsor_user.id, 1000)

        res = client.post("/points/redeem", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
            "item_id": 1,
            "item_name": "Widget",
            "point_cost": 200,
        }, cookies=driver_cookies)
        assert res.status_code == 403

    def test_redeem_creates_negative_transaction(self, client, db, driver_user, sponsor_user, driver_cookies, approved_sponsorship):
        _add_transaction(db, driver_user.id, sponsor_user.id, 1000)

        client.post("/points/redeem", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
            "item_id": 1,
            "item_name": "Gadget",
            "point_cost": 300,
        }, cookies=driver_cookies)

        from points import PointTransaction
        txns = db.query(PointTransaction).filter(
            PointTransaction.driver_id == driver_user.id
        ).all()
        assert sum(t.points for t in txns) == 700


# ---------------------------------------------------------------------------
# Cancel redemption
# ---------------------------------------------------------------------------
class TestCancelRedemption:
    def test_cancel_within_window(self, client, db, driver_user, sponsor_user, driver_cookies, approved_sponsorship):
        _add_transaction(db, driver_user.id, sponsor_user.id, 1000)

        # Redeem
        client.post("/points/redeem", json={
            "driver_id": driver_user.id,
            "sponsor_id": sponsor_user.id,
            "item_id": 1,
            "item_name": "Gadget",
            "point_cost": 300,
        }, cookies=driver_cookies)

        from points import PointTransaction
        txn = db.query(PointTransaction).filter(
            PointTransaction.description == "Redeemed: Gadget"
        ).first()
        assert txn is not None

        res = client.post(f"/points/cancel/{txn.id}", json={
            "driver_id": driver_user.id,
        }, cookies=driver_cookies)
        assert res.status_code == 200

        # Original transaction should now be "Cancelled: Gadget"
        db.refresh(txn)
        assert txn.description.startswith("Cancelled:")

    def test_cancel_after_window_expired(self, client, db, driver_user, sponsor_user, driver_cookies):
        # Create a redemption transaction with a timestamp > 10 min ago
        from points import PointTransaction
        old_time = datetime.utcnow() - timedelta(minutes=11)
        txn = PointTransaction(
            driver_id=driver_user.id,
            sponsor_id=sponsor_user.id,
            points=-300,
            description="Redeemed: Old Gadget",
            created_at=old_time,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        res = client.post(f"/points/cancel/{txn.id}", json={
            "driver_id": driver_user.id,
        }, cookies=driver_cookies)
        assert res.status_code == 400
        assert "expired" in res.json()["detail"].lower()

    def test_cancel_wrong_driver(self, client, db, driver_user, sponsor_user, driver_cookies):
        txn = _add_transaction(db, driver_user.id, sponsor_user.id, -300, "Redeemed: Widget")

        # Try to cancel using a different (non-existent) driver_id
        res = client.post(f"/points/cancel/{txn.id}", json={
            "driver_id": 99999,
        }, cookies=driver_cookies)
        assert res.status_code == 404

    def test_cancel_non_redemption_transaction(self, client, db, driver_user, sponsor_user, driver_cookies):
        txn = _add_transaction(db, driver_user.id, sponsor_user.id, 500, "Points awarded")

        res = client.post(f"/points/cancel/{txn.id}", json={
            "driver_id": driver_user.id,
        }, cookies=driver_cookies)
        assert res.status_code == 400


# ---------------------------------------------------------------------------
# Sponsor goals
# ---------------------------------------------------------------------------
class TestSponsorGoals:
    def test_create_goal(self, client, sponsor_user, driver_user, sponsor_cookies, approved_sponsorship):
        res = client.post("/points/goals", json={
            "sponsor_id": sponsor_user.id,
            "driver_id": driver_user.id,
            "title": "Reach Gold",
            "description": "Earn 1000 points",
            "target_points": 1000,
        }, cookies=sponsor_cookies)
        assert res.status_code == 200

    def test_get_driver_goals(self, client, sponsor_user, driver_user, driver_cookies, approved_sponsorship):
        # Create via sponsor, then read via driver
        from points import PointGoal
        from tests.conftest import TestingSessionLocal
        db2 = TestingSessionLocal()
        goal = PointGoal(
            sponsor_id=sponsor_user.id,
            driver_id=driver_user.id,
            title="Bronze",
            target_points=500,
        )
        db2.add(goal)
        db2.commit()
        db2.close()

        res = client.get(f"/points/goals/driver/{driver_user.id}", cookies=driver_cookies)
        assert res.status_code == 200
        assert len(res.json()) >= 1


# ---------------------------------------------------------------------------
# Personal goals
# ---------------------------------------------------------------------------
class TestPersonalGoals:
    def test_create_personal_goal(self, client, driver_user, driver_cookies):
        res = client.post("/points/goals/personal", json={
            "driver_id": driver_user.id,
            "title": "My Goal",
            "description": "Save up",
            "target_points": 2000,
        }, cookies=driver_cookies)
        assert res.status_code == 200

    def test_delete_personal_goal(self, client, db, driver_user, driver_cookies):
        from points import PersonalGoal
        goal = PersonalGoal(
            driver_id=driver_user.id,
            title="To Delete",
            target_points=100,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)

        res = client.delete(
            f"/points/goals/personal/{goal.id}?driver_id={driver_user.id}",
            cookies=driver_cookies,
        )
        assert res.status_code == 200
