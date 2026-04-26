# Quiz Parsing & Attachment Handling Guide

## Overview

This document explains the improvements made to ensure quiz JSON files are properly validated and don't contain invalid attachment URLs.

## Problem Addressed

Previously, quiz files generated from LogSeq contained absolute filesystem paths as attachment URLs (e.g., `/home/grime/Documents/SKEDSMO/assets/...`). These paths:
- Were machine-specific and didn't exist on other systems
- Failed JSON Schema validation (invalid URIs)
- Caused quiz runner errors

## Solutions Implemented

### 1. **parse_cards.py - Updated Parser** (`mcp/client/parse_cards.py`)

**Changes:**
- Made `ASSETS_BASE` configurable via environment variable `LOGSEQ_ASSETS_BASE`
- Falls back to auto-detecting common asset paths
- Only includes attachments if:
  - The asset directory is configured
  - The file actually exists on the filesystem
  - The path can be properly resolved
- Uses relative paths (`./assets/...`) instead of absolute paths
- Logs warnings for skipped attachments

**Environment Variables:**
```bash
# Set custom assets base (optional)
export LOGSEQ_ASSETS_BASE=/path/to/assets

# Then run parser
python mcp/client/parse_cards.py
```

**Benefits:**
- Quiz files are now portable across machines
- Invalid URLs are excluded during generation
- Parser gracefully handles missing assets

### 2. **cleanup-quiz-attachments.py - Cleanup Tool**

A standalone script to fix existing quiz files with invalid attachments.

**Usage:**
```bash
python cleanup-quiz-attachments.py
```

**What it does:**
- Scans all quiz files in `demo/` directory
- Removes attachments with invalid URLs
- Keeps attachments with valid paths:
  - `http://...` or `https://...` (URLs)
  - `./...` or `../...` (relative paths)
  - `file://...` (file URIs)

**Output Example:**
```
Found 36 quiz files to process

Processing: M15 GASS 2/S1 Fundamentals/sample1-quiz.json
  ✗ Removed invalid attachment: /home/grime/Documents/SKEDSMO/assets/...
  ✗ Removed invalid attachment: /home/grime/Documents/SKEDSMO/assets/...
  ✓ Updated
```

## URL Format Guidelines

### Valid Attachment URLs:

✅ **Relative Paths**
```json
{
  "url": "./assets/image.png",
  "url": "../assets/diagram.jpg"
}
```

✅ **HTTP/HTTPS**
```json
{
  "url": "https://example.com/image.png",
  "url": "https://cdn.example.com/assets/file.pdf"
}
```

✅ **File URIs** (for local files)
```json
{
  "url": "file:///home/user/documents/image.png"
}
```

### ❌ Invalid Attachment URLs:

❌ Absolute POSIX paths
```json
{
  "url": "/home/user/Documents/image.png"
}
```

❌ Absolute Windows paths
```json
{
  "url": "C:\\Users\\Documents\\image.png"
}
```

❌ Non-existent paths
```json
{
  "url": "/home/grime/Documents/SKEDSMO/assets/image.png"
}
```

## Best Practices

When generating quiz files from LogSeq or other sources:

1. **Use Relative Paths**: If assets are in a folder alongside the quiz files
   ```markdown
   ![Diagram](./assets/diagram.png)
   ```

2. **Use URLs for Web Content**: If linking to external resources
   ```markdown
   ![Reference](https://cdn.example.com/image.png)
   ```

3. **Set ASSETS_BASE Correctly**: When running the parser
   ```bash
   export LOGSEQ_ASSETS_BASE=/path/to/logseq/assets
   python mcp/client/parse_cards.py
   ```

4. **Run Cleanup After Updates**: If quiz files are updated or regenerated
   ```bash
   python cleanup-quiz-attachments.py
   ```

## Troubleshooting

### Error: "invalid quiz: questions.X.attachments.0.0.url: Invalid url"

**Cause**: Attachment URL is not a valid URI format

**Solution**: Run cleanup script or manually remove invalid attachments

```bash
python cleanup-quiz-attachments.py
```

### Error: "Skipping image attachment ... - no assets base configured"

**Cause**: `ASSETS_BASE` is not configured and no common asset paths were found

**Solution**: Set the environment variable
```bash
export LOGSEQ_ASSETS_BASE=/path/to/your/assets
python mcp/client/parse_cards.py
```

### Error: "Skipping image attachment ... - file not found"

**Cause**: Asset file doesn't exist at the expected location

**Solution**: 
1. Verify the file exists
2. Check that `LOGSEQ_ASSETS_BASE` points to correct directory
3. Run cleanup to remove the invalid reference

## Makefile Integration

The `quiz-15` command now works reliably:

```bash
make quiz-15
# Launches M15 GASS 2 - S1 Fundamentals quiz
```

This command:
- Uses only valid quiz files
- Runs on http://localhost with a random port
- Saves answers to `./answers.json`
- Attempts to open in browser (if available)

## Summary

These improvements ensure that:
- ✅ Quiz files validate without errors
- ✅ Attachment URLs are portable across machines
- ✅ Invalid attachments are gracefully excluded
- ✅ Parser is configurable and robust
- ✅ Existing quiz files can be easily cleaned up
