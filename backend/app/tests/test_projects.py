import pytest


async def setup(client):
    reg = await client.post("/api/auth/register", json={"email": "test@example.com", "username": "testuser", "password": "Password123!"})
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_project(client):
    headers = await setup(client)
    response = await client.post("/api/projects/", json={"name": "My Project", "description": "A test project", "color": "#e11d48"}, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Project"
    assert data["color"] == "#e11d48"
    assert data["task_count"] == 0


@pytest.mark.asyncio
async def test_list_projects(client):
    headers = await setup(client)
    await client.post("/api/projects/", json={"name": "Project A"}, headers=headers)
    await client.post("/api/projects/", json={"name": "Project B"}, headers=headers)
    response = await client.get("/api/projects/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_project_task_count(client):
    headers = await setup(client)
    proj = await client.post("/api/projects/", json={"name": "Counted"}, headers=headers)
    project_id = proj.json()["id"]
    await client.post("/api/tasks/", json={"title": "T1", "project_id": project_id}, headers=headers)
    await client.post("/api/tasks/", json={"title": "T2", "project_id": project_id}, headers=headers)
    response = await client.get(f"/api/projects/{project_id}", headers=headers)
    assert response.json()["task_count"] == 2


@pytest.mark.asyncio
async def test_update_project(client):
    headers = await setup(client)
    proj = await client.post("/api/projects/", json={"name": "Old Name"}, headers=headers)
    project_id = proj.json()["id"]
    response = await client.patch(f"/api/projects/{project_id}", json={"name": "New Name"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_project_cascades_tasks(client):
    headers = await setup(client)
    proj = await client.post("/api/projects/", json={"name": "To Delete"}, headers=headers)
    project_id = proj.json()["id"]
    task = await client.post("/api/tasks/", json={"title": "Task in project", "project_id": project_id}, headers=headers)
    task_id = task.json()["id"]
    await client.delete(f"/api/projects/{project_id}", headers=headers)
    task_check = await client.get(f"/api/tasks/{task_id}", headers=headers)
    assert task_check.status_code == 404


@pytest.mark.asyncio
async def test_project_not_found(client):
    headers = await setup(client)
    response = await client.get("/api/projects/nonexistent-id", headers=headers)
    assert response.status_code == 404
