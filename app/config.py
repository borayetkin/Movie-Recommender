import os
import warnings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# TMDB API settings
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_API_READ_ACCESS_TOKEN = os.getenv("TMDB_API_READ_ACCESS_TOKEN", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Show warning if API keys are missing
if not TMDB_API_KEY or not TMDB_API_READ_ACCESS_TOKEN:
    warnings.warn(
        "TMDB API key or read access token is missing. "
        "Please set TMDB_API_KEY and TMDB_API_READ_ACCESS_TOKEN in your .env file. "
        "See README.md for instructions."
    )

# App settings
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Recommendation settings
MIN_RATINGS = 5  # Minimum number of ratings needed before generating recommendations
TOP_N_RECOMMENDATIONS = 10  # Number of recommendations to generate