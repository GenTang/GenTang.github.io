#!/usr/bin/env python3
"""Build the Chinese JSONL corpus used by the KGW Colab notebook."""

import json
import re
from pathlib import Path


HOME_PATH = Path(__file__).resolve().parent
# The published experiment uses the Chinese edition of the book as its source corpus.
BOOK_DIR = HOME_PATH.parents[3] / "en" / "books" / "deconstructing_LLM"
DATA_DIR = HOME_PATH.parent / "data"
CORPUS_OUTPUT = DATA_DIR / "kgw_corpus.jsonl"
SHOWCASE_OUTPUT = DATA_DIR / "kgw_showcase.jsonl"
MIN_CHARS = 300


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


def merge_paragraphs(paragraphs: list[str]) -> list[str]:
    """Merge adjacent paragraphs in source order into chunks of at least MIN_CHARS."""

    chunks, current, length = [], [], 0
    for paragraph in paragraphs:
        current.append(paragraph)
        length += len(re.sub(r"\s", "", paragraph))
        if length >= MIN_CHARS:
            chunks.append("\n\n".join(current))
            current, length = [], 0
    if current and chunks:
        chunks[-1] += "\n\n" + "\n\n".join(current)
    return chunks


def natural_key(path: Path) -> list[str | int]:
    """Sort numeric names naturally: chapter_2 comes before chapter_10."""

    return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", str(path))]


def main() -> None:
    # Root overview is stored separately; every other Markdown file enters the corpus.
    overview_path = BOOK_DIR / "overview.md"
    files = sorted(
        (path for path in BOOK_DIR.rglob("*.md") if path != overview_path),
        key=natural_key,
    )
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    paragraphs = [text for path in files for text in get_paragraphs(path)]
    content_id = 0
    with CORPUS_OUTPUT.open("w", encoding="utf-8") as output:
        for text in merge_paragraphs(paragraphs):
            content = {"id": content_id, "text": text}
            output.write(json.dumps(content, ensure_ascii=False) + "\n")
            content_id += 1
    showcase = {"id": 0, "text": markdown_clean(overview_path.read_text(encoding="utf-8"))}
    SHOWCASE_OUTPUT.write_text(json.dumps(showcase, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
