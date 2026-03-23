<div align="center">

# 🖋️ InkDrop

### Universal Handwritten Signature Insertion for Any Document

**Draw it once. Drop it anywhere.**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-1a1a2e?style=flat-square&logo=python&logoColor=16c79a)](https://python.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-1a1a2e?style=flat-square&logoColor=16c79a)](LICENSE)
[![LLM Agnostic](https://img.shields.io/badge/LLM-agnostic-1a1a2e?style=flat-square&logo=openai&logoColor=16c79a)](#llm-support)
[![PDF](https://img.shields.io/badge/PDF-supported-0f3460?style=flat-square)](#formats)
[![DOCX](https://img.shields.io/badge/DOCX-supported-0f3460?style=flat-square)](#formats)
[![PPTX](https://img.shields.io/badge/PPTX-supported-0f3460?style=flat-square)](#formats)

---

<br>

*InkDrop takes a handwritten signature — drawn, scanned, or photographed — cleans it, and drops it into any PDF, Word document, or PowerPoint presentation. Just add the SKILL.md file, and drop it into any Model. Designed for Claude, Repurposed for everyone.*

<br>

</div>

---

## The Problem

You've got a contract, letter, or form that needs your signature. You could print it, sign it, scan it back. Or you could just **InkDrop it**.

InkDrop is a complete signature pipeline:

```
  Raw Signature          Clean PNG            Signed Document
  ┌─────────┐     ┌──────────────┐     ┌──────────────────┐
  │ 📷 Photo │     │              │     │  Dear Client,    │
  │ ✏️ iPad  │ ──▶ │  ✍️ Clean    │ ──▶ │  ...             │
  │ 🖊️ Scan  │     │  Transparent │     │  Signature: ✍️   │
  └─────────┘     └──────────────┘     └──────────────────┘
     INGEST          PROCESS              INSERT
```

---

## Quick Start

### Install

```bash
git clone https://github.com/BlackhatShiftey/inkdrop.git
cd inkdrop
pip install Pillow numpy pypdf reportlab python-docx python-pptx
```

### Use

```bash
# Step 1: Process your raw signature
python scripts/process_signature.py my_signature.png clean.png

# Step 2: Drop it into a document
python scripts/insert_pdf.py  contract.pdf clean.png signed.pdf  --find "Signature:"
python scripts/insert_docx.py letter.docx  clean.png signed.docx --find "Sign here"
python scripts/insert_pptx.py deck.pptx    clean.png signed.pptx --slide 5
```

That's it. Three lines, signed document.

---

## How It Works

### Stage 1 — Process

Takes any raw signature input and produces a clean, transparent PNG:

| What it does | Why |
|---|---|
| Removes white/light background | Transparent overlay on any document |
| Crops to ink bounding box | No wasted space |
| Smooths jagged edges | Professional appearance |
| Normalizes to standard size | Consistent placement (2" × 0.75" at 300dpi) |
| Optional ink recoloring | Match document style |

```bash
python scripts/process_signature.py raw.png clean.png \
    --width 600 --height 225 --threshold 200 --ink-color "#1a3c6e"
```

### Stage 2 — Locate

InkDrop finds *where* to place the signature using three strategies:

| Strategy | How | Example |
|---|---|---|
| **Keyword** | Searches document text | `--find "Signature:"` |
| **Coordinates** | Explicit position | `--x 100 --y 200 --page 0` |
| **Auto-detect** | Finds `_____` or `-----` patterns | Automatic fallback |
| **Default** | Bottom of last page/slide | No flags needed |

### Stage 3 — Insert

Merges the signature into the document as an embedded image. The output is a complete, self-contained file — no external references, no broken links.

---

<a name="formats"></a>
## Supported Formats

| Format | Engine | Keyword Search | Coordinates | Auto-detect |
|---|---|---|---|---|
| **PDF** | pypdf + reportlab | ✓ | ✓ (points) | ✓ |
| **DOCX** | python-docx | ✓ | ✓ (paragraph index) | ✓ |
| **PPTX** | python-pptx | ✓ | ✓ (inches) | ✓ |

---

<a name="llm-support"></a>
## LLM Support

InkDrop is **model-agnostic**. The Python engines work with any AI that can execute code. We ship dedicated integration guides:

| Model | Guide | Format |
|---|---|---|
| **Claude** (Anthropic) | [`SKILL.md`](SKILL.md) | Claude Skills format — auto-triggers in Claude.ai and Claude Code |
| **Gemini** (Google) | [`docs/GUIDE.md`](docs/GUIDE.md) | General-purpose — works with Gemini's code execution |
| **GPT** (OpenAI) | [`docs/GUIDE.md`](docs/GUIDE.md) | General-purpose — works with Code Interpreter |
| **Grok** (xAI) | [`docs/GUIDE.md`](docs/GUIDE.md) | General-purpose — works with Grok's code runner |
| **LLaMA / Mistral / Cohere** | [`docs/GUIDE.md`](docs/GUIDE.md) | General-purpose — any agent with shell access |

### For Claude Users

InkDrop ships as a **Claude Skill**. Install it and Claude will automatically recognize signature requests:

> *"Hey Claude, sign this contract with my signature"*
> *"InkDrop the NDA"*
> *"Add my sig to the last page"*

Claude reads `SKILL.md` and knows exactly which scripts to run.

### For All Other LLMs

The [`docs/GUIDE.md`](docs/GUIDE.md) provides:
- Complete Python API reference
- CLI examples for every format
- Agent tool/function schema (JSON) for framework integration
- Decision tree for automated workflows
- MCP server spec (coming soon)

---

## Python API

Every engine is importable:

```python
from scripts.process_signature import process_signature
from scripts.insert_pdf import insert_signature_pdf
from scripts.insert_docx import insert_signature_docx
from scripts.insert_pptx import insert_signature_pptx

# Process
result = process_signature("raw.png", "clean.png", threshold=200)

# Insert into PDF
result = insert_signature_pdf("contract.pdf", "clean.png", "signed.pdf", keyword="Signature:")

# Insert into DOCX with extras
result = insert_signature_docx(
    "letter.docx", "clean.png", "signed.docx",
    keyword="Signature:", add_line=True, add_name="Terra", add_date=True,
)

# Insert into PPTX
result = insert_signature_pptx("deck.pptx", "clean.png", "signed.pptx", slide_num=5)
```

---

## Interactive Dashboard

InkDrop includes a React-based signature management dashboard (`assets/signature-manager.jsx`) with:

- **Draw pad** — Dual-canvas system: white strokes for visibility on dark UI, dark ink for document export
- **Signature library** — Save and manage multiple signatures
- **Live preview** — See how your signature looks on a document thumbnail
- **One-click export** — Download clean PNG ready for insertion

### Launching the Dashboard

To run the React Dashboard locally without a build system or external artifacts:
1. Open the included `index.html` file in any modern web browser.
2. Alternatively, serve it via a local web server (e.g., `python -m http.server 8080` and navigate to `http://localhost:8080`).

The `index.html` file acts as a standalone wrapper that pulls in React via CDN and compiles the `assets/signature-manager.jsx` component directly in your browser.

---

## Project Structure

```
inkdrop/
├── README.md                    ← You are here
├── SKILL.md                     ← Claude-specific integration (Skills format)
├── LICENSE                      ← MIT
│
├── scripts/
│   ├── process_signature.py     ← Ingest → clean transparent PNG
│   ├── insert_pdf.py            ← PDF insertion engine
│   ├── insert_docx.py           ← DOCX insertion engine
│   └── insert_pptx.py           ← PPTX insertion engine
│
├── assets/
│   ├── signature-manager.jsx    ← Full React dashboard
│   └── signature-pad.jsx        ← Lightweight standalone canvas
│
├── tests/
│   └── test_pipeline.py         ← 5 end-to-end tests
│
└── docs/
    └── GUIDE.md                 ← General LLM integration guide
```

---

## Testing

```bash
python tests/test_pipeline.py
```

```
╔══════════════════════════════════════╗
║       InkDrop — Test Pipeline        ║
╚══════════════════════════════════════╝

  ✓ Process raw signature → clean PNG
  ✓ Insert signature into PDF (keyword)
  ✓ Insert signature into DOCX (keyword)
  ✓ Insert signature into PPTX (keyword)
  ✓ Recolor ink to custom color

══════════════════════════════════════
  Results: 5/5 passed
  Status:  ALL CLEAR ✓
══════════════════════════════════════
```

---

## Roadmap

- [ ] **MCP Server** — Wrap as Model Context Protocol server for direct tool-use
- [ ] **Batch signing** — Sign 100 documents in one command
- [ ] **HTML/Markdown** — Insert into web documents and markdown files
- [ ] **Signature verification** — Validate signature authenticity via hash
- [ ] **Multi-signature** — Place different signatures on different pages
- [ ] **Position learning** — Remember where signatures go for recurring document types

---

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/batch-signing`)
3. Commit your changes (`git commit -m 'feat: batch signing engine'`)
4. Push to the branch (`git push origin feature/batch-signing`)
5. Open a Pull Request

---

## License

MIT — Use freely. Commercial use welcome.

---

<div align="center">

**InkDrop** — by [BlackhatShiftey](https://github.com/BlackhatShiftey)

*Draw it once. Drop it anywhere.*

</div>
