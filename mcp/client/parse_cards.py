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
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

ASSETS_BASE = "/home/grime/Documents/SKEDSMO/assets"
DEMO_BASE = Path(__file__).parent.parent.parent / "demo"


class QuizParser:
    """Parse LogSeq content into quiz JSON format."""
    
    def __init__(self, pages_data: Dict[str, Any]):
        self.pages_data = pages_data
        self.quizzes = {}
    
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
            
            # Skip empty or property-only blocks
            if not content or "::" in content and not content.startswith("?"):
                continue
            
            # Skip resource links
            if content.startswith("book::") or ".pdf" in content:
                continue
            
            # Check if question-like (contains #card tag or question patterns)
            if "#card" in content or "?" in content:
                question = self._parse_question(content, block)
                if question:
                    questions.append(question)
            
            # Recurse into children
            child_questions = self._extract_questions(block.get("children", []))
            questions.extend(child_questions)
        
        return questions
    
    def _parse_question(self, content: str, block: Dict) -> Optional[Dict]:
        """Parse a question block into quiz format."""
        # Remove #card tag if present
        text = content.replace("#card", "").strip()
        
        if not text:
            return None
        
        # Generate ID
        q_id = f"q-{len([q for qs in self.quizzes.values() for q in qs.get('questions', [])])}"
        
        # Extract explanations from child blocks
        explanations = self._extract_explanations(block.get("children", []))
        
        # Detect question type based on content
        question_type = self._detect_question_type(text, block)
        
        # Parse based on type
        if question_type == "multiple_choice":
            question = self._parse_multiple_choice(q_id, text, block)
        elif question_type == "short_text":
            question = self._parse_short_text(q_id, text, block)
        elif question_type == "long_text":
            question = self._parse_long_text(q_id, text, block)
        elif question_type == "fill_gaps":
            question = self._parse_fill_gaps(q_id, text, block)
        else:
            # Default to single_choice
            question = self._parse_single_choice(q_id, text, block)
        
        # Add explanations if present
        if explanations and question:
            question["explanations"] = explanations
        
        # Extract images if present
        attachments = self._extract_images(text)
        if attachments and question:
            question["attachments"] = attachments
        
        return question
    
    def _extract_explanations(self, blocks: List[Dict]) -> Optional[List[str]]:
        """Extract explanation text from child blocks."""
        explanations = []
        
        for block in blocks:
            content = block.get("content", "").strip()
            
            # Skip empty, property-only, and #card blocks
            if not content or ("::" in content and not content.startswith("?")) or "#card" in content:
                continue
            
            # Skip resource links
            if content.startswith("book::") or ".pdf" in content:
                continue
            
            explanations.append(content)
            
            # Recurse into child blocks
            child_explanations = self._extract_explanations(block.get("children", []))
            if child_explanations:
                explanations.extend(child_explanations)
        
        return explanations if explanations else None
    
    def _detect_question_type(self, text: str, block: Dict) -> str:
        """Detect question type from content and structure."""
        text_lower = text.lower()
        
        # Multiple choice: contains options like "A)", "B)", "1)", "2)"
        if re.search(r'(^|\n)\s*([A-Z]|\d)\)', text):
            return "multiple_choice"
        
        # Fill gaps: contains blanks like "___" or "....."
        if "___" in text or "...." in text:
            return "fill_gaps"
        
        # Long text: ends with question mark and is relatively long, or has "explain", "describe"
        if any(word in text_lower for word in ["explain", "describe", "discuss", "elaborate"]):
            return "long_text"
        
        # Short text: simple question without options
        if "?" in text and not any(word in text_lower for word in ["true", "false", "explain", "describe"]):
            return "short_text"
        
        return "single_choice"
    
    def _parse_single_choice(self, q_id: str, text: str, block: Dict) -> Dict:
        """Parse as single choice (True/False or similar)."""
        return {
            "_kind": "single_choice",
            "id": q_id,
            "text": text,
            "score": 1,
            "options": [
                {"id": f"{q_id}-opt-1", "label": "True"},
                {"id": f"{q_id}-opt-2", "label": "False"},
            ],
        }
    
    def _parse_multiple_choice(self, q_id: str, text: str, block: Dict) -> Dict:
        """Parse as multiple choice with lettered/numbered options."""
        # Extract options
        option_pattern = r'(^|\n)\s*([A-Z]|\d)\)\s*(.+?)(?=(?:\n[A-Z]\)|$))'
        matches = re.findall(option_pattern, text, re.MULTILINE | re.DOTALL)
        
        options = []
        for idx, (_, label_marker, content) in enumerate(matches):
            options.append({
                "id": f"{q_id}-opt-{idx+1}",
                "label": content.strip(),
            })
        
        if not options:
            # Fallback to single choice if no options found
            return self._parse_single_choice(q_id, text, block)
        
        return {
            "_kind": "multiple_choice",
            "id": q_id,
            "text": re.sub(option_pattern, '', text).strip(),
            "score": 1,
            "options": options,
            "minSelections": 0,
            "maxSelections": len(options),
        }
    
    def _parse_short_text(self, q_id: str, text: str, block: Dict) -> Dict:
        """Parse as short text input."""
        return {
            "_kind": "short_text",
            "id": q_id,
            "text": text,
            "score": 1,
            "placeholder": "Enter answer here",
            "maxLength": 200,
        }
    
    def _parse_long_text(self, q_id: str, text: str, block: Dict) -> Dict:
        """Parse as long text input."""
        return {
            "_kind": "long_text",
            "id": q_id,
            "text": text,
            "score": 1,
            "placeholder": "Provide a detailed answer here",
            "minLength": 10,
            "maxLength": 5000,
            "rows": 5,
        }
    
    def _parse_fill_gaps(self, q_id: str, text: str, block: Dict) -> Dict:
        """Parse as fill gaps (blanks to fill)."""
        # Split on blanks (___) or (....)
        parts = re.split(r'(_{3,}|\.*{4,})', text)
        
        json_parts = []
        gap_count = 0
        
        for part in parts:
            if re.match(r'_{3,}|\.*{4,}', part):
                # This is a gap
                gap_count += 1
                json_parts.append({
                    "_kind": "text_gap",
                    "gapId": f"{q_id}-gap-{gap_count}",
                    "placeholder": "Fill in",
                })
            elif part.strip():
                # This is text
                json_parts.append({
                    "_kind": "text",
                    "content": part,
                })
        
        if gap_count == 0:
            # No gaps found, return as short text
            return self._parse_short_text(q_id, text, block)
        
        return {
            "_kind": "fill_gaps",
            "id": q_id,
            "text": text,
            "score": 1,
            "parts": json_parts,
        }
    
    def _extract_images(self, content: str) -> Optional[List[List[Dict]]]:
        """Extract images from markdown content."""
        # Pattern: ![alt](path)
        pattern = r'!\[([^\]]*)\]\(([^\)]+)\)'
        matches = re.findall(pattern, content)
        
        if not matches:
            return None
        
        attachment_list = []
        for alt_text, img_path in matches:
            # Convert relative to absolute path
            if img_path.startswith("./") or img_path.startswith("../"):
                # Remove ./ or ../
                clean_path = re.sub(r'^(\.\./)+', '', img_path)
                abs_path = f"{ASSETS_BASE}/{clean_path}"
            else:
                abs_path = img_path if img_path.startswith("/") else f"{ASSETS_BASE}/{img_path}"
            
            attachment = {
                "id": f"att-{len(attachment_list)+1}",
                "type": "image",
                "url": abs_path,
                "alt": alt_text or Path(img_path).name,
            }
            attachment_list.append(attachment)
        
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
    pages_file = Path(__file__).parent.parent.parent / "pages_data.json"
    
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
