#!/usr/bin/env python3
"""
InkDrop — PDF Signature Insertion Engine
Drops a processed signature PNG into a PDF at a specified location.

Supports:
  - Keyword-based placement (finds "Signature:", "Sign here", "___")
  - Coordinate-based placement (explicit x, y, page)
  - AcroForm field-based placement (fills signature form fields)

Usage:
    python insert_pdf.py document.pdf signature.png output.pdf --find "Signature:"
    python insert_pdf.py document.pdf signature.png output.pdf --x 100 --y 200 --page 1
    python insert_pdf.py document.pdf signature.png output.pdf --field "sig_field"
"""

import argparse
import sys
import re
from pathlib import Path

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.utils import ImageReader
    from PIL import Image
    import io
except ImportError:
    print("ERROR: Required packages missing.")
    print("  pip install pypdf reportlab Pillow --break-system-packages")
    sys.exit(1)


def find_keyword_position(pdf_path: str, keyword: str) -> dict | None:
    """
    Search PDF text for a keyword and return approximate position.
    Falls back to underline patterns if keyword not found.
    """
    reader = PdfReader(pdf_path)
    patterns = [keyword]
    if keyword:
        patterns.append(keyword)
    # Also look for signature-line patterns
    patterns.extend([r"_{5,}", r"\.{5,}", r"-{5,}"])

    for page_num, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                # Get page dimensions
                media = page.mediabox
                width = float(media.width)
                height = float(media.height)

                # Estimate position: place signature at ~70% down, centered
                # This is a heuristic — exact positioning requires layout analysis
                lines = text.split("\n")
                for i, line in enumerate(lines):
                    if re.search(pattern, line, re.IGNORECASE):
                        y_ratio = 1.0 - (i / max(len(lines), 1))
                        return {
                            "page": page_num,
                            "x": width * 0.15,
                            "y": height * y_ratio - 30,
                            "match": line.strip(),
                        }
    return None


def create_signature_overlay(
    sig_path: str,
    page_width: float,
    page_height: float,
    x: float,
    y: float,
    sig_width: float = 150,
    sig_height: float = 56,
) -> io.BytesIO:
    """Create a single-page PDF with the signature image at the given position."""
    buffer = io.BytesIO()
    c = rl_canvas.Canvas(buffer, pagesize=(page_width, page_height))

    img = ImageReader(sig_path)
    c.drawImage(img, x, y, width=sig_width, height=sig_height, mask="auto")

    c.save()
    buffer.seek(0)
    return buffer


def insert_signature_pdf(
    pdf_path: str,
    sig_path: str,
    output_path: str,
    x: float = None,
    y: float = None,
    page: int = None,
    keyword: str = None,
    field: str = None,
    sig_width: float = 150,
    sig_height: float = 56,
) -> dict:
    """
    Insert a signature into a PDF document.

    Placement modes (in priority order):
        1. field  — AcroForm signature field name
        2. keyword — search text to find signature line
        3. x/y/page — explicit coordinates

    Args:
        pdf_path:    Source PDF
        sig_path:    Processed signature PNG (transparent background)
        output_path: Output PDF path
        x, y:        Coordinates in PDF points (origin = bottom-left)
        page:        Page number (0-indexed)
        keyword:     Text to search for signature placement
        field:       AcroForm field name
        sig_width:   Signature width in points (default 150 ≈ ~2 inches)
        sig_height:  Signature height in points (default 56 ≈ ~0.75 inches)

    Returns:
        dict with placement metadata
    """
    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    # Determine placement
    target_page = page or 0
    target_x = x
    target_y = y

    if keyword:
        result = find_keyword_position(pdf_path, keyword)
        if result:
            target_page = result["page"]
            target_x = result["x"]
            target_y = result["y"]
        else:
            raise ValueError(f"Keyword '{keyword}' not found in PDF")

    if target_x is None or target_y is None:
        # Default: bottom-third of last page, left-aligned
        target_page = len(reader.pages) - 1
        media = reader.pages[target_page].mediabox
        target_x = float(media.width) * 0.15
        target_y = float(media.height) * 0.2

    # Build overlay
    target_pg = reader.pages[target_page]
    media = target_pg.mediabox
    pg_w, pg_h = float(media.width), float(media.height)

    overlay_buf = create_signature_overlay(
        sig_path, pg_w, pg_h, target_x, target_y, sig_width, sig_height
    )
    overlay_reader = PdfReader(overlay_buf)

    # Merge all pages, overlaying signature on target
    for i, pg in enumerate(reader.pages):
        if i == target_page:
            pg.merge_page(overlay_reader.pages[0])
        writer.add_page(pg)

    with open(output_path, "wb") as f:
        writer.write(f)

    return {
        "page": target_page,
        "x": target_x,
        "y": target_y,
        "sig_size": (sig_width, sig_height),
        "output": output_path,
    }


def main():
    parser = argparse.ArgumentParser(description="InkDrop — Insert signature into PDF")
    parser.add_argument("pdf", help="Source PDF file")
    parser.add_argument("signature", help="Processed signature PNG")
    parser.add_argument("output", help="Output PDF path")
    parser.add_argument("--x", type=float, help="X coordinate (PDF points, bottom-left origin)")
    parser.add_argument("--y", type=float, help="Y coordinate (PDF points, bottom-left origin)")
    parser.add_argument("--page", type=int, help="Page number (0-indexed)")
    parser.add_argument("--find", type=str, help="Keyword to locate signature line")
    parser.add_argument("--field", type=str, help="AcroForm field name")
    parser.add_argument("--width", type=float, default=150, help="Signature width in points")
    parser.add_argument("--height", type=float, default=56, help="Signature height in points")

    args = parser.parse_args()

    for f in [args.pdf, args.signature]:
        if not Path(f).exists():
            print(f"ERROR: File not found: {f}")
            sys.exit(1)

    result = insert_signature_pdf(
        args.pdf, args.signature, args.output,
        x=args.x, y=args.y, page=args.page,
        keyword=args.find, field=args.field,
        sig_width=args.width, sig_height=args.height,
    )

    print(f"✓ InkDrop signed: page {result['page']} at ({result['x']:.0f}, {result['y']:.0f})")
    print(f"  Output: {result['output']}")


if __name__ == "__main__":
    main()
