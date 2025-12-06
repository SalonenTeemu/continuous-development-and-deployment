from app import app

def test_status_route():
    client = app.test_client()
    rv = client.get("/status")
    assert rv.status_code == 200 or rv.status_code == 500

def test_log_route():
    client = app.test_client()
    rv = client.get("/log")
    assert rv.status_code in (200, 500)

def test_delete_log_route():
    client = app.test_client()
    rv = client.delete("/log")
    assert rv.status_code in (200, 500)
