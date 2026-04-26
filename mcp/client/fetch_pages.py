#!/usr/bin/env python3
"""
Fetch LogSeq pages for all modules and save to JSON.

Usage:
    cd /home/grime/Documents/quiz-mcp/mcp/client
    uv run fetch_pages.py
"""

import json
from pathlib import Path
from mcp_logseq.logseq import LogSeq

# API Configuration
API_KEY = "9a549897-5ffb-44d5-8251-c484af4b619e"
API_URL = "http://localhost:12315"

# Module list
MODULES = [
    "M1 Matematikk",
    "M2 Fysikk",
    "M3 Elektrolære",
    "M4 Elektronikklære",
    "M5 Digitalteknikk",
    "M6 Materiallære",
    "M7 Vedlikeholdsteknikk",
    "M8 Aerodynamikk",
    "M9 Human Factors",
    "M10 Lover og bestemmelser",
    "M11-12 Luftfartøylære",
    "M12 Hass",
    "M13 Lass",
    "M14 Motorfremdrift",
    "M15 Gass 2",
    "M16B1 Piston Engine",
    "M17 Propeller",
]

def fetch_all_pages():
    """Fetch content from all module pages in LogSeq."""
    print("Initializing LogSeq API...")
    api = LogSeq(api_key=API_KEY)
    
    pages_data = {}
    
    for module in MODULES:
        try:
            print(f"Fetching: {module}...", end=" ")
            content = api.get_page_content(module)
            if content:
                pages_data[module] = content
                print("✓")
            else:
                print("✗ (page not found)")
        except Exception as e:
            print(f"✗ (error: {str(e)[:50]})")
    
    return pages_data

def save_pages_data(pages_data):
    """Save fetched pages to JSON file."""
    output_file = Path(__file__).parent / "pages_data.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(pages_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Pages data saved to: {output_file}")
    return output_file

if __name__ == "__main__":
    pages = fetch_all_pages()
    if pages:
        save_pages_data(pages)
        print(f"Total pages fetched: {len(pages)}")
    else:
        print("No pages fetched. Check LogSeq connection.")
