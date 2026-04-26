#!/usr/bin/env python3
"""
Parse LogSeq page content into quiz JSON files organized by chapter/level.

Reads pages_data.json and generates quiz files in demo/ folder with structure:
    demo/
    ├── M15 GASS 2/
    │   ├── S11 Fuel Systems/
    │   │   └── sample1-quiz.json
    │   ├── S13 Starting and Ignition/
    │   │   └── sample1-quiz.json

Usage:
    cd /home/grime/Documents/quiz-mcp/mcp/client
    uv run parse_cards.py
"""

import json
import re
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# Setup logging
logger = logging.getLogger(__name__)

# Make ASSETS_BASE configurable via environment variable
# Falls back to common relative paths if not found
import os
_env_assets = os.getenv("LOGSEQ_ASSETS_BASE")
if _env_assets and Path(_env_assets).exists():
    ASSETS_BASE = _env_assets
else:
    # Try common relative paths from this script
    possible_paths = [
        Path(__file__).parent.parent.parent / "assets",
        Path(__file__).parent / "assets",
        Path.home() / "Documents" / "SKEDSMO" / "assets",  # Original location
    ]
    ASSETS_BASE = None
    for p in possible_paths:
        if p.exists():
            ASSETS_BASE = p
            break
    # If no path found, set to empty (will skip attachments)
    ASSETS_BASE = ASSETS_BASE or ""

DEMO_BASE = Path(__file__).parent.parent.parent / "demo"


