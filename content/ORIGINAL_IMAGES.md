# Original image archive

The website uses high-quality WebP versions of the book and home-page images.
The corresponding source PNG/JPEG files are preserved under `originals/` directories:

- Chapter figures: `content/{zh,en}/books/deconstructing_LLM/chapter_*/images/originals/`
- Book covers and overview diagrams: `content/{zh,en}/books/deconstructing_LLM/originals/`
- Shared home-page assets: `content/originals/`

Files in these directories are archival sources and are not copied into the static site output.
Regenerate delivery images from the originals rather than editing the WebP files in place.
