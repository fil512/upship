#!/bin/bash
# Convert a captured map image to a 4-page printable PDF (2x2 grid)
# Usage: ./scripts/map_to_pdf.sh <input.png> [output-prefix]
#
# Creates:
#   - {prefix}-tl.png     (top-left quadrant with overlap)
#   - {prefix}-tr.png     (top-right quadrant with overlap)
#   - {prefix}-bl.png     (bottom-left quadrant with overlap)
#   - {prefix}-br.png     (bottom-right quadrant with overlap)
#   - {prefix}-print.pdf  (4-page PDF ready for printing)

set -e

INPUT="$1"
OUTPUT_PREFIX="${2:-${INPUT%.png}}"

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
    echo "Usage: $0 <input.png> [output-prefix]"
    echo "  input.png     - Source map image"
    echo "  output-prefix - Output file prefix (default: input filename without .png)"
    exit 1
fi

# Check for ImageMagick
if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick is required. Install with: brew install imagemagick"
    exit 1
fi

# Get image dimensions
WIDTH=$(identify -format "%w" "$INPUT")
HEIGHT=$(identify -format "%h" "$INPUT")
MID_X=$((WIDTH / 2))
MID_Y=$((HEIGHT / 2))
OVERLAP=150  # 0.5" at 300 DPI

echo "Processing: $INPUT (${WIDTH}x${HEIGHT})"
echo "Midpoints: X=$MID_X, Y=$MID_Y, Overlap=${OVERLAP}px"

# Calculate quadrant dimensions with overlap
QUAD_W=$((MID_X + OVERLAP))
QUAD_H=$((MID_Y + OVERLAP))

# Create 4 quadrants with overlap
# Top-left: starts at 0,0
echo "Creating top-left quadrant..."
magick "$INPUT" -crop ${QUAD_W}x${QUAD_H}+0+0 +repage "${OUTPUT_PREFIX}-tl.png"

# Top-right: starts at midpoint-overlap, 0
echo "Creating top-right quadrant..."
TR_START=$((MID_X - OVERLAP))
magick "$INPUT" -crop ${QUAD_W}x${QUAD_H}+${TR_START}+0 +repage "${OUTPUT_PREFIX}-tr.png"

# Bottom-left: starts at 0, midpoint-overlap
echo "Creating bottom-left quadrant..."
BL_START=$((MID_Y - OVERLAP))
magick "$INPUT" -crop ${QUAD_W}x${QUAD_H}+0+${BL_START} +repage "${OUTPUT_PREFIX}-bl.png"

# Bottom-right: starts at midpoint-overlap, midpoint-overlap
echo "Creating bottom-right quadrant..."
magick "$INPUT" -crop ${QUAD_W}x${QUAD_H}+${TR_START}+${BL_START} +repage "${OUTPUT_PREFIX}-br.png"

# Create print-ready PDF pages
# Letter landscape: 11x8.5" = 3300x2550px at 300dpi
# Leave margins for printing
PAGE_WIDTH=3300
PAGE_HEIGHT=2550
CONTENT_WIDTH=3100
CONTENT_HEIGHT=2400

echo "Creating PDF pages..."

# Check if img2pdf is available (best quality - embeds PNG directly without transcoding)
if command -v img2pdf &> /dev/null; then
    echo "Using img2pdf for lossless PDF embedding..."

    # Create individual PDF pages with img2pdf (letter landscape: 11x8.5")
    for quad in tl tr bl br; do
        img2pdf "${OUTPUT_PREFIX}-${quad}.png" \
            --pagesize 11inx8.5in \
            --auto-orient \
            --fit shrink \
            -o "${OUTPUT_PREFIX}-page-${quad}.pdf"
    done

    # Combine PDFs using ghostscript or pdfunite
    if command -v pdfunite &> /dev/null; then
        echo "Combining with pdfunite..."
        pdfunite "${OUTPUT_PREFIX}-page-tl.pdf" \
                 "${OUTPUT_PREFIX}-page-tr.pdf" \
                 "${OUTPUT_PREFIX}-page-bl.pdf" \
                 "${OUTPUT_PREFIX}-page-br.pdf" \
                 "${OUTPUT_PREFIX}-print.pdf"
    else
        echo "Combining with ghostscript..."
        gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite \
           -sOutputFile="${OUTPUT_PREFIX}-print.pdf" \
           "${OUTPUT_PREFIX}-page-tl.pdf" \
           "${OUTPUT_PREFIX}-page-tr.pdf" \
           "${OUTPUT_PREFIX}-page-bl.pdf" \
           "${OUTPUT_PREFIX}-page-br.pdf"
    fi
