# InkDrop — General LLM Integration Guide

> Universal handwritten signature insertion for any document format.
> This guide is for **any LLM** with code execution capabilities: Gemini, GPT, Grok, LLaMA, Mistral, Cohere, or any agent framework.

---

## What is InkDrop?

InkDrop is a set of Python scripts that let any AI assistant:
1. **Process** a raw handwritten signature (photo, scan, digital drawing) into a clean transparent PNG
2. **Insert** that signature into PDF, DOCX, or PPTX documents
3. **Locate** where to place it — by keyword search, coordinates, or smart defaults

No API keys. No cloud services. Just Python scripts with standard libraries.

---

## Requirements

```bash
pip install Pillow numpy pypdf reportlab python-docx python-pptx
```

> **Note for sandboxed environments**: Add `--break-system-packages` if pip complains about externally managed environments.

---

## The 3-Step Pipeline

### Step 1 — Process the Signature

Clean a raw signature image into a document-ready transparent PNG:

```python
# Python API
from scripts.process_signature import process_signature

result = process_signature(
    input_path="raw_signature.png",
    output_path="clean_signature.png",
    width=600,        # Target width in pixels (~2 inches at 300dpi)
    height=225,       # Target height in pixels (~0.75 inches at 300dpi)
    threshold=200,    # Background removal (0-255, higher = more aggressive)
    ink_color=None,   # Optional: recolor ink, e.g. "#000000"
)
# Returns: { original_size, final_size, ink_coverage_percent, output }
```

```bash
# CLI
python scripts/process_signature.py raw.png clean.png --threshold 200
```

**What it does:**
- Removes white/light background → transparent
- Crops to ink bounding box
- Smooths jagged edges
- Centers in normalized bounding box
- Optionally recolors ink

### Step 2 — Choose Your Target Format

#### PDF
```python
from scripts.insert_pdf import insert_signature_pdf

result = insert_signature_pdf(
    pdf_path="contract.pdf",
    sig_path="clean_signature.png",
    output_path="signed_contract.pdf",
    keyword="Signature:",       # Finds this text, places sig nearby
    # OR: x=100, y=200, page=0  # Explicit coordinates (PDF points)
    sig_width=150,              # Width in PDF points (~2 inches)
    sig_height=56,              # Height in PDF points (~0.75 inches)
)
```

```bash
# CLI
python scripts/insert_pdf.py contract.pdf sig.png signed.pdf --find "Signature:"
python scripts/insert_pdf.py contract.pdf sig.png signed.pdf --x 100 --y 200 --page 0
```

#### DOCX (Word)
```python
from scripts.insert_docx import insert_signature_docx

result = insert_signature_docx(
    docx_path="letter.docx",
    sig_path="clean_signature.png",
    output_path="signed_letter.docx",
    keyword="Signature:",           # Finds this text
    # OR: after_paragraph=12        # Insert after paragraph index
    # OR: end=True                  # Append to end
    sig_width_inches=2.0,
    add_line=True,                  # Adds ________ line below
    add_name="John Doe",            # Adds printed name
    add_date=True,                  # Adds current date
)
```

```bash
# CLI
python scripts/insert_docx.py letter.docx sig.png signed.docx --find "Signature:" --line --date
```

#### PPTX (PowerPoint)
```python
from scripts.insert_pptx import insert_signature_pptx

result = insert_signature_pptx(
    pptx_path="deck.pptx",
    sig_path="clean_signature.png",
    output_path="signed_deck.pptx",
    keyword="Signature:",           # Finds this text on any slide
    # OR: slide_num=3, x_inches=2, y_inches=6
    sig_width_inches=2.0,
)
```

```bash
# CLI
python scripts/insert_pptx.py deck.pptx sig.png signed.pptx --slide 3 --x 2 --y 6
```

### Step 3 — Deliver

The output file is a complete, self-contained document with the signature embedded. No external references or dependencies.

---

## Placement Strategies

| Strategy | Flag/Param | How it Works |
|----------|-----------|--------------|
| **Keyword** | `--find "text"` / `keyword=` | Searches document text for the string. Also auto-detects `_____`, `.....`, `-----` patterns. |
| **Coordinates** | `--x --y --page` | Explicit position. PDF uses points (72pt = 1in), PPTX uses inches. |
| **Paragraph** | `--after-paragraph N` | DOCX only — inserts after the Nth paragraph. |
| **Default** | (none) | PDF: bottom-third of last page. DOCX: end of doc. PPTX: last slide, lower-left. |

---

## Agent Framework Integration

### As a Tool/Function

Define InkDrop as a tool in your agent's tool registry:

```json
{
    "name": "inkdrop_sign",
    "description": "Insert a handwritten signature into a document (PDF, DOCX, or PPTX). Requires a processed signature PNG and a target document.",
    "parameters": {
        "document_path": { "type": "string", "description": "Path to the document to sign" },
        "signature_path": { "type": "string", "description": "Path to the clean signature PNG" },
        "output_path": { "type": "string", "description": "Path for the signed output" },
        "keyword": { "type": "string", "description": "Text to search for signature placement (optional)" },
        "format": { "type": "string", "enum": ["pdf", "docx", "pptx"], "description": "Document format" }
    }
}
```

### As an MCP Server (coming soon)

InkDrop can be wrapped as an MCP server for direct integration with Claude, Cursor, Windsurf, and other MCP-compatible clients.

---

## LLM Decision Tree

When a user asks to sign a document, follow this logic:

```
1. Is there a signature image available?
   ├── YES → Proceed to processing
   └── NO  → Ask user to provide one (photo, scan, or digital drawing)

2. Is the signature already processed (transparent PNG)?
   ├── YES → Skip to insertion
   └── NO  → Run process_signature.py

3. What format is the document?
   ├── .pdf  → insert_pdf.py
   ├── .docx → insert_docx.py
   ├── .pptx → insert_pptx.py
   └── Other → Convert to supported format first, then insert

4. Where should the signature go?
   ├── User specified location → Use coordinates/keyword
   ├── Document has "Signature:" or underline → Auto-detect
   └── Neither → Use format-appropriate default position

5. Deliver the signed document to the user.
```

---

## Testing

```bash
python tests/test_pipeline.py
```

Runs 5 end-to-end tests:
1. Process raw signature → clean PNG
2. Insert into PDF (keyword search)
3. Insert into DOCX (keyword search)
4. Insert into PPTX (keyword search)
5. Ink recoloring

Expected: 5/5 pass.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: PIL` | `pip install Pillow numpy` |
| `ModuleNotFoundError: pypdf` | `pip install pypdf reportlab` |
| `ModuleNotFoundError: docx` | `pip install python-docx` (not `docx`) |
| `ModuleNotFoundError: pptx` | `pip install python-pptx` |
| Signature invisible on dark docs | Use `--ink-color "#FFFFFF"` to recolor white |
| Keyword not found | Try broader search term, or use coordinate placement |
| Signature too large/small | Adjust `--width` and `--height` parameters |

---

## License

MIT — Use freely in any project, commercial or otherwise.
