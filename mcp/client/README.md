# Quiz Card Parser Client

Extract and organize quiz cards from LogSeq pages into structured JSON files.

## Overview

This client fetches quiz content from LogSeq knowledge base entries and converts them into standardized quiz JSON format. The output is organized by module, chapter, and level in the `demo/` folder.

## Files

- **`fetch_pages.py`**: Fetch LogSeq page content for all modules
- **`parse_cards.py`**: Parse fetched content into quiz JSON files
- **`README.md`**: This file

## Folder Structure Output

```
demo/
├── M15 GASS 2/
│   ├── S11 Fuel Systems/
│   │   └── sample1-quiz.json
│   ├── S13 Starting and Ignition/
│   │   └── sample1-quiz.json
│   └── ...
├── M7 Vedlikeholdsteknikk/
│   └── ...
```

## Usage

### Step 1: Fetch Pages from LogSeq

```bash
cd /home/grime/Documents/quiz-mcp/mcp/client
uv run fetch_pages.py
```

This creates `pages_data.json` in the project root with all module page content.

### Step 2: Parse into Quiz Files

```bash
uv run parse_cards.py
```

This generates quiz JSON files in `demo/` folder, organized by module and chapter.

## Configuration

### Asset Paths

All image assets use absolute paths:

```
/home/grime/Documents/SKEDSMO/assets/...
```

Update the `ASSETS_BASE` constant in `parse_cards.py` if this path changes.

### Module List

Edit the `MODULES` list in `fetch_pages.py` to add/remove modules:

```python
MODULES = [
    "M1 Matematikk",
    "M2 Fysikk",
    # ... add more
]
```

## JSON Format Reference

See `../../../IMAGE_HANDLING.md` for details on image handling and attachment format.

## Example Output

```json
{
  "id": "quiz-m15-gass-2-s11-level-2",
  "title": "M15 GASS 2 - S11 Fuel Systems - Level 2",
  "description": "Quiz for M15 GASS 2 chapter S11 Fuel Systems level 2",
  "questions": [
    {
      "_kind": "single_choice",
      "id": "q-1",
      "text": "What is a fuel pump?",
      "score": 1,
      "attachments": [
        [
          {
            "id": "att-1",
            "type": "image",
            "url": "/home/grime/Documents/SKEDSMO/assets/M15_11/fuel-pump.png",
            "alt": "Fuel pump schematic"
          }
        ]
      ],
      "options": [
        { "id": "opt-1", "label": "True" },
        { "id": "opt-2", "label": "False" }
      ]
    }
  ]
}
```

## LogSeq Page Requirements

For optimal parsing, LogSeq pages should follow this structure:

```
[[M15/11 Fuel Systems]] - Level 2

[First block: Resource link or reference]

[Question 1]
Options or details...

[Question 2]
Options or details...
```

### Question Markers

Questions are identified by:
- `#card` tag: Marks a block as a question
- `?` character: Auto-detected as question
- Prefix patterns: "What", "How", "Why", etc.

## Troubleshooting

### No pages fetched
- Check LogSeq is running
- Verify API token in `.env`
- Run: `LOGSEQ_API_TOKEN=... uv run fetch_pages.py`

### No quiz files generated
- Check `pages_data.json` was created
- Verify pages contain `[[M##/##]]` chapter references
- Check demo folder has write permissions

### Wrong asset paths
- Update `ASSETS_BASE` in `parse_cards.py`
- Verify files exist at specified paths
- Use absolute paths

## See Also

- [IMAGE_HANDLING.md](../../../IMAGE_HANDLING.md) - Image format conversion guide
- [../mcp-logseq/README.md](../mcp-logseq/README.md) - MCP LogSeq server docs
