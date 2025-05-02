from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
import shutil

from app.api import movies, users
from app.config import APP_HOST, APP_PORT, DEBUG
from app.utils import copy_directory_recursively

# Create FastAPI application
app = FastAPI(
    title="Movie Recommender API",
    description="A simple movie recommendation system using collaborative filtering",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(movies.router, prefix="/api/movies", tags=["Movies"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

# Create static directory if it doesn't exist
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# Copy frontend files to static directory
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    # Copy individual files
    for file in ["index.html", "styles.css", "app.js"]:
        src_file = os.path.join(frontend_dir, file)
        dst_file = os.path.join(static_dir, file)
        if os.path.exists(src_file):
            shutil.copy2(src_file, dst_file)
            print(f"Copied {file} to static directory")
    
    # Copy directories
    for directory in ["components", "services", "utils"]:
        src_dir = os.path.join(frontend_dir, directory)
        dst_dir = os.path.join(static_dir, directory)
        if os.path.exists(src_dir):
            copy_directory_recursively(src_dir, dst_dir)
            print(f"Copied directory {directory} to static")

# Mount static files
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    """Serve the frontend application."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        return {"message": "Welcome to the Movie Recommender API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def start():
    """Start the FastAPI server."""
    uvicorn.run("app.main:app", host=APP_HOST, port=APP_PORT, reload=DEBUG)

if __name__ == "__main__":
    start()