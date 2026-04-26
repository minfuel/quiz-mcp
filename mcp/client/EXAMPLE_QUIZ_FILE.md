# Example Quiz File

This is an example of a generated quiz file from the parser.

**Location:** `demo/M15 GASS 2/S11 Fuel Systems/sample1-quiz.json`

**Structure:**
```
Module/
  Chapter/
    sample1-quiz.json
```

## JSON Schema

```json
{
  "id": "quiz-MODULE-SECTION-level-LEVEL",
  "title": "MODULE - SECTION TITLE - Level LEVEL",
  "description": "Quiz for MODULE chapter SECTION TITLE level LEVEL",
  "questions": [
    {
      "_kind": "single_choice",
      "id": "q-0",
      "text": "Question text here",
      "score": 1,
      "options": [
        {
          "id": "q-0-opt-1",
          "label": "Option 1"
        },
        {
          "id": "q-0-opt-2",
          "label": "Option 2"
        }
      ]
    }
  ]
}
```

## With Images/Attachments

```json
{
  "_kind": "single_choice",
  "id": "q-1",
  "text": "What is shown in this image?",
  "attachments": [
    [
      {
        "id": "att-1",
        "type": "image",
        "url": "/home/grime/Documents/SKEDSMO/assets/M15_11/fuel-pump.png",
        "alt": "Fuel pump schematic diagram"
      }
    ]
  ],
  "options": [
    {
      "id": "q-1-opt-1",
      "label": "Option A",
      "attachment": {
        "id": "att-opt-1",
        "type": "image",
        "url": "/home/grime/Documents/SKEDSMO/assets/M15_11/option-a.png",
        "alt": "Option A diagram"
      }
    },
    {
      "id": "q-1-opt-2",
      "label": "Option B"
    }
  ]
}
```

## Naming Convention

| Component | Format | Example |
|-----------|--------|---------|
| Module | `M[NUMBER] [NAME]` | `M15 GASS 2` |
| Chapter | `S[NUMBER] [TITLE]` | `S11 Fuel Systems` |
| Quiz File | `sample1-quiz.json` | `sample1-quiz.json` |
| ID Pattern | `quiz-{module}-{section}-level-{level}` | `quiz-M15 Gass 2-S11-level-2` |
| Question ID | `q-{index}` | `q-0`, `q-1`, etc. |
| Option ID | `{q_id}-opt-{index}` | `q-0-opt-1`, `q-0-opt-2` |
| Attachment ID | `att-{index}` | `att-1`, `att-2` |

## Asset Paths

All asset URLs must be absolute paths:

❌ **Wrong:**
```json
"url": "./assets/fuel-pump.png"
"url": "../assets/M15_11/diagram.png"
```

✅ **Correct:**
```json
"url": "/home/grime/Documents/SKEDSMO/assets/M15_11/fuel-pump.png"
```

## Question Types Supported

| Type | Usage |
|------|-------|
| `single_choice` | Multiple options, one correct answer |
| `multiple_choice` | Multiple options, multiple correct answers |
| `fill_gaps` | Blanks to fill in sentence |
| `match` | Match left items to right items |
| `sorting` | Arrange items in order |
| `short_text` | Free text input (short) |
| `long_text` | Free text input (long) |
| `dropdown` | Select from dropdown |
| `scale` | Rating scale |
| `upload` | File upload |

Current parser generates: **`single_choice`** as default

## Full Example

```json
{
  "id": "quiz-M15-Gass-2-S11-level-2",
  "title": "M15 GASS 2 - S11 Fuel Systems - Level 2",
  "description": "Quiz for M15 GASS 2 chapter S11 Fuel Systems level 2",
  "questions": [
    {
      "_kind": "single_choice",
      "id": "q-0",
      "text": "156. Which fuel manifolds have fuel during high engine settings?",
      "score": 1,
      "options": [
        {"id": "q-0-opt-1", "label": "True"},
        {"id": "q-0-opt-2", "label": "False"}
      ]
    },
    {
      "_kind": "single_choice",
      "id": "q-1",
      "text": "157. What is the most critical temperature in a gas turbine engine?",
      "score": 1,
      "attachments": [
        [
          {
            "id": "att-1",
            "type": "image",
            "url": "/home/grime/Documents/SKEDSMO/assets/M15_11/turbine-temp.png",
            "alt": "Turbine temperature zones"
          }
        ]
      ],
      "options": [
        {"id": "q-1-opt-1", "label": "True"},
        {"id": "q-1-opt-2", "label": "False"}
      ]
    }
  ]
}
```

## Generation Commands

```bash
# Generate all quizzes
cd /home/grime/Documents/quiz-mcp/mcp/client
uv run parse_cards.py

# Output example:
#   ✓ M15 GASS 2/S11 Fuel Systems/sample1-quiz.json
#   ✓ M15 GASS 2/S13 Starting and Ignition Systems/sample1-quiz.json
```

---

For more details, see [IMAGE_HANDLING.md](../IMAGE_HANDLING.md) and [mcp/client/README.md](../mcp/client/README.md).
