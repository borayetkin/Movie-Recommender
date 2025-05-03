import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# TMDB API settings
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "a40369ed4f9f35cdc0d7b2cda69cfc38")
TMDB_API_READ_ACCESS_TOKEN = os.getenv(
    "TMDB_API_READ_ACCESS_TOKEN", 
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhNDAzNjllZDRmOWYzNWNkYzBkN2IyY2RhNjljZmMzOCIsIm5iZiI6MTc0NjIwNDQzMi43NTYsInN1YiI6IjY4MTRmNzEwMmExOWVjY2Y0ZTk1OTBhZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.K9mAH5gaQEZzFwE6HH4oPXXeM3OVc0UiYKJVJdu-_Mw"
)
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# App settings
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Recommendation settings
MIN_RATINGS = 5  # Minimum number of ratings needed before generating recommendations
TOP_N_RECOMMENDATIONS = 10  # Number of recommendations to generate