from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.models.task import TaskStatus, TaskPriority
from app.services.task_service import TaskService

router = APIRouter()


@router.get("/", response_model=List[TaskOut])
async def list_tasks(
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    project_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TaskService(db)
    return await svc.get_all_for_user(current_user.id, status, priority, project_id)


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TaskService(db)
    return await svc.create(data, current_user.id)


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TaskService(db)
    task = await svc.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    data: TaskUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TaskService(db)
    task = await svc.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await svc.update(task, data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TaskService(db)
    task = await svc.get_by_id(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await svc.delete(task)
