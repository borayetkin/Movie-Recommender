from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional

from app.core.tmdb import tmdb_client
from app.core.recommender import recommender

router = APIRouter()

@router.get("/popular", response_model=List[Dict[str, Any]])
async def get_popular_movies(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=50)):
    """Get popular movies from TMDB."""
    try:
        # Get more movies if requested, but cap at 50 per page
        limit = min(per_page, 50)
        fetch_pages = (limit + 19) // 20  # Calculate how many TMDB pages to fetch
        
        all_movies = []
        base_page = ((page - 1) * limit) // 20 + 1  # Calculate TMDB starting page
        
        # Fetch multiple pages if needed to get the requested number of movies
        for i in range(fetch_pages):
            current_page = base_page + i
            movies = await tmdb_client.get_popular_movies(current_page)
            all_movies.extend(movies)
            
            # If we've got enough movies, stop fetching
            if len(all_movies) >= limit:
                break
        
        # Calculate start and end indices for this page
        start_idx = ((page - 1) * limit) % 20
        end_idx = start_idx + limit
        
        # Return the requested slice of movies
        return all_movies[start_idx:end_idx]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching popular movies: {str(e)}")

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_movies(query: str, page: int = Query(1, ge=1)):
    """Search for movies by title."""
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    
    try:
        movies = await tmdb_client.search_movies(query, page)
        # Sort movies by popularity (vote_average) in descending order
        movies.sort(key=lambda x: x.get('vote_average', 0), reverse=True)
        return movies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching movies: {str(e)}")

@router.get("/{movie_id}", response_model=Dict[str, Any])
async def get_movie_details(movie_id: int):
    """Get detailed information about a movie."""
    try:
        return await tmdb_client.get_movie_details(movie_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching movie details: {str(e)}")

@router.get("/{movie_id}/recommendations", response_model=List[Dict[str, Any]])
async def get_tmdb_recommendations(movie_id: int):
    """Get TMDB recommendations for a movie."""
    try:
        return await tmdb_client.get_movie_recommendations(movie_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")

@router.get("/{movie_id}/credits", response_model=Dict[str, Any])
async def get_movie_credits_route(movie_id: int):
    """Get movie credits (cast & crew) from TMDB."""
    try:
        return await tmdb_client.get_movie_credits(movie_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching movie credits: {str(e)}")

@router.get("/recommendations/{user_id}", response_model=List[Dict[str, Any]])
async def get_user_recommendations(user_id: str):
    """Get personalized movie recommendations for a user."""
    # Get recommended movie IDs
    movie_ids = recommender.get_recommendations(user_id)
    
    if not movie_ids:
        return []
    
    # Fetch movie details for each recommended movie
    recommendations = []
    for movie_id in movie_ids:
        try:
            movie = await tmdb_client.get_movie_details(movie_id)
            # Transform to consistent format
            poster_path = movie.get("poster_path")
            backdrop_path = movie.get("backdrop_path")
            
            recommendations.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get("overview", ""),
                "release_date": movie.get("release_date", ""),
                "vote_average": movie.get("vote_average", 0),
                "poster_url": f"{tmdb_client.image_base_url}{poster_path}" if poster_path else None,
                "backdrop_url": f"{tmdb_client.image_base_url}{backdrop_path}" if backdrop_path else None,
            })
        except Exception:
            # Skip movies that can't be fetched
            continue
    
    return recommendations