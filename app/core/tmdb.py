import httpx
from app.config import TMDB_API_KEY, TMDB_API_READ_ACCESS_TOKEN, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL

class TMDBClient:
    def __init__(self):
        self.api_key = TMDB_API_KEY
        self.access_token = TMDB_API_READ_ACCESS_TOKEN
        self.base_url = TMDB_BASE_URL
        self.image_base_url = TMDB_IMAGE_BASE_URL
        
    async def _make_request(self, endpoint, params=None):
        """Make an API request to TMDB."""
        if params is None:
            params = {}
        
        # Using Bearer token authentication
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json;charset=utf-8"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{endpoint}", 
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_popular_movies(self, page=1):
        """Get popular movies from TMDB."""
        data = await self._make_request("/movie/popular", {"page": page})
        return self._transform_movies(data["results"])
    
    async def get_movie_details(self, movie_id):
        """Get detailed information about a movie, including credits."""
        return await self._make_request(
            f"/movie/{movie_id}",
            {"append_to_response": "credits"}
        )
    
    async def get_movie_credits(self, movie_id):
        """Get movie credits from TMDB."""
        return await self._make_request(f"/movie/{movie_id}/credits")
    
    async def search_movies(self, query, page=1):
        """Search for movies by title."""
        data = await self._make_request("/search/movie", {"query": query, "page": page})
        return self._transform_movies(data["results"])
    
    async def get_movie_recommendations(self, movie_id):
        """Get TMDB recommendations for a movie."""
        data = await self._make_request(f"/movie/{movie_id}/recommendations")
        return self._transform_movies(data["results"])
    
    def _transform_movies(self, movies):
        """Transform movie data to a consistent format."""
        transformed = []
        for movie in movies:
            poster_path = movie.get("poster_path")
            backdrop_path = movie.get("backdrop_path")
            
            transformed.append({
                "id": movie["id"],
                "title": movie["title"],
                "overview": movie.get("overview", ""),
                "release_date": movie.get("release_date", ""),
                "vote_average": movie.get("vote_average", 0),
                "poster_url": f"{self.image_base_url}{poster_path}" if poster_path else None,
                "backdrop_url": f"{self.image_base_url}{backdrop_path}" if backdrop_path else None,
            })
        
        return transformed

# Create a singleton instance
tmdb_client = TMDBClient()