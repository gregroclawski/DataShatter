from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from datetime import datetime, timezone, timedelta
import uuid
import secrets
from motor.motor_asyncio import AsyncIOMotorDatabase
from .auth import (
    UserCreate, UserLogin, User, Token, SessionData,
    validate_password, verify_password, get_password_hash,
    create_access_token, get_current_user, get_user_by_email,
    get_user_by_id, create_user, create_session, get_session, delete_session,
    process_emergent_session
)

def create_auth_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/auth", tags=["authentication"])

    @router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
    async def register(user_data: UserCreate, response: Response):
        """Register a new user with email and password"""
        try:
            # Check if password meets requirements
            if not validate_password(user_data.password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password must be between 8 and 64 characters"
                )

            # Check if user already exists
            existing_user = await get_user_by_email(db, user_data.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )

            # Create new user
            user_dict = {
                "id": str(uuid.uuid4()),
                "email": user_data.email,
                "name": user_data.name,
                "password_hash": get_password_hash(user_data.password),
                "provider": "email"
            }

            created_user = await create_user(db, user_dict)
            
            # Generate tokens
            access_token = create_access_token(data={"sub": created_user["id"]})
            session_token = secrets.token_urlsafe(32)
            
            # Create session
            await create_session(db, created_user["id"], session_token)
            
            # Set session cookie
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7 * 24 * 60 * 60,  # 7 days
                path="/"
            )

            # Return user data (exclude password_hash)
            user_response = User(
                id=created_user["id"],
                email=created_user["email"],
                name=created_user["name"],
                created_at=created_user["created_at"],
                is_active=created_user["is_active"],
                provider=created_user["provider"]
            )

            return Token(access_token=access_token, user=user_response)

        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {str(e)}"
            )

    @router.post("/login", response_model=Token)
    async def login(form_data: OAuth2PasswordRequestForm = Depends(), response: Response = None):
        """Login with email and password"""
        try:
            # Find user
            user = await get_user_by_email(db, form_data.username)  # OAuth2 uses 'username' field
            if not user or not verify_password(form_data.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Check if user is active
            if not user.get("is_active", True):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is disabled"
                )

            # Generate tokens
            access_token = create_access_token(data={"sub": user["id"]})
            session_token = secrets.token_urlsafe(32)
            
            # Create session
            await create_session(db, user["id"], session_token)
            
            # Set session cookie
            if response:
                response.set_cookie(
                    key="session_token",
                    value=session_token,
                    httponly=True,
                    secure=True,
                    samesite="none",
                    max_age=7 * 24 * 60 * 60,  # 7 days
                    path="/"
                )

            # Return user data (exclude password_hash)
            user_response = User(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                created_at=user["created_at"],
                is_active=user.get("is_active", True),
                provider=user.get("provider", "email")
            )

            return Token(access_token=access_token, user=user_response)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login failed: {str(e)}"
            )

    @router.post("/oauth/google")
    async def google_oauth_login(request: Request, response: Response):
        """Process Google OAuth login via Emergent Auth"""
        try:
            body = await request.json()
            session_id = body.get("session_id")
            
            if not session_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session ID is required"
                )

            # Process session with Emergent Auth
            session_data = await process_emergent_session(session_id)
            if not session_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid session ID"
                )

            # Check if user exists
            existing_user = await get_user_by_email(db, session_data.email)
            
            if existing_user:
                # Update existing user if needed
                user = existing_user
            else:
                # Create new user from OAuth data
                user_dict = {
                    "id": str(uuid.uuid4()),
                    "email": session_data.email,
                    "name": session_data.name,
                    "provider": "google",
                    "oauth_id": session_data.id,
                    "picture": session_data.picture
                }
                user = await create_user(db, user_dict)

            # Generate tokens
            access_token = create_access_token(data={"sub": user["id"]})
            
            # Create session with the provided session_token from Emergent
            await create_session(db, user["id"], session_data.session_token)
            
            # Set session cookie
            response.set_cookie(
                key="session_token",
                value=session_data.session_token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7 * 24 * 60 * 60,  # 7 days
                path="/"
            )

            # Return user data
            user_response = User(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                created_at=user["created_at"],
                is_active=user.get("is_active", True),
                provider=user.get("provider", "google")
            )

            return Token(access_token=access_token, user=user_response)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OAuth login failed: {str(e)}"
            )

    @router.get("/me", response_model=User)
    async def get_current_user_profile(current_user: dict = Depends(lambda: get_current_user)):
        """Get current user profile"""
        return User(
            id=current_user["id"],
            email=current_user["email"],
            name=current_user["name"],
            created_at=current_user["created_at"],
            is_active=current_user.get("is_active", True),
            provider=current_user.get("provider", "email")
        )

    @router.post("/logout")
    async def logout(
        request: Request, 
        response: Response,
        current_user: dict = Depends(lambda: get_current_user)
    ):
        """Logout user and clear session"""
        try:
            # Get session token from cookie
            session_token = request.cookies.get("session_token")
            if session_token:
                await delete_session(db, session_token)
            
            # Clear session cookie
            response.delete_cookie(
                key="session_token",
                path="/",
                secure=True,
                samesite="none"
            )
            
            return {"message": "Successfully logged out"}
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Logout failed: {str(e)}"
            )

    @router.get("/session/check")
    async def check_session(request: Request):
        """Check if current session is valid"""
        try:
            session_token = request.cookies.get("session_token")
            if not session_token:
                return {"authenticated": False}
                
            session = await get_session(db, session_token)
            if not session:
                return {"authenticated": False}
                
            user = await get_user_by_id(db, session["user_id"])
            if not user:
                return {"authenticated": False}
                
            user_response = User(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                created_at=user["created_at"],
                is_active=user.get("is_active", True),
                provider=user.get("provider", "email")
            )
            
            return {
                "authenticated": True,
                "user": user_response
            }
            
        except Exception as e:
            return {"authenticated": False, "error": str(e)}

    return router