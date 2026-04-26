#!/usr/bin/env python3
"""
Clean up invalid attachment URLs from quiz JSON files.

This script removes attachment entries that:
- Point to non-existent absolute paths
- Are invalid URIs (like /home/... paths instead of http:// or file://)

Usage:
    python cleanup-quiz-attachments.py
"""

import json
import re
from pathlib import Path
from typing import Any

def is_valid_url(url: str) -> bool:
    """Check if URL is valid (http, https, or valid file path)."""
    # Valid if it starts with http:// or https://
    if url.startswith(("http://", "https://")):
        return True
    # Valid if it's a relative path like ./assets/...
    if url.startswith(("./", "../")):
        return True
    # Valid if it's a valid file:// URI
    if url.startswith("file://"):
        return True
    # Invalid: absolute linux paths, home paths, etc.
    return False

def clean_quiz_json(quiz_data: dict) -> dict:
    """Remove invalid attachments from quiz data."""
    if "questions" not in quiz_data:
        return quiz_data
    
    for question in quiz_data["questions"]:
        if "attachments" not in question:
            continue
        
        # Filter attachments - keep only valid URLs
        valid_attachments = []
        for attachment_group in question["attachments"]:
            valid_group = []
            for attachment in attachment_group:
                if isinstance(attachment, dict) and "url" in attachment:
                    if is_valid_url(attachment["url"]):
                        valid_group.append(attachment)
                    else:
                        print(f"  ✗ Removed invalid attachment: {attachment['url']}")
            
            if valid_group:
                valid_attachments.append(valid_group)
        
        if valid_attachments:
            question["attachments"] = valid_attachments
        else:
            # Remove attachments key if no valid attachments
            del question["attachments"]
    
    return quiz_data

def clean_quiz_files(demo_dir: Path = None) -> None:
    """Clean all quiz files in demo directory."""
    if demo_dir is None:
        demo_dir = Path(__file__).parent / "demo"
    
    if not demo_dir.exists():
        print(f"Error: {demo_dir} not found")
        return
    
    # Find all quiz.json files
    quiz_files = list(demo_dir.rglob("*-quiz.json"))
    
    if not quiz_files:
        print("No quiz files found")
        return
    
    print(f"Found {len(quiz_files)} quiz files to process\n")
    
    for quiz_file in quiz_files:
        print(f"Processing: {quiz_file.relative_to(demo_dir)}")
        
        try:
            # Load quiz
            with open(quiz_file, "r", encoding="utf-8") as f:
                quiz_data = json.load(f)
            
            # Clean it
            original_data = json.dumps(quiz_data)
            cleaned_data = clean_quiz_json(quiz_data)
            
            # Write back if changed
            if json.dumps(cleaned_data) != original_data:
                with open(quiz_file, "w", encoding="utf-8") as f:
                    json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
                print(f"  ✓ Updated")
            else:
                print(f"  - No changes needed")
        
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
        
        print()

if __name__ == "__main__":
    clean_quiz_files()
    print("Done!")
