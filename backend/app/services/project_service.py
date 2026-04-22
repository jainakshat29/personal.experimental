from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from app.models.project import Project
from app.models.task import Task
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_for_user(self, user_id: str) -> List[Project]:
        result = await self.db.execute(
            select(Project).where(Project.owner_id == user_id).order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, project_id: str, user_id: str) -> Optional[Project]:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: ProjectCreate, user_id: str) -> Project:
        project = Project(**data.model_dump(), owner_id=user_id)
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def update(self, project: Project, data: ProjectUpdate) -> Project:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(project, field, value)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.commit()

    async def get_task_count(self, project_id: str) -> int:
        result = await self.db.execute(
            select(func.count()).where(Task.project_id == project_id)
        )
        return result.scalar() or 0
