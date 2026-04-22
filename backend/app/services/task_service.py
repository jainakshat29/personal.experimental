from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List

from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_for_user(
        self,
        user_id: str,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        project_id: Optional[str] = None,
    ) -> List[Task]:
        query = select(Task).where(Task.owner_id == user_id)
        if status:
            query = query.where(Task.status == status)
        if priority:
            query = query.where(Task.priority == priority)
        if project_id:
            query = query.where(Task.project_id == project_id)
        query = query.order_by(Task.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, task_id: str, user_id: str) -> Optional[Task]:
        result = await self.db.execute(
            select(Task).where(Task.id == task_id, Task.owner_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: TaskCreate, user_id: str) -> Task:
        task = Task(**data.model_dump(), owner_id=user_id)
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def update(self, task: Task, data: TaskUpdate) -> Task:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(task, field, value)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.commit()