class QuizParser:
    """Parse LogSeq content into quiz JSON format."""
    
    def __init__(self, pages_data: Dict[str, Any]):
        self.pages_data = pages_data
        self.quizzes = {}
        self.question_counter = 0
    
    def parse_all(self):
        """Parse all module pages."""
        for module, page_data in self.pages_data.items():
            print(f"Parsing: {module}...", end=" ")
            chapters = self._extract_chapters(module, page_data)
            if chapters:
                self.quizzes[module] = chapters
                print(f"✓ ({len(chapters)} chapters)")
            else:
                print("✗ (no chapters found)")
    
    def _extract_chapters(self, module: str, page_data: Dict) -> Dict[str, Any]:
        """Extract chapters from page content."""
        chapters = {}
        
        if not page_data:
            return chapters
        
        # The data structure has both "page" and "blocks" keys
        blocks = page_data.get("blocks", [])
        if not blocks:
            # Fallback to page children if blocks is empty
            page = page_data.get("page", {})
            blocks = page.get("children", [])
        
        for block in blocks:
            chapter_info = self._parse_chapter_block(block, module)
            if chapter_info:
                chapter_key = chapter_info["key"]
                chapters[chapter_key] = chapter_info
        
        return chapters
    
    def _parse_chapter_block(self, block: Dict, module: str) -> Optional[Dict]:
        """Parse a chapter block (usually contains [[M15/11]] - Level 2 pattern)."""
        content = block.get("content", "").strip()
        
        # Skip resource links (first blocks)
        if content.startswith("book::") or ".pdf" in content:
            return None
        
        # Look for chapter pattern: [[M15/11 Something]] or similar
        chapter_match = re.search(r'\[\[([^\]]+)\]\]', content)
        if not chapter_match:
            return None
        
        chapter_ref = chapter_match.group(1)
        
        # Extract level from same line
        level_match = re.search(r'Level\s+(\d+)', content)
        level = int(level_match.group(1)) if level_match else 1
        
        # Parse chapter reference
        chapter_key, chapter_title = self._parse_chapter_ref(chapter_ref, module)
        if not chapter_key:
            return None
        
        # Extract questions from child blocks
        questions = self._extract_questions(block.get("children", []))
        
        if not questions:
            return None
        
        return {
            "key": chapter_key,
            "title": chapter_title,
            "level": level,
            "questions": questions,
            "module": module,
        }
    
    def _parse_chapter_ref(self, ref: str, module: str) -> Tuple[Optional[str], str]:
        """Parse chapter reference like 'M15/11 Fuel Systems'."""
        parts = ref.split("/")
        if len(parts) < 2:
            return None, ref
        
        chapter_num = parts[1].strip()
        # Extract just the number before the space
        chapter_num_only = chapter_num.split()[0]
        
        # Extract full title (everything after the module number)
        # e.g., "M15/11 Fuel Systems" -> "Fuel Systems"
        title_match = ref.split("/", 1)[1]  # Get everything after /
        title = title_match.strip() if title_match else ref
        
        # Create folder name: "S11 Fuel Systems"
        folder_name = f"S{chapter_num_only} {' '.join(title.split()[1:])}" if len(title.split()) > 1 else f"S{chapter_num_only} {title}"
        
        # Create canonical key: S11
        section_key = f"S{chapter_num_only}"
        
        return section_key, folder_name
    
    def _extract_questions(self, blocks: List[Dict]) -> List[Dict]:
        """Extract questions from child blocks."""
        questions = []
        
        for block in blocks:
            content = block.get("content", "").strip()
            
            # Skip empty blocks and resource links
            if not content:
                continue
            if content.startswith("book::") or ".pdf" in content:
                continue
            
            cleaned_content = self._clean_question_text(content)
            if not cleaned_content:
                continue
            
            # Check if question-like (contains #card tag or question patterns)
            if self._is_question_block(content) or self._is_question_block(cleaned_content):
                question = self._parse_question(content, block)
                if question:
                    questions.append(question)
            
            # Recurse into children
            child_questions = self._extract_questions(block.get("children", []))
            questions.extend(child_questions)
        
        return questions
    
    def _is_question_block(self, content: str) -> bool:
        lower = content.lower()
        return (
            "#card" in lower
            or "archive-card" in lower
            or "?" in content
            or lower.startswith(("what", "how", "why", "when", "where", "which", "who", "name", "describe", "explain", "list"))
        )
    
    def _clean_question_text(self, content: str) -> str:
        lines = []
        for line in content.splitlines():
            candidate = line.strip()
            if not candidate:
                continue
            if candidate.startswith("collapsed::") or candidate.startswith("id::"):
                continue
            if "::" in candidate and not candidate.startswith("!["):
                continue
            lines.append(candidate)
        cleaned = " ".join(lines)
        cleaned = cleaned.replace("#card", "")
        cleaned = cleaned.replace("archive-card", "")
        return cleaned.strip()
    
    def _extract_explanations(self, block: Dict) -> List[str]:
        explanations: List[str] = []
        for child in block.get("children", []):
            text = child.get("content", "").strip()
            if not text:
                continue
            if self._is_question_block(text):
                continue
            cleaned = self._clean_explanation_text(text)
            if cleaned:
                explanations.append(cleaned)
            explanations.extend(self._extract_explanations(child))
        return explanations
    
    def _clean_explanation_text(self, content: str) -> str:
        lines = []
        for line in content.splitlines():
            candidate = line.strip()
            if not candidate:
                continue
            if candidate.startswith("collapsed::") or candidate.startswith("id::"):
                continue
            if "::" in candidate and not candidate.startswith("!["):
                continue
            candidate = re.sub(r'\(\([^\)]+\)\)', '', candidate)
            candidate = candidate.strip()
            if candidate:
                lines.append(candidate)
        return "\n".join(lines)
    
    def _detect_kind(self, text: str, block: Dict) -> str:
        options = self._extract_options(block)
        if options:
            if re.search(r'select all|select all that|choose all|check all', text, re.I):
                return "multiple_choice"
            if re.search(r'dropdown|choose|select', text, re.I):
                return "single_choice"
            return "single_choice"
        if re.search(r'fill in|fill the gaps|gap', text, re.I):
            return "fill_gaps"
        if re.search(r'\b(match|pair)\b', text, re.I):
            return "match"
        if re.search(r'\b(arrange|sort|order)\b', text, re.I):
            return "sorting"
        if re.search(r'\b(upload|attach|file)\b', text, re.I):
            return "upload"
        return "single_choice"
    
    def _extract_options(self, block: Dict) -> List[Dict]:
        option_texts: List[str] = []
        for child in block.get("children", []):
            raw = child.get("content", "").strip()
            if not raw:
                continue
            lines = raw.splitlines()
            for line in lines:
                stripped = line.strip()
                if stripped.startswith(('-', '*', '•')):
                    option_texts.append(re.sub(r'^[\-\*•]+\s*', '', stripped).strip())
                elif re.match(r'^[0-9]+\.', stripped):
                    option_texts.append(re.sub(r'^[0-9]+\.\s*', '', stripped).strip())
        uuid = block.get("uuid", "option")
        return [
            {"id": f"{uuid}-opt-{index+1}", "label": option}
            for index, option in enumerate(option_texts)
            if option
        ]
    
    def _parse_question(self, content: str, block: Dict) -> Optional[Dict]:
        """Parse a question block into quiz format."""
        text = self._clean_question_text(content)
        if not text:
            return None
        
        q_id = f"q-{self.question_counter}"
        self.question_counter += 1
        
        kind = self._detect_kind(text, block)
        question: Dict[str, Any] = {
            "_kind": kind,
            "id": q_id,
            "text": text,
            "score": 1,
        }
        
        options = self._extract_options(block)
        if options and kind in {"single_choice", "multiple_choice", "dropdown"}:
            question["options"] = options
            if kind == "multiple_choice":
                question["minSelections"] = 0
                question["maxSelections"] = len(options)
            if kind == "dropdown":
                question["mode"] = "single"
        elif kind == "single_choice":
            question["options"] = [
                {"id": f"{q_id}-opt-1", "label": "True"},
                {"id": f"{q_id}-opt-2", "label": "False"},
            ]
        
        attachments = self._extract_images(text)
        explanations = self._extract_explanations(block)
        if explanations:
            question["explanations"] = explanations
            if not attachments:
                attachments = self._extract_images("\n".join(explanations))
        if attachments:
            question["attachments"] = attachments
        
        return question
    
    def _extract_images(self, content: str) -> Optional[List[List[Dict]]]:
        """Extract images from markdown content.
        
        Only includes images that exist and can be resolved.
        Skips invalid or missing attachments to avoid schema validation errors.
        """
        # Pattern: ![alt](path)
        pattern = r'!\[([^\]]*)\]\(([^\)]+)\)'
        matches = re.findall(pattern, content)
        
        if not matches:
            return None
        
        attachment_list = []
        for alt_text, img_path in matches:
            try:
                # Skip if no assets base is configured
                if not ASSETS_BASE:
                    logger.debug(f"Skipping image attachment {img_path} - no assets base configured")
                    continue
                
                # Resolve the absolute path
                if img_path.startswith("./") or img_path.startswith("../"):
                    # Clean up relative paths
                    clean_path = re.sub(r'^(\.\./)+', '', img_path)
                    full_path = Path(ASSETS_BASE) / clean_path
                else:
                    full_path = Path(ASSETS_BASE) / img_path
                
                # Check if file exists
                if not full_path.exists():
                    logger.debug(f"Skipping image attachment {img_path} - file not found at {full_path}")
                    continue
                
                # Use relative path in URL instead of absolute path
                # This makes quiz files portable across machines
                try:
                    relative_path = full_path.relative_to(DEMO_BASE)
                    # Just use filename or a simple relative path
                    url_path = f"./assets/{full_path.name}"
                except ValueError:
                    # If DEMO_BASE is not in the path, use the filename
                    url_path = f"./assets/{full_path.name}"
                
                attachment = {
                    "id": f"att-{len(attachment_list)+1}",
                    "type": "image",
                    "url": url_path,
                    "alt": alt_text or full_path.name,
                }
                attachment_list.append(attachment)
                logger.debug(f"Added image attachment: {url_path}")
            
            except Exception as e:
                logger.warning(f"Failed to process image attachment {img_path}: {str(e)}")
                continue
        
        return [attachment_list] if attachment_list else None
    
    def generate_quiz_files(self):
        """Generate quiz JSON files in demo folder."""
        created_files = []
        
        for module, chapters in self.quizzes.items():
            module_display = self._format_module_name(module)
            module_dir = DEMO_BASE / module_display
            
            for chapter_key, chapter_data in chapters.items():
                chapter_title = chapter_data["title"]
                level = chapter_data["level"]
                questions = chapter_data["questions"]
                
                # Create chapter folder
                chapter_dir = module_dir / chapter_title
                chapter_dir.mkdir(parents=True, exist_ok=True)
                
                # Create quiz file
                quiz_file = chapter_dir / "sample1-quiz.json"
                
                quiz = {
                    "id": f"quiz-{module}-{chapter_key}-level-{level}",
                    "title": f"{module_display} - {chapter_title} - Level {level}",
                    "description": f"Quiz for {module_display} chapter {chapter_title} level {level}",
                    "questions": questions,
                }
                
                with open(quiz_file, "w", encoding="utf-8") as f:
                    json.dump(quiz, f, indent=2, ensure_ascii=False)
                
                created_files.append(str(quiz_file))
                print(f"   ✓ {quiz_file.relative_to(DEMO_BASE)}")
        
        return created_files
    
    def _format_module_name(self, module: str) -> str:
        """Format module name for folder (e.g., 'M15 Gass 2')."""
        # Handle special cases
        mapping = {
            "M1 Matematikk": "M1 Matematikk",
            "M2 Fysikk": "M2 Fysikk",
            "M3 Elektrolære": "M3 Elektrolære",
            "M4 Elektronikklære": "M4 Elektronikklære",
            "M5 Digitalteknikk": "M5 Digitalteknikk",
            "M6 Materiallære": "M6 Materiallære",
            "M7 Vedlikeholdsteknikk": "M7 Vedlikeholdsteknikk",
            "M8 Aerodynamikk": "M8 Aerodynamikk",
            "M9 Human Factors": "M9 Human Factors",
            "M10 Lover og bestemmelser": "M10 Lover og bestemmelser",
            "M11-12 Luftfartøylære": "M11-12 Luftfartøylære",
            "M12 Hass": "M12 Hass",
            "M13 Lass": "M13 Lass",
            "M14 Motorfremdrift": "M14 Motorfremdrift",
            "M15 Gass 2": "M15 GASS 2",
            "M16B1 Piston Engine": "M16B1 Piston Engine",
            "M17 Propeller": "M17 Propeller",
        }
        return mapping.get(module, module)


def main():
    """Main entry point."""
    pages_file = Path(__file__).parent / "pages_data.json"
    
    if not pages_file.exists():
        print(f"Error: {pages_file} not found.")
        print("Run fetch_pages.py first to fetch LogSeq pages.")
        return
    
    print(f"Loading pages from {pages_file.name}...")
    with open(pages_file, "r", encoding="utf-8") as f:
        pages_data = json.load(f)
    
    print(f"Loaded {len(pages_data)} pages.\n")
    
    parser = QuizParser(pages_data)
    parser.parse_all()
    
    print(f"\nGenerating quiz files in {DEMO_BASE.name}/ folder...")
    files = parser.generate_quiz_files()
    
    print(f"\n✓ Generated {len(files)} quiz files")


if __name__ == "__main__":
    main()
