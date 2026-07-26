import io
import base64
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from pydantic import BaseModel, Field
from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings
from app.core.rasterizer import dither_image, pack_bitmap_to_tspl_bytes, mm_to_dots
from app.core.tspl_builder import TSPLStreamBuilder
from app.drivers.tcp_driver import TCPPrinterDriver
from app.drivers.spp_driver import SPPPrinterDriver, MockPrinterDriver

router = APIRouter(prefix="/api", tags=["Print & Preview"])

class PrintTextRequest(BaseModel):
    text: str = Field(..., description="Main text to print on label")
    subtitle: Optional[str] = Field(None, description="Optional secondary text")
    barcode: Optional[str] = Field(None, description="Barcode or QR data")
    width_mm: float = 14.0
    height_mm: float = 40.0
    gap_mm: float = 5.0
    density: int = 3
    copies: int = 1
    dither_method: str = "threshold"  # 'threshold', 'floyd-steinberg', 'bayer16'

class PrintCanvasRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded PNG/JPEG image from canvas")
    width_mm: float = 14.0
    height_mm: float = 40.0
    gap_mm: float = 5.0
    density: int = 3
    copies: int = 1
    dither_method: str = "threshold"

def get_driver():
    """Factory to get configured printer driver."""
    if settings.DEFAULT_DRIVER_TYPE == "spp":
        return SPPPrinterDriver(mac_address=settings.PRINTER_BT_MAC)
    elif settings.DEFAULT_DRIVER_TYPE == "mock":
        return MockPrinterDriver()
    else:  # 'tcp'
        return TCPPrinterDriver(host=settings.PRINTER_TCP_HOST, port=settings.PRINTER_TCP_PORT)

def render_simple_label_image(req: PrintTextRequest) -> Image.Image:
    """Render simple text/subtitle/barcode into PIL Image @ 203 DPI."""
    w_dots = mm_to_dots(req.width_mm, settings.DPI)
    h_dots = mm_to_dots(req.height_mm, settings.DPI)
    
    # White canvas
    img = Image.new("L", (w_dots, h_dots), 255)
    draw = ImageDraw.Draw(img)
    
    # Simple font rendering
    try:
        font_main = ImageFont.truetype("arial.ttf", size=max(14, int(w_dots * 0.18)))
        font_sub = ImageFont.truetype("arial.ttf", size=max(10, int(w_dots * 0.12)))
    except IOError:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    y_cursor = 10
    
    # Main Text
    if req.text:
        draw.text((w_dots // 2, y_cursor), req.text, fill=0, font=font_main, anchor="mm")
        y_cursor += int(h_dots * 0.3)
        
    # Subtitle
    if req.subtitle:
        draw.text((w_dots // 2, y_cursor), req.subtitle, fill=0, font=font_sub, anchor="mm")
        y_cursor += int(h_dots * 0.2)
        
    # Barcode or QR Code if requested
    if req.barcode:
        try:
            import qrcode
            qr = qrcode.QRCode(box_size=3, border=1)
            qr.add_data(req.barcode)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white").convert("L")
            
            # Scale QR code to fit canvas
            max_qr_size = min(w_dots - 10, h_dots - y_cursor - 10)
            if max_qr_size > 20:
                qr_img = qr_img.resize((max_qr_size, max_qr_size), Image.Resampling.NEAREST)
                qr_x = (w_dots - max_qr_size) // 2
                img.paste(qr_img, (qr_x, y_cursor))
        except Exception:
            pass
            
    return img

@router.get("/presets")
def list_presets():
    """Return preset label dimensions."""
    return {"presets": settings.PRESETS}

@router.post("/preview")
def preview_label(req: PrintTextRequest):
    """Generates a 1-bit monochrome PNG preview of the label."""
    img = render_simple_label_image(req)
    mono_img = dither_image(img, method=req.dither_method)
    
    buf = io.BytesIO()
    mono_img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")

@router.post("/preview/canvas")
def preview_canvas_label(req: PrintCanvasRequest):
    """Generates a 1-bit monochrome PNG preview from base64 canvas image."""
    try:
        header, encoded = req.image_base64.split(",", 1) if "," in req.image_base64 else ("", req.image_base64)
        data = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(data)).convert("RGBA")
        
        # Target dimensions
        w_dots = mm_to_dots(req.width_mm, settings.DPI)
        h_dots = mm_to_dots(req.height_mm, settings.DPI)
        
        # Flatten on white background
        canvas = Image.new("RGBA", (w_dots, h_dots), (255, 255, 255, 255))
        scaled_img = img.resize((w_dots, h_dots), Image.Resampling.LANCZOS)
        canvas.paste(scaled_img, (0, 0), scaled_img)
        
        mono_img = dither_image(canvas.convert("RGB"), method=req.dither_method)
        
        buf = io.BytesIO()
        mono_img.save(buf, format="PNG")
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {e}")

@router.post("/print")
def print_simple_label_job(req: PrintTextRequest):
    """Renders and prints a text/barcode label."""
    img = render_simple_label_image(req)
    mono_img = dither_image(img, method=req.dither_method)
    
    builder = TSPLStreamBuilder(width_mm=req.width_mm, height_mm=req.height_mm, gap_mm=req.gap_mm)
    builder.set_density(req.density).set_copies(req.copies)
    tspl_payload = builder.build_from_image(mono_img)
    
    driver = get_driver()
    success = driver.send_bytes(tspl_payload)
    driver.disconnect()
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to transmit print payload to printer")
        
    return {"status": "success", "bytes_sent": len(tspl_payload), "copies": req.copies}

@router.post("/print/canvas")
def print_canvas_label_job(req: PrintCanvasRequest):
    """Prints a label from base64 canvas image."""
    try:
        header, encoded = req.image_base64.split(",", 1) if "," in req.image_base64 else ("", req.image_base64)
        data = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(data))
        
        w_dots = mm_to_dots(req.width_mm, settings.DPI)
        h_dots = mm_to_dots(req.height_mm, settings.DPI)
        
        canvas = Image.new("RGB", (w_dots, h_dots), (255, 255, 255))
        scaled_img = img.convert("RGBA").resize((w_dots, h_dots), Image.Resampling.LANCZOS)
        canvas.paste(scaled_img, (0, 0), scaled_img)
        
        mono_img = dither_image(canvas, method=req.dither_method)
        
        builder = TSPLStreamBuilder(width_mm=req.width_mm, height_mm=req.height_mm, gap_mm=req.gap_mm)
        builder.set_density(req.density).set_copies(req.copies)
        tspl_payload = builder.build_from_image(mono_img)
        
        driver = get_driver()
        success = driver.send_bytes(tspl_payload)
        driver.disconnect()
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to transmit print payload to printer")
            
        return {"status": "success", "bytes_sent": len(tspl_payload), "copies": req.copies}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Print error: {e}")
