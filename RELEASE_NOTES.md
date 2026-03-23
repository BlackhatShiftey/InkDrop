# Release Notes

---

## v1.0.0 — Initial Release
**March 23, 2025**

> *Draw it once. Drop it anywhere.*

---

### What is InkDrop?

InkDrop is a complete signature pipeline for the AI era.

You have a contract. It needs your signature. You shouldn't have to print it, sign it, scan it, and re-upload it in 2025. InkDrop eliminates that loop entirely — draw your signature once, and drop it into any document, from the command line or from any AI assistant that can run Python.

It was built natively for **Claude** with a first-class `SKILL.md` integration — tell Claude to sign something and it just works. Then we opened it up so every other model (GPT, Gemini, Grok, LLaMA, Mistral) can use the same engine via `docs/GUIDE.md`.

**Just add the SKILL.md file, and drop it into any Model. Designed for Claude, Repurposed for everyone.**

---

### What ships in v1.0

#### Signature Processing Engine
- Removes backgrounds (white, off-white, cream — anything light)
- Crops to the exact ink bounding box — no dead space
- Smooths jagged edges from scans or photos
- Normalizes to a standard 2" × 0.75" at 300dpi
- Optional ink recoloring to match document style (e.g. `#1a3c6e` for blue ink)

#### PDF Engine (`scripts/insert_pdf.py`)
- Keyword search — finds `"Signature:"` or any custom string in the document
- Auto-detects underline patterns (`_____`, `-----`, `.....`)
- Coordinate placement (`--x`, `--y`, `--page`) for precise control
- Default fallback: bottom-third of last page

#### DOCX Engine (`scripts/insert_docx.py`)
- Keyword search across all paragraphs
- Paragraph-index placement (`--after-paragraph N`)
- Optional signature line, printed name, and date insertion
- Default fallback: end of document

#### PPTX Engine (`scripts/insert_pptx.py`)
- Keyword search across all slides
- Slide + coordinate placement (`--slide N --x X --y Y` in inches)
- Default fallback: lower-left of last slide

#### React Signature Dashboard (`assets/signature-manager.jsx`)
- Draw pad with dual-canvas system: white strokes on dark UI, dark ink for export
- Signature library — save and switch between multiple signatures
- Live document preview thumbnail
- One-click PNG export, ready for immediate insertion

#### Claude Skill (`SKILL.md`)
- Auto-triggers on: *"sign this"*, *"add my signature"*, *"InkDrop it"*, *"stamp my sig"*
- Full decision tree: check for saved sig → process → locate → insert → deliver
- Compatible with Claude.ai, Claude Code, and API contexts with filesystem access

#### General LLM Guide (`docs/GUIDE.md`)
- Complete Python API reference
- CLI examples for every format and placement mode
- Agent tool/function JSON schema for framework integration
- Decision tree for fully automated signing workflows

#### CI (`/.github/workflows/ci.yml`)
- GitHub Actions pipeline across Python 3.10, 3.11, 3.12
- Installs all dependencies and runs the full test suite on every push

#### Tests (`tests/test_pipeline.py`)
- 5 end-to-end tests covering the full pipeline
- Process raw signature → clean PNG
- Insert into PDF via keyword
- Insert into DOCX via keyword
- Insert into PPTX via keyword
- Recolor ink to custom hex value

```
Results: 5/5 passed
Status:  ALL CLEAR ✓
```

---

### Dependencies

```bash
pip install Pillow numpy pypdf reportlab python-docx python-pptx
```

Python 3.8+. No API keys. No cloud. No subscriptions. Runs entirely local.

---

### Why v1.0 and not a beta?

Because the pipeline is complete end-to-end, all 5 tests pass across 3 Python versions, and the Claude integration is production-grade. There are features on the roadmap (MCP server, batch signing, HTML/Markdown support) — but what ships today is fully functional and ready to use.

---

### Roadmap (post-v1.0)

| Feature | Status |
|---|---|
| MCP Server — wrap InkDrop as a Model Context Protocol tool | Planned |
| Batch signing — sign 100 documents in one command | Planned |
| HTML / Markdown support | Planned |
| Signature verification via hash | Planned |
| Multi-signature — different sigs on different pages | Planned |
| Position learning — remember signature placement per document type | Planned |

---

### Get started

```bash
git clone https://github.com/BlackhatShiftey/InkDrop.git
cd InkDrop
pip install Pillow numpy pypdf reportlab python-docx python-pptx

python scripts/process_signature.py my_sig.png clean.png
python scripts/insert_pdf.py contract.pdf clean.png signed.pdf --find "Signature:"
```

Or just tell Claude:
> *"Sign this contract with my signature."*

---

**InkDrop** — by [BlackhatShiftey](https://github.com/BlackhatShiftey)

*Draw it once. Drop it anywhere.*
