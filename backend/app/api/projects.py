from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.services.project_service import ProjectService

router = APIRouter()


@router.get("/", response_model=List[ProjectOut])
async def list_projects(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ProjectService(db)
    projects = await svc.get_all_for_user(current_user.id)
    result = []
    for p in projects:
        out = ProjectOut.model_validate(p)
        out.task_count = await svc.get_task_count(p.id)
        result.append(out)
    return result


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ProjectService(db)
    project = await svc.create(data, current_user.id)
    out = ProjectOut.model_validate(project)
    out.task_count = 0
    return out


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ProjectService(db)
    project = await svc.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    out = ProjectOut.model_validate(project)
    out.task_count = await svc.get_task_count(project_id)
    return out


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ProjectService(db)
    project = await svc.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await svc.update(project, data)
    out = ProjectOut.model_validate(project)
    out.task_count = await svc.get_task_count(project_id)
    return out


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ProjectService(db)
    project = await svc.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await svc.delete(project)
