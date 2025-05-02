import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# TMDB API settings
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_API_READ_ACCESS_TOKEN = os.getenv("TMDB_API_READ_ACCESS_TOKEN")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# App settings
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Recommendation settings
MIN_RATINGS = 5  # Minimum number of ratings needed before generating recommendations
TOP_N_RECOMMENDATIONS = 10  # Number of recommendations to generate