from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from app.core.recommender import recommender

router = APIRouter()

class RatingInput(BaseModel):
    movie_id: int
    rating: float = Field(..., ge=0.5, le=5.0)

class RatingOutput(BaseModel):
    movie_id: int
    rating: float

@router.post("/{user_id}/ratings", response_model=Dict[str, bool])
async def add_rating(user_id: str, rating_input: RatingInput):
    """Add or update a user's rating for a movie."""
    try:
        success = recommender.add_rating(
            user_id=user_id,
            movie_id=rating_input.movie_id,
            rating=rating_input.rating
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding rating: {str(e)}")

@router.get("/{user_id}/ratings", response_model=List[Dict[str, Any]])
async def get_user_ratings(user_id: str):
    """Get all ratings by a specific user."""
    try:
        return recommender.get_user_ratings(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user ratings: {str(e)}")