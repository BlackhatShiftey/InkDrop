---
name: inkdrop
description: "Universal handwritten signature insertion tool. Use this skill whenever the user wants to: add a signature to any document (PDF, DOCX, PPTX), draw or capture a handwritten signature, process a raw signature image (clean background, crop, normalize), manage multiple saved signatures, sign contracts/letters/agreements/forms, or batch-sign multiple documents. Trigger on: 'sign this', 'add my signature', 'drop my signature', 'InkDrop it', 'stamp my sig', any mention of signing documents, or any uploaded signature image paired with a document. Also trigger when creating documents that include a signature line — InkDrop can fill it automatically."
---

# InkDrop — Claude Integration Guide

> Universal signature insertion for any document format.
> This file is specifically for **Claude** (Anthropic) running in Claude.ai, Claude Code, or API contexts with filesystem access.

## Architecture

```
inkdrop/
├── SKILL.md              ← You are here (Claude-specific)
├── GUIDE.md              ← General LLM instructions (Gemini, GPT, Grok, etc.)
├── README.md             ← Human-facing documentation
├── scripts/
│   ├── process_signature.py   — Clean, crop, transparentize raw signatures
│   ├── insert_pdf.py          — PDF signature insertion engine
│   ├── insert_docx.py         — DOCX signature insertion engine
│   └── insert_pptx.py         — PPTX signature insertion engine
├── assets/
│   ├── signature-manager.jsx  — React dashboard for drawing/managing signatures
│   └── signature-pad.jsx      — Lightweight standalone canvas widget
├── tests/
│   └── test_pipeline.py       — End-to-end validation (5 tests)
└── docs/
    └── GUIDE.md               — General-purpose LLM guide
```

## Quick Start — The 3-Step Pipeline

### Step 1: Ingest
Accept the user's signature. It can arrive as:
- An uploaded image (PNG, JPG, photo of paper, iPad sketch)
- A signature drawn in the `signature-manager.jsx` or `signature-pad.jsx` artifact
- A previously saved signature in `assets/signatures/`

If no signature exists yet, present `assets/signature-manager.jsx` as an artifact so the user can draw one.

### Step 2: Process
Clean the raw signature into a document-ready transparent PNG:

```bash
python scripts/process_signature.py raw_sig.png clean_sig.png \
    --width 600 --height 225 --threshold 200
```

**Parameters:**
| Flag | Default | Description |
|------|---------|-------------|
| `--width` | 600 | Target width in px (≈2" at 300dpi) |
| `--height` | 225 | Target height in px (≈0.75" at 300dpi) |
| `--threshold` | 200 | BG removal aggressiveness (0-255, higher = more) |
| `--ink-color` | none | Recolor ink to hex, e.g. `#000000` or `#1a3c6e` |

### Step 3: Insert
Drop the clean signature into the target document:

**PDF:**
```bash
python scripts/insert_pdf.py document.pdf clean_sig.png signed.pdf --find "Signature:"
```

**DOCX:**
```bash
python scripts/insert_docx.py document.docx clean_sig.png signed.docx --find "Signature:"
```

**PPTX:**
```bash
python scripts/insert_pptx.py deck.pptx clean_sig.png signed.pptx --find "Signature:"
```

## Placement Modes

All insertion engines support three placement strategies:

1. **Keyword search** (`--find "text"`) — Scans document for the keyword, places signature nearby. Supports regex patterns. Also auto-detects `_____`, `.....`, `-----` underline patterns.

2. **Coordinate placement** — Explicit position:
   - PDF: `--x 100 --y 200 --page 0` (points, bottom-left origin)
   - DOCX: `--after-paragraph 12`
   - PPTX: `--slide 3 --x 2 --y 6` (inches)

3. **Default** — If no placement specified:
   - PDF: bottom-third of last page, left-aligned
   - DOCX: end of document
   - PPTX: last slide, lower-left

## Claude-Specific Workflow

When a user asks to sign a document, follow this decision tree:

```
User has signature on file?
├── YES → Use saved signature from assets/signatures/
└── NO  → Present signature-manager.jsx artifact
          └── User draws → export as PNG → save to assets/signatures/

Document format?
├── PDF  → scripts/insert_pdf.py
├── DOCX → scripts/insert_docx.py
├── PPTX → scripts/insert_pptx.py
└── Other → Convert to supported format first

Placement specified?
├── Keyword given → --find "keyword"
├── Position given → use coordinates
└── Nothing given → auto-detect signature lines, fall back to default
```

## Dependencies

Install before first use:
```bash
pip install Pillow numpy pypdf reportlab python-docx python-pptx --break-system-packages
```

## Testing

Run the full validation suite:
```bash
cd inkdrop && python tests/test_pipeline.py
```
Expected: 5/5 pass.

## Integration with Other Skills

InkDrop works alongside existing document skills:
- **docx skill**: Create the document with docx skill, then InkDrop the signature
- **pdf skill**: Generate or fill a PDF, then InkDrop signs it
- **pptx skill**: Build the deck, then InkDrop stamps the final slide

The pipeline is: **create document → process signature → insert signature → deliver**.
