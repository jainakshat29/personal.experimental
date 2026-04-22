from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenOut
from app.services.user_service import UserService

router = APIRouter()


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    svc = UserService(db)
    if await svc.get_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await svc.get_by_username(data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = await svc.create(data)
    token = create_access_token({"sub": user.id})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    svc = UserService(db)
    user = await svc.get_by_email(data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.id})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return current_user
