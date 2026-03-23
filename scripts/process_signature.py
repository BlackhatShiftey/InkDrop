#!/usr/bin/env python3
"""
InkDrop — Signature Processing Engine
Cleans a raw handwritten signature image: removes background, crops whitespace,
normalizes to a standard bounding box, and outputs a clean PNG with alpha channel.

Usage:
    python process_signature.py input.png output.png [--width 600] [--height 225] [--threshold 200]
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps
    import numpy as np
except ImportError:
    print("ERROR: Pillow and numpy are required.")
    print("  pip install Pillow numpy --break-system-packages")
    sys.exit(1)


def remove_background(img: Image.Image, threshold: int = 200) -> Image.Image:
    """Convert near-white pixels to transparent, keep dark ink."""
    rgba = img.convert("RGBA")
    data = np.array(rgba)

    # Pixels where R, G, B are all above threshold → transparent
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    data[white_mask] = [0, 0, 0, 0]

    return Image.fromarray(data)


def crop_to_ink(img: Image.Image, padding: int = 10) -> Image.Image:
    """Crop to the bounding box of non-transparent pixels with optional padding."""
    data = np.array(img)
    alpha = data[:, :, 3]

    # Find rows/cols with any non-transparent pixels
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)

    if not rows.any() or not cols.any():
        return img  # No ink found, return as-is

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    # Apply padding (clamped to image bounds)
    h, w = data.shape[:2]
    rmin = max(0, rmin - padding)
    rmax = min(h - 1, rmax + padding)
    cmin = max(0, cmin - padding)
    cmax = min(w - 1, cmax + padding)

    return img.crop((cmin, rmin, cmax + 1, rmax + 1))


def normalize_size(img: Image.Image, width: int = 600, height: int = 225) -> Image.Image:
    """Resize signature to fit within target bounding box, preserving aspect ratio."""
    img.thumbnail((width, height), Image.LANCZOS)

    # Center on a transparent canvas of exact target size
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - img.width) // 2
    y = (height - img.height) // 2
    canvas.paste(img, (x, y), img)

    return canvas


def smooth_ink(img: Image.Image) -> Image.Image:
    """Apply slight smoothing to reduce jagged edges from threshold."""
    # Split channels, smooth alpha only
    r, g, b, a = img.split()
    a = a.filter(ImageFilter.SMOOTH)
    return Image.merge("RGBA", (r, g, b, a))


def process_signature(
    input_path: str,
    output_path: str,
    width: int = 600,
    height: int = 225,
    threshold: int = 200,
    ink_color: str = None,
) -> dict:
    """
    Full processing pipeline for a raw signature image.

    Args:
        input_path:  Path to raw signature (PNG, JPG, photo, iPad sketch, etc.)
        output_path: Path for cleaned output PNG (always RGBA PNG)
        width:       Target bounding box width in pixels (default 600 ≈ 2" at 300dpi)
        height:      Target bounding box height in pixels (default 225 ≈ 0.75" at 300dpi)
        threshold:   Background removal threshold 0-255 (higher = more aggressive)
        ink_color:   Optional hex color to recolor ink (e.g., "#000000", "#1a3c6e")

    Returns:
        dict with metadata: original_size, final_size, ink_coverage_percent
    """
    img = Image.open(input_path)
    original_size = img.size

    # Pipeline: remove bg → crop → smooth → normalize
    img = remove_background(img, threshold)
    img = crop_to_ink(img)
    img = smooth_ink(img)
    img = normalize_size(img, width, height)

    # Optional: recolor ink
    if ink_color:
        ink_color = ink_color.lstrip("#")
        r_new = int(ink_color[0:2], 16)
        g_new = int(ink_color[2:4], 16)
        b_new = int(ink_color[4:6], 16)
        data = np.array(img)
        # Only recolor non-transparent pixels
        mask = data[:, :, 3] > 0
        data[mask, 0] = r_new
        data[mask, 1] = g_new
        data[mask, 2] = b_new
        img = Image.fromarray(data)

    # Calculate ink coverage
    alpha = np.array(img)[:, :, 3]
    ink_coverage = (alpha > 0).sum() / alpha.size * 100

    img.save(output_path, "PNG")

    return {
        "original_size": original_size,
        "final_size": img.size,
        "ink_coverage_percent": round(ink_coverage, 2),
        "output": output_path,
    }


def main():
    parser = argparse.ArgumentParser(
        description="InkDrop — Process a raw signature image into a clean, transparent PNG."
    )
    parser.add_argument("input", help="Path to raw signature image")
    parser.add_argument("output", help="Output path for cleaned PNG")
    parser.add_argument("--width", type=int, default=600, help="Target width (default: 600)")
    parser.add_argument("--height", type=int, default=225, help="Target height (default: 225)")
    parser.add_argument("--threshold", type=int, default=200, help="BG removal threshold 0-255 (default: 200)")
    parser.add_argument("--ink-color", type=str, default=None, help="Recolor ink to hex (e.g., #000000)")

    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"ERROR: Input file not found: {args.input}")
        sys.exit(1)

    result = process_signature(
        args.input, args.output,
        width=args.width, height=args.height,
        threshold=args.threshold, ink_color=args.ink_color,
    )

    print(f"✓ InkDrop processed: {result['original_size']} → {result['final_size']}")
    print(f"  Ink coverage: {result['ink_coverage_percent']}%")
    print(f"  Output: {result['output']}")


if __name__ == "__main__":
    main()
