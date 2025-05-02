import polars as pl
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.config import MIN_RATINGS, TOP_N_RECOMMENDATIONS

class MovieRecommender:
    def __init__(self):
        # Initialize empty dataframes
        self.ratings = pl.DataFrame({
            "user_id": [],
            "movie_id": [],
            "rating": []
        })
        self.movie_similarity = None
        self.movie_indices = {}
        
    def add_rating(self, user_id, movie_id, rating):
        """Add a user rating for a movie."""
        # Create a new rating row
        new_rating = pl.DataFrame({
            "user_id": [user_id],
            "movie_id": [movie_id],
            "rating": [float(rating)]
        })
        
        # Check if this user/movie combination already exists
        existing = self.ratings.filter(
            (pl.col("user_id") == user_id) & 
            (pl.col("movie_id") == movie_id)
        )
        
        if len(existing) > 0:
            # Update existing rating
            self.ratings = self.ratings.filter(
                ~((pl.col("user_id") == user_id) & (pl.col("movie_id") == movie_id))
            ).vstack(new_rating)
        else:
            # Add new rating
            self.ratings = self.ratings.vstack(new_rating)
        
        # Recalculate similarities if we have enough ratings
        if self._should_calculate_similarities():
            self._calculate_movie_similarities()
            
        return True
    
    def get_user_ratings(self, user_id):
        """Get all ratings by a specific user."""
        user_ratings = self.ratings.filter(pl.col("user_id") == user_id)
        return user_ratings.to_dicts()
    
    def _should_calculate_similarities(self):
        """Check if we have enough data to calculate similarities."""
        # Check total number of ratings
        if len(self.ratings) < MIN_RATINGS:
            return False
            
        # Check number of unique movies
        unique_movies = self.ratings["movie_id"].unique()
        if len(unique_movies) < 2:
            return False
            
        return True

    def _calculate_movie_similarities(self):
        """Calculate movie similarities using collaborative filtering."""
        # Create a user-movie matrix
        user_movie_matrix = self.ratings.pivot(
            index="user_id", 
            columns="movie_id", 
            values="rating",
            aggregate_function="mean"
        )
        
        # Fill NaN values with 0
        user_movie_matrix = user_movie_matrix.fill_null(0)
        
        # Get the column names (movie IDs) and convert to numpy array
        movie_ids = user_movie_matrix.columns[1:]  # Skip user_id column
        matrix = user_movie_matrix.select(movie_ids).to_numpy()
        
        # Calculate cosine similarity between movies
        if matrix.shape[1] > 1:  # Need at least 2 movies
            self.movie_similarity = cosine_similarity(matrix.T)
            
            # Map movie IDs to indices
            self.movie_indices = {int(movie_id): i for i, movie_id in enumerate(movie_ids)}
        
    def get_recommendations(self, user_id, n=TOP_N_RECOMMENDATIONS):
        """Get movie recommendations for a user."""
        if self.movie_similarity is None:
            return []
            
        # Get movies the user has already rated
        user_ratings = self.ratings.filter(pl.col("user_id") == user_id)
        if len(user_ratings) == 0:
            return []
            
        # Get all movie IDs
        all_movie_ids = list(self.movie_indices.keys())
        
        # Get the IDs of movies the user has already rated
        rated_movie_ids = user_ratings["movie_id"].to_list()
        
        # Find movies the user hasn't rated yet
        unrated_movie_ids = [m_id for m_id in all_movie_ids if m_id not in rated_movie_ids]
        if not unrated_movie_ids:
            return []
            
        # Calculate predicted ratings for unrated movies
        predicted_ratings = []
        for movie_id in unrated_movie_ids:
            if movie_id not in self.movie_indices:
                continue
                
            movie_idx = self.movie_indices[movie_id]
            
            # Calculate weighted sum of ratings
            weighted_sum = 0
            similarity_sum = 0
            
            for rated_id, rating in zip(user_ratings["movie_id"], user_ratings["rating"]):
                if rated_id not in self.movie_indices:
                    continue
                    
                rated_idx = self.movie_indices[rated_id]
                sim = self.movie_similarity[movie_idx, rated_idx]
                
                weighted_sum += sim * rating
                similarity_sum += abs(sim)
                
            # Calculate predicted rating
            predicted_rating = weighted_sum / similarity_sum if similarity_sum > 0 else 0
            predicted_ratings.append((movie_id, predicted_rating))
            
        # Sort by predicted rating (descending) and take top N
        recommended_movies = sorted(predicted_ratings, key=lambda x: x[1], reverse=True)[:n]
        
        return [movie_id for movie_id, _ in recommended_movies]

# Create a singleton instance
recommender = MovieRecommender()