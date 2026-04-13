"""
Tests for /catalog endpoints:
  - POST /catalog/{sponsor_id}/custom
  - GET  /catalog/sponsor/{sponsor_id}
  - POST /catalog/{sponsor_id}/remove/{item_id}
  - POST /catalog/{sponsor_id}/activate/{item_id}
  - POST /catalog/{sponsor_id}/config
"""

import pytest


def _create_catalog_item(db, sponsor_id, name="Widget", price=9.99, is_active=True):
    from catalogModels import CatalogItem
    item = CatalogItem(
        sponsor_id=sponsor_id,
        name=name,
        description="A test item",
        image_url="http://example.com/img.png",
        price_usd=price,
        point_cost=int(price * 100),
        is_active=is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# Add custom item
# ---------------------------------------------------------------------------
class TestAddCustomItem:
    def test_add_custom_item_success(self, client, sponsor_user, sponsor_cookies):
        res = client.post(f"/catalog/{sponsor_user.id}/custom", json={
            "sponsor_id": sponsor_user.id,
            "name": "My Product",
            "description": "A great product",
            "image_url": "http://example.com/img.png",
            "price_usd": 19.99,
        }, cookies=sponsor_cookies)
        assert res.status_code == 200

    def test_add_custom_item_missing_name(self, client, sponsor_user, sponsor_cookies):
        res = client.post(f"/catalog/{sponsor_user.id}/custom", json={
            "sponsor_id": sponsor_user.id,
            "description": "No name provided",
            "price_usd": 5.00,
        }, cookies=sponsor_cookies)
        assert res.status_code == 422

    def test_add_custom_item_appears_in_catalog(self, client, db, sponsor_user, sponsor_cookies):
        client.post(f"/catalog/{sponsor_user.id}/custom", json={
            "sponsor_id": sponsor_user.id,
            "name": "Findable Item",
            "price_usd": 10.00,
        }, cookies=sponsor_cookies)

        res = client.get(f"/catalog/sponsor/{sponsor_user.id}", cookies=sponsor_cookies)
        assert res.status_code == 200
        names = [i["name"] for i in res.json()["items"]]
        assert "Findable Item" in names


# ---------------------------------------------------------------------------
# Get catalog
# ---------------------------------------------------------------------------
class TestGetCatalog:
    def test_catalog_empty_initially(self, client, sponsor_user, sponsor_cookies):
        res = client.get(f"/catalog/sponsor/{sponsor_user.id}", cookies=sponsor_cookies)
        assert res.status_code == 200
        assert res.json()["items"] == []

    def test_catalog_only_returns_active_items(self, client, db, sponsor_user, sponsor_cookies):
        _create_catalog_item(db, sponsor_user.id, name="Active Item")
        _create_catalog_item(db, sponsor_user.id, name="Inactive Item", is_active=False)

        res = client.get(f"/catalog/sponsor/{sponsor_user.id}", cookies=sponsor_cookies)
        assert res.status_code == 200
        # Catalog endpoint filters to active items only
        assert len(res.json()["items"]) == 1
        assert res.json()["items"][0]["name"] == "Active Item"

    def test_catalog_search_filters_by_name(self, client, db, sponsor_user, sponsor_cookies):
        _create_catalog_item(db, sponsor_user.id, name="Red Widget")
        _create_catalog_item(db, sponsor_user.id, name="Blue Gadget")

        res = client.get(
            f"/catalog/sponsor/{sponsor_user.id}?search=Red",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200
        names = [i["name"] for i in res.json()["items"]]
        assert "Red Widget" in names
        assert "Blue Gadget" not in names


# ---------------------------------------------------------------------------
# Remove item
# ---------------------------------------------------------------------------
class TestRemoveItem:
    def test_remove_item_deactivates_it(self, client, db, sponsor_user, sponsor_cookies):
        item = _create_catalog_item(db, sponsor_user.id)

        res = client.post(
            f"/catalog/{sponsor_user.id}/remove/{item.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200

        db.refresh(item)
        assert item.is_active is False

    def test_remove_nonexistent_item_returns_error(self, client, sponsor_user, sponsor_cookies):
        res = client.post(
            f"/catalog/{sponsor_user.id}/remove/99999",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200
        assert res.json().get("status") == "ERROR"


# ---------------------------------------------------------------------------
# Activate item
# ---------------------------------------------------------------------------
class TestActivateItem:
    def test_activate_inactive_item(self, client, db, sponsor_user, sponsor_cookies):
        item = _create_catalog_item(db, sponsor_user.id, is_active=False)

        res = client.post(
            f"/catalog/{sponsor_user.id}/activate/{item.id}",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200

        db.refresh(item)
        assert item.is_active is True

    def test_activate_already_active_item(self, client, db, sponsor_user, sponsor_cookies):
        item = _create_catalog_item(db, sponsor_user.id, is_active=True)

        res = client.post(
            f"/catalog/{sponsor_user.id}/activate/{item.id}",
            cookies=sponsor_cookies,
        )
        # Should succeed idempotently
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
class TestCatalogConfig:
    def test_set_catalog_config(self, client, sponsor_user, sponsor_cookies):
        res = client.post(
            f"/catalog/{sponsor_user.id}/config"
            "?min_point_cost=100&max_point_cost=10000&points_per_dollar=100",
            cookies=sponsor_cookies,
        )
        assert res.status_code == 200

    def test_config_updates_persisted(self, client, db, sponsor_user, sponsor_cookies):
        client.post(
            f"/catalog/{sponsor_user.id}/config"
            "?min_point_cost=200&max_point_cost=5000&points_per_dollar=50",
            cookies=sponsor_cookies,
        )
        from catalog import CatalogConfig
        cfg = db.query(CatalogConfig).filter(CatalogConfig.sponsor_id == sponsor_user.id).first()
        assert cfg is not None
        assert cfg.min_point_cost == 200
        assert cfg.max_point_cost == 5000
