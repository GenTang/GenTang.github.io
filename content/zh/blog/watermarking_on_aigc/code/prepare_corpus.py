#!/usr/bin/env python3
"""Build the local JSONL corpus used by the KGW Colab notebook."""

import json
import re
from pathlib import Path


HOME_PATH = Path(__file__).resolve().parent
BOOK_DIR = HOME_PATH.parent.parent.parent / "books" / "deconstructing_LLM"
DATA_DIR = HOME_PATH.parent / "data"
CORPUS_OUTPUT = DATA_DIR / "kgw_corpus.jsonl"
SHOWCASE_OUTPUT = DATA_DIR / "kgw_showcase.jsonl"


def markdown_clean(markdown: str) -> str:
    """Remove code blocks, display math, and image markup."""

    # Remove fenced code blocks such as ```python ... ``` or ~~~ ... ~~~.
    markdown = re.sub(r"(?ms)^[ \t]*(```|~~~)[^\n]*\n.*?^[ \t]*\1[ \t]*$", "", markdown)
    # Remove standalone display-math blocks enclosed by $$ ... $$.
    markdown = re.sub(r"(?ms)^[ \t]*\$\$.*?\$\$[ \t]*$", "", markdown)
    # Remove Markdown images: ![description](url) and ![description][reference].
    markdown = re.sub(r"!\[[^]]*\]\([^)]*\)|!\[[^]]*\]\[[^]]*\]", "", markdown)
    # Remove HTML <img> tags, then trim the document's outer whitespace.
    return re.sub(r"(?is)<img\b[^>]*>", "", markdown).strip()


def get_paragraphs(path: Path) -> list[str]:
    """Return cleaned paragraphs containing at least 20 non-whitespace characters."""

    # One or more blank lines form a paragraph boundary.
    parts = re.split(r"\n\s*\n+", markdown_clean(path.read_text(encoding="utf-8")))
    # Ignore empty, heading-only, and other very short paragraphs.
    return [text.strip() for text in parts if len(re.sub(r"\s", "", text)) >= 20]


def main() -> None:
    # Root overview is stored separately; every other Markdown file enters the corpus.
    overview_path = BOOK_DIR / "overview.md"
    files = sorted(path for path in BOOK_DIR.rglob("*.md") if path != overview_path)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    content_id = 0
    with CORPUS_OUTPUT.open("w", encoding="utf-8") as output:
        for path in files:
            for text in get_paragraphs(path):
                content = {"id": content_id, "text": text}
                output.write(json.dumps(content, ensure_ascii=False) + "\n")
                content_id += 1
    showcase = {"id": 0, "text": markdown_clean(overview_path.read_text(encoding="utf-8"))}
    SHOWCASE_OUTPUT.write_text(json.dumps(showcase, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
