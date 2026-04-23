import pytest


async def setup(client):
    reg = await client.post("/api/auth/register", json={"email": "test@example.com", "username": "testuser", "password": "Password123!"})
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_task(client):
    headers = await setup(client)
    response = await client.post("/api/tasks/", json={"title": "Write unit tests", "description": "Cover all edge cases", "priority": "high"}, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Write unit tests"
    assert data["status"] == "todo"
    assert data["priority"] == "high"


@pytest.mark.asyncio
async def test_list_tasks_empty(client):
    headers = await setup(client)
    response = await client.get("/api/tasks/", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_tasks_with_filter(client):
    headers = await setup(client)
    await client.post("/api/tasks/", json={"title": "Task A", "status": "todo"}, headers=headers)
    await client.post("/api/tasks/", json={"title": "Task B", "status": "done"}, headers=headers)
    response = await client.get("/api/tasks/?status=todo", headers=headers)
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Task A"


@pytest.mark.asyncio
async def test_get_task(client):
    headers = await setup(client)
    create = await client.post("/api/tasks/", json={"title": "My Task"}, headers=headers)
    task_id = create.json()["id"]
    response = await client.get(f"/api/tasks/{task_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == task_id


@pytest.mark.asyncio
async def test_update_task_status(client):
    headers = await setup(client)
    create = await client.post("/api/tasks/", json={"title": "Update me"}, headers=headers)
    task_id = create.json()["id"]
    response = await client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_task(client):
    headers = await setup(client)
    create = await client.post("/api/tasks/", json={"title": "Delete me"}, headers=headers)
    task_id = create.json()["id"]
    response = await client.delete(f"/api/tasks/{task_id}", headers=headers)
    assert response.status_code == 204
    get = await client.get(f"/api/tasks/{task_id}", headers=headers)
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_task_isolation_between_users(client):
    headers = await setup(client)
    await client.post("/api/tasks/", json={"title": "User1 task"}, headers=headers)
    reg2 = await client.post("/api/auth/register", json={"email": "user2@example.com", "username": "user2", "password": "Pass123!"})
    headers2 = {"Authorization": f"Bearer {reg2.json()['access_token']}"}
    response = await client.get("/api/tasks/", headers=headers2)
    assert response.json() == []


@pytest.mark.asyncio
async def test_task_requires_auth(client):
    response = await client.get("/api/tasks/")
    assert response.status_code == 403
