import os
import shutil

def copy_directory_recursively(src, dst):
    """
    Recursively copy a directory tree from src to dst.
    If dst exists, it will be overwritten.
    
    Args:
        src: Source directory path
        dst: Destination directory path
    """
    if os.path.exists(dst):
        # Remove existing destination directory to ensure clean copy
        shutil.rmtree(dst)
    
    # Create destination directory
    os.makedirs(dst, exist_ok=True)
    
    # Walk through the source directory
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        
        if os.path.isdir(s):
            # If it's a directory, copy recursively
            copy_directory_recursively(s, d)
        else:
            # If it's a file, copy it
            shutil.copy2(s, d)
            print(f"Copied {s} to {d}") 