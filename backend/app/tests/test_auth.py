import pytest


async def register(client):
    res = await client.post("/api/auth/register", json={"email": "test@example.com", "username": "testuser", "password": "Password123!"})
    return res.json()


async def login(client):
    res = await client.post("/api/auth/login", json={"email": "test@example.com", "password": "Password123!"})
    return res.json()


async def get_headers(client):
    data = await register(client)
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/api/auth/register", json={"email": "new@example.com", "username": "newuser", "password": "SecurePass123!"})
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await register(client)
    response = await client.post("/api/auth/register", json={"email": "test@example.com", "username": "other", "password": "SecurePass123!"})
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_duplicate_username(client):
    await register(client)
    response = await client.post("/api/auth/register", json={"email": "other@example.com", "username": "testuser", "password": "SecurePass123!"})
    assert response.status_code == 400
    assert "Username already taken" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client):
    await register(client)
    response = await client.post("/api/auth/login", json={"email": "test@example.com", "password": "Password123!"})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await register(client)
    response = await client.post("/api/auth/login", json={"email": "test@example.com", "password": "WrongPassword!"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    response = await client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "Password123!"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client):
    headers = await get_headers(client)
    response = await client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 403
