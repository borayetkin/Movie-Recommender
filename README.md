# Movie Recommender

A modern movie recommendation website with a Vue.js frontend and FastAPI backend.

## Project Structure

```
movie-recommender/
│
├── app/                    # FastAPI backend
│   ├── api/                # API endpoints
│   ├── core/               # Core functionality
│   ├── static/             # Static files served by FastAPI
│   ├── __init__.py
│   ├── config.py           # Configuration settings
│   └── main.py             # FastAPI application
│
├── frontend/               # Vue.js frontend source
│   ├── components/         # Vue components
│   │   └── MovieCard.js    # Movie card component
│   ├── services/           # API services
│   │   └── api.js          # API endpoints and fetch functions
│   ├── utils/              # Utility functions
│   │   └── formatting.js   # Formatting utilities
│   ├── styles.css          # Global CSS
│   ├── app.js              # Main Vue application
│   └── index.html          # Main HTML template
│
└── requirements.txt        # Python dependencies
```

## How it Works

The project consists of two main parts:

1. **FastAPI Backend**: Provides API endpoints for movie data
2. **Vue.js Frontend**: User interface for browsing and searching movies

When you run the application, FastAPI automatically copies the frontend files to its static directory to serve them.

## Development

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m app.main
```

### Frontend Development

The frontend is built with Vue.js using ES modules. When you make changes to the frontend files, FastAPI will automatically copy them to the static directory on restart.

## Features

- Browse popular movies
- Search for movies
- View detailed movie information
- Smooth animations and transitions
- Responsive design
