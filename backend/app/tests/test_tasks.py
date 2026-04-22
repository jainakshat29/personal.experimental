import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers):
    response = await client.post("/api/tasks/", json={
        "title": "Write unit tests",
        "description": "Cover all edge cases",
        "priority": "high",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Write unit tests"
    assert data["status"] == "todo"
    assert data["priority"] == "high"


@pytest.mark.asyncio
async def test_list_tasks_empty(client: AsyncClient, auth_headers):
    response = await client.get("/api/tasks/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_tasks_with_filter(client: AsyncClient, auth_headers):
    # Create two tasks with different statuses
    await client.post("/api/tasks/", json={"title": "Task A", "status": "todo"}, headers=auth_headers)
    await client.post("/api/tasks/", json={"title": "Task B", "status": "done"}, headers=auth_headers)

    response = await client.get("/api/tasks/?status=todo", headers=auth_headers)
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Task A"


@pytest.mark.asyncio
async def test_get_task(client: AsyncClient, auth_headers):
    create = await client.post("/api/tasks/", json={"title": "My Task"}, headers=auth_headers)
    task_id = create.json()["id"]

    response = await client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == task_id


@pytest.mark.asyncio
async def test_update_task_status(client: AsyncClient, auth_headers):
    create = await client.post("/api/tasks/", json={"title": "Update me"}, headers=auth_headers)
    task_id = create.json()["id"]

    response = await client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, auth_headers):
    create = await client.post("/api/tasks/", json={"title": "Delete me"}, headers=auth_headers)
    task_id = create.json()["id"]

    response = await client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204

    get = await client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_task_isolation_between_users(client: AsyncClient, auth_headers):
    # Create task with user 1
    await client.post("/api/tasks/", json={"title": "User1 task"}, headers=auth_headers)

    # Register user 2 and get their token
    reg = await client.post("/api/auth/register", json={
        "email": "user2@example.com", "username": "user2", "password": "Pass123!"
    })
    user2_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # User 2 should see no tasks
    response = await client.get("/api/tasks/", headers=user2_headers)
    assert response.json() == []


@pytest.mark.asyncio
async def test_task_requires_auth(client: AsyncClient):
    response = await client.get("/api/tasks/")
    assert response.status_code == 403
