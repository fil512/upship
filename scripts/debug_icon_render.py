import os
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
from PIL import Image, ImageOps

ICON_DIR = 'web/src/lib/icons/svg'
OUT_DIR = 'print/debug_icons'
if not os.path.exists(OUT_DIR): os.makedirs(OUT_DIR)

def test_icon(name):
    svg_path = os.path.join(ICON_DIR, f"{name}.svg")
    print(f"Testing {name} from {svg_path}")
    
    drawing = svg2rlg(svg_path)
    drawing.scale(10, 10) # Scale up big to see details
    
    # Render on WHITE background
    img = renderPM.drawToPIL(drawing, bg=0xffffffff) 
    img = img.convert("L") # Greyscale
    
    # Invert: Dark icon becomes Light pixels (Alpha 255)
    # White background becomes Dark pixels (Alpha 0)
    mask = ImageOps.invert(img)
    
    mask.save(os.path.join(OUT_DIR, f"{name}_mask_inverted.png"))
    
    # Recolor to Red
    color_img = Image.new('RGBA', img.size, (255, 0, 0, 255))
    final = Image.new('RGBA', img.size, (0,0,0,0))
    final.paste(color_img, (0,0), mask)
    
    final.save(os.path.join(OUT_DIR, f"{name}_fixed.png"))

test_icon('lift')
test_icon('wrench')
