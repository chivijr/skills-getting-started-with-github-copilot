from fastapi.testclient import TestClient
from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # Expect activities to contain at least the sample "Chess Club"
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Basketball Team"
    email = "tester@example.com"

    # Ensure starting state: participant not present
    before = client.get("/activities").json()
    assert email not in before[activity]["participants"]

    # Sign up
    signup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert signup.status_code == 200
    assert "Signed up" in signup.json().get("message", "")

    # Verify participant added
    after_signup = client.get("/activities").json()
    assert email in after_signup[activity]["participants"]

    # Unregister
    unregister = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert unregister.status_code == 200
    assert "Unregistered" in unregister.json().get("message", "")

    # Verify participant removed
    after_unreg = client.get("/activities").json()
    assert email not in after_unreg[activity]["participants"]
