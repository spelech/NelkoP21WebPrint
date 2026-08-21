import io
import os
import json
import base64
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from pydantic import BaseModel, Field, AliasChoices
from PIL import Image, ImageDraw, ImageFont
import barcode
from barcode.writer import ImageWriter

from app.core.config import settings
from app.core.rasterizer import dither_image, pack_bitmap_to_tspl_bytes, mm_to_dots
from app.core.tspl_builder import TSPLStreamBuilder
from app.drivers.tcp_driver import TCPPrinterDriver
from app.drivers.spp_driver import SPPPrinterDriver, MockPrinterDriver

router = APIRouter(prefix="/api", tags=["Print & Preview"])

# Templates Directory reference
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "templates")

class PrintTemplateRequest(BaseModel):
    template_id: str = Field(..., description="ID of the template to print")
    variables: Dict[str, str] = Field(default_factory=dict, description="Variables to substitute in the template")
    copies: int = 1
    density: int = 3
    dither_method: str = "threshold"

class BatchJob(BaseModel):
    variables: Dict[str, str] = Field(default_factory=dict, description="Variables for this job")
    copies: int = 1

class PrintBatchRequest(BaseModel):
    template_id: str = Field(..., description="ID of the template to print")
    jobs: List[BatchJob] = Field(..., description="List of jobs to print in this batch")
    density: int = 3
    dither_method: str = "threshold"


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
    elements: Optional[List[Dict[str, Any]]] = None

class DirectPrintTextRequest(BaseModel):
    text: str = Field(..., description="Main plain text content to render and print")
    font_family: str = Field(
        "sans-serif",
        validation_alias=AliasChoices("font_family", "fontFamily"),
        description="Font family: 'sans-serif' or 'monospace'"
    )
    font_size: Optional[int] = Field(
        None,
        validation_alias=AliasChoices("font_size", "fontSize"),
        description="Font size in points/dots"
    )
    bold: bool = Field(False, description="Bold font weight")
    align: str = Field("center", description="Text alignment: 'left', 'center', or 'right'")
    width_mm: float = 40.0
    height_mm: float = 14.0
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

def render_direct_text_image(req: DirectPrintTextRequest) -> Image.Image:
    """Render plain text centered on a white PIL image using monospace or sans font with bold and align options."""
    w_dots = mm_to_dots(req.width_mm, settings.DPI)
    h_dots = mm_to_dots(req.height_mm, settings.DPI)
    
    img = Image.new("L", (w_dots, h_dots), 255)
    draw = ImageDraw.Draw(img)
    
    if req.font_size and req.font_size > 0:
        font_size = req.font_size
    else:
        font_size = max(12, int(h_dots * 0.4))
        
    font_family = (req.font_family or "sans-serif").lower()
    if font_family in ("monospace", "mono"):
        font_path = (
            "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"
            if req.bold
            else "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
        )
    else:
        font_path = (
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
            if req.bold
            else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
        )
        
    try:
        font = ImageFont.truetype(font_path, font_size)
    except IOError:
        try:
            fallback_name = "DejaVuSansMono.ttf" if font_family in ("monospace", "mono") else "arial.ttf"
            font = ImageFont.truetype(fallback_name, font_size)
        except IOError:
            font = ImageFont.load_default()
            
    align_mode = (req.align or "center").lower()
    if align_mode == "left":
        x = 10
        anchor = "lm"
    elif align_mode == "right":
        x = w_dots - 10
        anchor = "rm"
    else:  # center
        x = w_dots // 2
        anchor = "mm"
        
    y = h_dots // 2
    draw.text((x, y), req.text, fill=0, font=font, anchor=anchor, align=align_mode)
    return img

@router.post("/print/text")
def print_direct_text_job(req: DirectPrintTextRequest):
    """Renders plain text on a white image, dithers it, builds TSPL stream, and prints using get_driver()."""
    img = render_direct_text_image(req)
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

def generate_barcode(data: str, code_type: str = "code128") -> Optional[Image.Image]:
    """Generate 1D barcode image using python-barcode."""
    try:
        barcode_class = barcode.get_barcode_class(code_type)
        rv = io.BytesIO()
        writer = ImageWriter()
        bc = barcode_class(data, writer=writer)
        bc.write(rv, options={
            "write_text": False,
            "margin_top": 1,
            "margin_bottom": 1,
            "background": "white",
            "foreground": "black"
        })
        rv.seek(0)
        return Image.open(rv).convert("L")
    except Exception as e:
        print(f"Barcode generate error: {e}")
        return None

