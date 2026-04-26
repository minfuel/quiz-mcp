# Quiz Card Extraction & Organization - Setup Complete ✓

## Summary

The quiz card extraction system has been successfully reorganized with proper folder structure, naming conventions, and asset path handling.

## Directory Structure

### Python Scripts Location
```
/home/grime/Documents/quiz-mcp/
└── mcp/
    └── client/
        ├── fetch_pages.py       # Fetch LogSeq pages
        ├── parse_cards.py       # Parse into quiz JSON
        └── README.md            # Usage documentation
```

### Generated Quiz Files Location
```
/home/grime/Documents/quiz-mcp/
└── demo/
    ├── M15 GASS 2/
    │   ├── S1 Fundamentals/
    │   │   └── sample1-quiz.json
    │   ├── S11 Fuel Systems/
    │   │   └── sample1-quiz.json
    │   ├── S13 Starting and Ignition Systems/
    │   │   └── sample1-quiz.json
    │   └── ...
    ├── M10 Lover og bestemmelser/
    │   ├── S2 - Part-66/
    │   │   └── sample1-quiz.json
    └── ...
```

## Key Changes

### 1. Python Scripts Organized in `mcp/client/`
- Scripts moved from project root to `mcp/client/` folder
- Clear separation of concerns: fetch vs. parse
- README with usage instructions

### 2. Proper Naming Convention
- Module folders: `M15 GASS 2` (with space, not underscores)
- Chapter folders: `S11 Fuel Systems` (S = Section, number from reference)
- Quiz files: Always named `sample1-quiz.json`

### 3. Asset Path Handling
- All image URLs use absolute paths: `/home/grime/Documents/SKEDSMO/assets/...`
- Images extracted from LogSeq markdown format: `![alt](./path)` → absolute paths
- Support for image attachments at question and option levels

### 4. JSON Format Compliance
- All generated quizzes match the quiz schema
- Proper attachment structure for images:
  ```json
  "attachments": [[
    {
      "id": "att-1",
      "type": "image",
      "url": "/home/grime/Documents/SKEDSMO/assets/...",
      "alt": "description"
    }
  ]]
  ```

## Data Generated

- **19 quiz files** generated from LogSeq pages
- **Modules parsed:** M15 Gass 2 (18 chapters), M10 Lover og bestemmelser (1 chapter)
- **Questions extracted:** Approximately 100+ questions marked with `#card` tag

## Documentation Files

| File | Purpose |
|------|---------|
| `IMAGE_HANDLING.md` | Complete guide on converting LogSeq images to quiz format |
| `mcp/client/README.md` | Python scripts usage and configuration |
| `SETUP_COMPLETE.md` | This file |

## Quick Start

### Generate Quiz Files

```bash
# Step 1: From project root or mcp/client
cd /home/grime/Documents/quiz-mcp/mcp/client

# Fetch fresh pages from LogSeq
uv run fetch_pages.py

# Generate quiz files in demo/ folder
uv run parse_cards.py
```

### Output
- Quiz files appear in `demo/MODULE/CHAPTER/sample1-quiz.json`
- Check console for generation summary

## Next Steps

### To Add More Modules:
1. Edit `MODULES` list in `mcp/client/fetch_pages.py`
2. Run fetch and parse scripts
3. New quiz files auto-generate in `demo/` folder

### To Customize Parsing:
1. Edit parsing logic in `mcp/client/parse_cards.py`
2. Modify question extraction, image handling, or ID generation
3. Update asset paths in `ASSETS_BASE` constant

### To Change Chapter Naming:
1. Edit `_parse_chapter_ref()` method in `parse_cards.py`
2. Update folder naming format (currently: `S##` prefix)
3. Regenerate with `uv run parse_cards.py`

## Asset Directory Structure Expected

```
/home/grime/Documents/SKEDSMO/
├── assets/
│   ├── M15_11/
│   │   ├── fuel-pump.png
│   │   ├── diagrams/
│   ├── M15_13/
│   │   └── starting-system.png
│   └── ...
```

Images referenced in quizzes must exist at these absolute paths.

## File Statistics

- **Python scripts:** 2 files (fetch + parse)
- **Documentation:** 3 files (IMAGE_HANDLING + README + this file)
- **Generated quizzes:** 19 JSON files (varies by module content)

## Notes

- Old quiz files in project root are superseded by demo/ folder structure
- The `pages_data.json` cache allows regenerating quizzes without re-fetching
- All asset paths are absolute; relative paths not supported in generated JSON
- Question type defaulted to `single_choice` (True/False) based on card content

---

**Status:** ✅ Setup Complete and Tested
**Last Updated:** 2026-04-26