else
    echo "Using ImageMagick (install img2pdf for better quality: pip install img2pdf)"

    # Page order: top-left, top-right, bottom-left, bottom-right
    for quad in tl tr bl br; do
        # Get quadrant dimensions
        Q_WIDTH=$(identify -format "%w" "${OUTPUT_PREFIX}-${quad}.png")
        Q_HEIGHT=$(identify -format "%h" "${OUTPUT_PREFIX}-${quad}.png")

        # Calculate DPI to fit on letter landscape with margins
        # Page: 11x8.5", content area ~10.5x8"
        DPI_W=$((Q_WIDTH * 100 / 1050))
        DPI_H=$((Q_HEIGHT * 100 / 800))
        DPI=$(( DPI_W > DPI_H ? DPI_W : DPI_H ))

        echo "  ${quad}: ${Q_WIDTH}x${Q_HEIGHT} at ${DPI} DPI"

        # Create PDF page - embed PNG without resampling
        magick "${OUTPUT_PREFIX}-${quad}.png" \
            -units PixelsPerInch \
            -set density $DPI \
            -page 11x8.5+0+0 \
            -gravity center \
            -quality 100 \
            PNG:"${OUTPUT_PREFIX}-${quad}.png" \
            -compress Zip \
            "${OUTPUT_PREFIX}-page-${quad}.pdf"
    done

    # Combine into single PDF
    echo "Combining into final PDF..."
    magick "${OUTPUT_PREFIX}-page-tl.pdf" \
           "${OUTPUT_PREFIX}-page-tr.pdf" \
           "${OUTPUT_PREFIX}-page-bl.pdf" \
           "${OUTPUT_PREFIX}-page-br.pdf" \
           -quality 100 \
           "${OUTPUT_PREFIX}-print.pdf"
fi

# Clean up intermediate PDFs
rm -f "${OUTPUT_PREFIX}-page-tl.pdf" "${OUTPUT_PREFIX}-page-tr.pdf" \
      "${OUTPUT_PREFIX}-page-bl.pdf" "${OUTPUT_PREFIX}-page-br.pdf"

echo ""
echo "Created:"
echo "  ${OUTPUT_PREFIX}-tl.png  (top-left)"
echo "  ${OUTPUT_PREFIX}-tr.png  (top-right)"
echo "  ${OUTPUT_PREFIX}-bl.png  (bottom-left)"
echo "  ${OUTPUT_PREFIX}-br.png  (bottom-right)"
echo "  ${OUTPUT_PREFIX}-print.pdf  (4-page printable PDF)"
echo ""
echo "Printing instructions:"
echo "  1. Print all 4 pages on 8.5x11\" paper (landscape orientation)"
echo "  2. Layout (pages overlap by 0.5\" on all edges):"
echo ""
echo "       +------+------+"
echo "       | TL   | TR   |  <- Pages 1, 2"
echo "       | (p1) | (p2) |"
echo "       +------+------+"
echo "       | BL   | BR   |  <- Pages 3, 4"
echo "       | (p3) | (p4) |"
echo "       +------+------+"
echo ""
echo "  3. Trim overlap from right edge of TL/BL and bottom edge of TL/TR"
echo "  4. Align matching imagery and tape from behind"