def render_template_image(template_data: Dict[str, Any], variables: Dict[str, str]) -> Image.Image:
    """Render a full JSON template to a PIL image, substituting variables."""
    width_mm = template_data.get("width_mm", 40.0)
    height_mm = template_data.get("height_mm", 14.0)
    
    w_dots = mm_to_dots(width_mm, settings.DPI)
    h_dots = mm_to_dots(height_mm, settings.DPI)
    
    # White base canvas
    img = Image.new("L", (w_dots, h_dots), 255)
    draw = ImageDraw.Draw(img)
    
    for el in template_data.get("elements", []):
        el_type = el.get("type")
        content = el.get("content", "")
        
        # Variable replacement
        if isinstance(content, str):
            for k, v in variables.items():
                content = content.replace(f"{{{{{k}}}}}", str(v))
                
        x_pct = el.get("x", 50.0)
        y_pct = el.get("y", 50.0)
        posX = (x_pct / 100.0) * w_dots
        posY = (y_pct / 100.0) * h_dots
        
        if el_type == "text":
            font_size = el.get("fontSize", 16)
            font_style = el.get("fontStyle", "normal")
            font_family = el.get("fontFamily", "sans-serif")
            
            try:
                if font_family == "monospace":
                    font_path = (
                        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"
                        if font_style == "bold"
                        else "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
                    )
                else:
                    font_path = (
                        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
                        if font_style == "bold"
                        else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
                    )
                font = ImageFont.truetype(font_path, font_size)
            except IOError:
                try:
                    fallback_name = "DejaVuSansMono.ttf" if font_family == "monospace" else "arial.ttf"
                    font = ImageFont.truetype(fallback_name, font_size)
                except IOError:
                    font = ImageFont.load_default()
                    
            draw.text((posX, posY), content, fill=0, font=font, anchor="mm")
            
        elif el_type == "qr":
            try:
                import qrcode
                qr = qrcode.QRCode(box_size=3, border=1)
                qr.add_data(content)
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="black", back_color="white").convert("L")
                
                qr_size = int(el.get("size", 60))
                qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
                img.paste(qr_img, (int(posX - qr_size / 2), int(posY - qr_size / 2)))
            except Exception as e:
                print(f"QR render error: {e}")
                
        elif el_type == "barcode":
            try:
                bc_code_type = el.get("barcodeType", "code128").lower()
                bc_img = generate_barcode(content, bc_code_type)
                if bc_img:
                    bc_w = int(el.get("width", 100))
                    bc_h = int(el.get("height", 40))
                    bc_img = bc_img.resize((bc_w, bc_h), Image.Resampling.NEAREST)
                    img.paste(bc_img, (int(posX - bc_w / 2), int(posY - bc_h / 2)))
            except Exception as e:
                print(f"Barcode render error: {e}")
                
        elif el_type == "image" and el.get("url"):
            try:
                url = el.get("url", "")
                if url.startswith("data:image"):
                    header, encoded = url.split(",", 1)
                    img_bytes = base64.b64decode(encoded)
                    el_img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
                    
                    img_w = int(el.get("width", 60))
                    img_h = int(el.get("height", 60))
                    el_img = el_img.resize((img_w, img_h), Image.Resampling.LANCZOS)
                    
                    # Flatten on white
                    white_bg = Image.new("RGBA", (img_w, img_h), (255, 255, 255, 255))
                    white_bg.paste(el_img, (0, 0), el_img)
                    img.paste(white_bg.convert("L"), (int(posX - img_w / 2), int(posY - img_h / 2)))
            except Exception as e:
                print(f"Image render error: {e}")
                
        elif el_type == "line":
            line_w = int(el.get("width", 20))
            line_h = int(el.get("height", 2))
            draw.line(
                [posX - line_w / 2, posY - line_h / 2, posX + line_w / 2, posY + line_h / 2],
                fill=0,
                width=max(1, line_h)
            )
            
        elif el_type == "rectangle":
            rect_w = int(el.get("width", 50))
            rect_h = int(el.get("height", 30))
            draw.rectangle(
                [posX - rect_w / 2, posY - rect_h / 2, posX + rect_w / 2, posY + rect_h / 2],
                outline=0,
                width=max(1, int(el.get("thickness", 2)))
            )
            
    return img

def load_template_data(template_id: str) -> Dict[str, Any]:
    """Load JSON template from templates directory."""
    filepath = os.path.join(TEMPLATES_DIR, f"{template_id}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading template: {e}")

@router.post("/preview/template")
def preview_template_job(req: PrintTemplateRequest):
    """Generates a 1-bit monochrome PNG preview of a template with variables."""
    template_data = load_template_data(req.template_id)
    img = render_template_image(template_data, req.variables)
    mono_img = dither_image(img, method=req.dither_method)
    
    buf = io.BytesIO()
    mono_img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")

@router.post("/print/template")
def print_template_job(req: PrintTemplateRequest):
    """Prints a single label from a template with variable substitution."""
    template_data = load_template_data(req.template_id)
    img = render_template_image(template_data, req.variables)
    mono_img = dither_image(img, method=req.dither_method)
    
    width_mm = template_data.get("width_mm", 40.0)
    height_mm = template_data.get("height_mm", 14.0)
    gap_mm = template_data.get("gap_mm", 5.0)
    
    builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=gap_mm)
    builder.set_density(req.density).set_copies(req.copies)
    tspl_payload = builder.build_from_image(mono_img)
    
    driver = get_driver()
    success = driver.send_bytes(tspl_payload)
    driver.disconnect()
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to transmit print payload to printer")
        
    return {"status": "success", "bytes_sent": len(tspl_payload), "copies": req.copies}

@router.post("/print/batch")
def print_batch_job(req: PrintBatchRequest):
    """Prints a batch of labels from a template with sequential variable values."""
    template_data = load_template_data(req.template_id)
    width_mm = template_data.get("width_mm", 40.0)
    height_mm = template_data.get("height_mm", 14.0)
    gap_mm = template_data.get("gap_mm", 5.0)
    
    driver = get_driver()
    total_bytes = 0
    total_printed = 0
    
    for idx, job in enumerate(req.jobs):
        img = render_template_image(template_data, job.variables)
        mono_img = dither_image(img, method=req.dither_method)
        
        builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=gap_mm)
        builder.set_density(req.density).set_copies(job.copies)
        tspl_payload = builder.build_from_image(mono_img)
        
        success = driver.send_bytes(tspl_payload)
        if not success:
            driver.disconnect()
            raise HTTPException(status_code=500, detail=f"Failed to transmit print job #{idx + 1} in batch")
            
        total_bytes += len(tspl_payload)
        total_printed += job.copies
        
    driver.disconnect()
    return {"status": "success", "batch_size": len(req.jobs), "total_copies": total_printed, "total_bytes": total_bytes}

