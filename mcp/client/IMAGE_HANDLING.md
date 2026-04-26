# Image Handling: LogSeq vs Quiz JSON Format

## Overview
LogSeq stores images differently than our quiz JSON schema. This document explains how to convert LogSeq images to the proper quiz format.

## LogSeq Image Format

In LogSeq, images are stored as embedded content blocks or markdown references:

```markdown
![alt-text](./assets/image-name.png)
![alt-text](../assets/subfolder/image-name.png)
```

LogSeq can also embed images using:
- `book::` property references
- Direct asset links in the filesystem

## Quiz JSON Image Format

Our quiz schema supports images at two levels:

### 1. Question-level Attachments
```json
{
  "_kind": "single_choice",
  "id": "q-1",
  "text": "Pick a color",
  "attachments": [
    [
      {
        "id": "att-1",
        "type": "image",
        "url": "/home/grime/Documents/SKEDSMO/assets/palette.png",
        "alt": "Color palette"
      }
    ]
  ],
  "options": [...]
}
```

### 2. Option-level Attachments
```json
{
  "id": "opt-1",
  "label": "Red",
  "attachment": {
    "id": "att-opt-1",
    "type": "image",
    "url": "/home/grime/Documents/SKEDSMO/assets/colors/red.png",
    "alt": "Red color swatch"
  }
}
```

## Conversion Rules

### Rule 1: Use Absolute Paths
- **LogSeq:** `./assets/image.png` (relative)
- **Quiz JSON:** `/home/grime/Documents/SKEDSMO/assets/image.png` (absolute)

### Rule 2: Extract Alt Text
- Look for markdown alt text: `![alt-text](path)`
- If not available, generate from filename or context
- Always populate the `alt` field for accessibility

### Rule 3: Determine Attachment Type
- **image**: PNG, JPG, GIF, SVG, WebP files
- **code**: For embedded code blocks (JSON, JavaScript, etc.)
  ```json
  {
    "id": "att-code-1",
    "type": "code",
    "language": "javascript",
    "code": "const x = 10;"
  }
  ```

### Rule 4: Image Nesting in JSON
- Questions can have multiple images: wrap in array of arrays `[[{...}, {...}]]`
- Options can have single image: `"attachment": {...}`

## Asset Directory Structure

```
/home/grime/Documents/SKEDSMO/
├── assets/
│   ├── M15_GassII/
│   │   ├── M15_11_FuelSystems/
│   │   │   ├── diagram-1.png
│   │   │   ├── diagram-2.png
│   │   ├── M15_13_StartIgnition/
│   │   │   └── schematic.png
│   ├── M7_Maintenance/
│   │   └── tools.png
```

## Parsing LogSeq to JSON

When extracting questions from LogSeq:

1. **Identify image references** in block content
2. **Extract markdown format**: `![alt](path)` → parse alt and path
3. **Convert relative paths** to absolute: `./assets/file.png` → `/home/grime/Documents/SKEDSMO/assets/file.png`
4. **Determine placement**:
   - If image is before options → attachment on question
   - If image is with an option → attachment on option
5. **Validate asset exists** at target path before including in JSON

## Example Conversion

### LogSeq Source
```markdown
**Question:** How does a fuel pump work?
![Fuel pump diagram](./assets/M15_11/fuel-pump.png)

Options:
- ![Option A image](./assets/M15_11/option-a.png) Positive displacement
- No image: Centrifugal pump
```

### Converted to JSON
```json
{
  "_kind": "single_choice",
  "id": "q-fuel-pump-1",
  "text": "How does a fuel pump work?",
  "attachments": [
    [
      {
        "id": "att-fuel-pump-1",
        "type": "image",
        "url": "/home/grime/Documents/SKEDSMO/assets/M15_11/fuel-pump.png",
        "alt": "Fuel pump diagram"
      }
    ]
  ],
  "options": [
    {
      "id": "opt-1",
      "label": "Positive displacement",
      "attachment": {
        "id": "att-opt-1",
        "type": "image",
        "url": "/home/grime/Documents/SKEDSMO/assets/M15_11/option-a.png",
        "alt": "Option A image"
      }
    },
    {
      "id": "opt-2",
      "label": "Centrifugal pump"
    }
  ]
}
```

## Script Implementation

The parsing script (`parse_cards.py`) should:

```python
import re
import os

def convert_logseq_image_to_json(logseq_content, module_name):
    """
    Convert LogSeq markdown images to quiz JSON attachment format.
    
    Args:
        logseq_content: Block content from LogSeq
        module_name: Module identifier (e.g., "M15/11")
    
    Returns:
        List of attachment objects or None
    """
    # Extract image markdown: ![alt](path)
    image_pattern = r'!\[([^\]]*)\]\(([^\)]+)\)'
    matches = re.findall(image_pattern, logseq_content)
    
    if not matches:
        return None
    
    attachments = []
    for alt_text, img_path in matches:
        # Convert relative to absolute path
        if img_path.startswith('./') or img_path.startswith('../'):
            abs_path = f"/home/grime/Documents/SKEDSMO/assets/{img_path.replace('./', '').replace('../', '')}"
        else:
            abs_path = img_path
        
        # Validate file exists
        # if not os.path.exists(abs_path):
        #     continue  # Skip missing files
        
        attachment = {
            "id": f"att-{len(attachments)+1}",
            "type": "image",
            "url": abs_path,
            "alt": alt_text or os.path.basename(img_path)
        }
        attachments.append(attachment)
    
    return [attachments] if attachments else None
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Images not showing | Check path is absolute and file exists at `/home/grime/Documents/SKEDSMO/assets/...` |
| Missing alt text | Generate from filename or context of the question |
| Path not found | Verify asset structure matches `/home/grime/Documents/SKEDSMO/assets/MODULE/CHAPTER/filename` |
| Relative paths in JSON | Always convert to `/home/grime/Documents/SKEDSMO/...` absolute paths |

