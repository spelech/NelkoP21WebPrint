import io
import os
import re
import json
import base64
from typing import Optional, List, Dict, Any

from fastmcp import FastMCP
from PIL import Image

from app.core.config import settings
from app.core.rasterizer import dither_image, mm_to_dots
from app.core.tspl_builder import TSPLStreamBuilder
from app.api.print_routes import (
    get_driver,
    load_template_data,
    render_template_image,
    render_simple_label_image,
    PrintTextRequest,
    TEMPLATES_DIR,
)

mcp = FastMCP("Nelko P21 Label Printer")


def generate_ascii_wireframe(img: Image.Image, max_cols: int = 40) -> str:
    """Generate an ASCII wireframe representation of a 1-bit monochrome image."""
    w, h = img.size
    aspect = (h / w) * 0.5
    cols = min(max_cols, w)
    rows = max(4, int(cols * aspect))
    scaled = img.resize((cols, rows), Image.Resampling.NEAREST).convert("L")
    border_horiz = "+" + "-" * cols + "+"
    lines = [border_horiz]
    for y in range(rows):
        row_chars = []
        for x in range(cols):
            pixel = scaled.getpixel((x, y))
            row_chars.append("█" if pixel < 128 else " ")
        lines.append(f"|{''.join(row_chars)}|")
    lines.append(border_horiz)
    return "\n".join(lines)


# ============================================================================
# MCP Tools
# ============================================================================

@mcp.tool()
def check_printer_status() -> str:
    """
    Check connection and reachability status of the Nelko P21 thermal printer bridge.
    """
    driver = get_driver()
    probe = driver.probe_connection()
    host = probe.get("host", getattr(driver, "host", settings.PRINTER_TCP_HOST))
    port = probe.get("port", getattr(driver, "port", settings.PRINTER_TCP_PORT))
    
    if probe.get("bridge_reachable", False):
        return f"✅ **Printer Bridge Online**: Connected to print bridge at {host}:{port}. Ready to accept print jobs."
    else:
        return f"❌ **Bridge Offline**: Cannot reach print bridge at {host}:{port}. Check ESP32 power, WiFi, or IP configuration."


@mcp.tool()
def list_presets() -> str:
    """
    Returns structured list of physical label rolls with dimensions in mm, dots, and gap.
    """
    lines = [
        "### Available Label Presets (Nelko P21 - 203 DPI / 8 dots/mm)",
        ""
    ]
    for p in settings.PRESETS:
        w_mm = p["width"]
        h_mm = p["height"]
        gap_mm = p["gap"]
        w_dots = mm_to_dots(w_mm, settings.DPI)
        h_dots = mm_to_dots(h_mm, settings.DPI)
        lines.append(f"- **{p['name']}**: {w_mm}mm × {h_mm}mm ({w_dots} × {h_dots} dots), Gap: {gap_mm}mm")
    return "\n".join(lines)


@mcp.tool()
def list_templates() -> str:
    """
    Lists available templates (asset_tag, box_label, cable_flag) and their placeholder variables.
    """
    lines = ["### Available Label Templates", ""]
    if not os.path.exists(TEMPLATES_DIR):
        return "No templates directory found."
        
    for fname in sorted(os.listdir(TEMPLATES_DIR)):
        if fname.endswith(".json"):
            tid = fname[:-5]
            try:
                with open(os.path.join(TEMPLATES_DIR, fname), "r", encoding="utf-8") as f:
                    tdata = json.load(f)
                name = tdata.get("name", tid)
                w_mm = tdata.get("width_mm", 40.0)
                h_mm = tdata.get("height_mm", 14.0)
                
                vars_found = set()
                for el in tdata.get("elements", []):
                    content = str(el.get("content", ""))
                    matches = re.findall(r"\{\{([a-zA-Z0-9_-]+)\}\}", content)
                    vars_found.update(matches)
                    
                vars_str = ", ".join([f"`{{{{{v}}}}}`" for v in sorted(vars_found)]) if vars_found else "None"
                lines.append(f"- **{tid}** ({name} - {w_mm}mm × {h_mm}mm):")
                lines.append(f"  - Variables: {vars_str}")
            except Exception as e:
                lines.append(f"- **{tid}**: (Error loading template: {e})")
                
    return "\n".join(lines)


@mcp.tool()
def print_simple_label(
    title: str,
    subtitle: Optional[str] = None,
    barcode_value: Optional[str] = None,
    barcode_type: str = "code128",
    width_mm: float = 14.0,
    height_mm: float = 40.0,
    copies: int = 1,
    density: int = 3
) -> str:
    """
    Renders text + barcode/QR and sends to driver.
    
    Args:
        title: Main label title / heading text.
        subtitle: Optional secondary text underneath.
        barcode_value: Optional barcode or QR code payload string.
        barcode_type: Barcode type ('code128', 'qr', 'qrcode', 'ean13', etc.). Default is 'code128'.
        width_mm: Label width in millimeters (default: 14.0mm).
        height_mm: Label length/height in millimeters (default: 40.0mm).
        copies: Number of label copies to print (default: 1).
        density: Thermal head print density 1-15 (default: 3).
    """
    req = PrintTextRequest(
        text=title,
        subtitle=subtitle,
        barcode=barcode_value,
        width_mm=width_mm,
        height_mm=height_mm,
        copies=copies,
        density=density
    )
    img = render_simple_label_image(req)
    mono_img = dither_image(img)
    
    builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=5.0)
    builder.set_density(density).set_copies(copies)
    payload = builder.build_from_image(mono_img)
    
    driver = get_driver()
    success = driver.send_bytes(payload)
    driver.disconnect()
    
    if success:
        return f"Successfully sent print job ('{title}') to Nelko P21 printer ({copies} copies)."
    else:
        return "Error: Failed to transmit print job to printer driver."


@mcp.tool()
def print_template_label(
    template_id: str,
    variables_json: str,
    copies: int = 1,
    density: int = 3
) -> str:
    """
    Populates template variables and prints.
    
    Args:
        template_id: The ID of the template to use (e.g. 'asset_tag', 'box_label', 'cable_flag').
        variables_json: JSON string of variables to substitute (e.g. '{"name": "Server-01", "url": "http://10.0.0.10"}').
        copies: Number of copies to print (default: 1).
        density: Thermal head print density 1-15 (default: 3).
    """
    try:
        variables = json.loads(variables_json) if isinstance(variables_json, str) else variables_json
    except Exception as e:
        return f"Error: Invalid variables JSON: {e}"
        
    try:
        template_data = load_template_data(template_id)
        img = render_template_image(template_data, variables)
        mono_img = dither_image(img)
        
        width_mm = template_data.get("width_mm", 40.0)
        height_mm = template_data.get("height_mm", 14.0)
        gap_mm = template_data.get("gap_mm", 5.0)
        
        builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=gap_mm)
        builder.set_density(density).set_copies(copies)
        payload = builder.build_from_image(mono_img)
        
        driver = get_driver()
        success = driver.send_bytes(payload)
        driver.disconnect()
        
        if success:
            return f"Successfully printed template '{template_id}' with variables {variables} ({copies} copies)."
        else:
            return "Error: Failed to transmit payload to printer."
    except Exception as e:
        return f"Error printing template: {e}"


@mcp.tool()
def print_custom_label(
    elements_json: str,
    width_mm: float = 14.0,
    height_mm: float = 40.0,
    gap_mm: float = 5.0,
    copies: int = 1,
    density: int = 3
) -> str:
    """
    Renders custom vector elements (text, barcode, qr, line, rectangle) and prints.
    
    Args:
        elements_json: JSON string of element objects (e.g. '[{"type": "text", "content": "Server A", "x": 50, "y": 30}]').
        width_mm: Width of label in millimeters (default: 14.0mm).
        height_mm: Height/length of label in millimeters (default: 40.0mm).
        gap_mm: Label gap in millimeters (default: 5.0mm).
        copies: Number of label copies to print (default: 1).
        density: Thermal head print density 1-15 (default: 3).
    """
    try:
        elements = json.loads(elements_json) if isinstance(elements_json, str) else elements_json
        if not isinstance(elements, list):
            return "Error: elements_json must be a JSON array of element objects."
    except Exception as e:
        return f"Error: Invalid elements JSON: {e}"
        
    try:
        template_data = {
            "width_mm": width_mm,
            "height_mm": height_mm,
            "gap_mm": gap_mm,
            "elements": elements
        }
        img = render_template_image(template_data, {})
        mono_img = dither_image(img)
        
        builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=gap_mm)
        builder.set_density(density).set_copies(copies)
        payload = builder.build_from_image(mono_img)
        
        driver = get_driver()
        success = driver.send_bytes(payload)
        driver.disconnect()
        
        if success:
            return f"Successfully printed custom label ({len(elements)} elements, {copies} copies)."
        else:
            return "Error: Failed to transmit payload to printer."
    except Exception as e:
        return f"Error printing custom label: {e}"


@mcp.tool()
def print_batch(
    items_json: str,
    template_id: Optional[str] = None,
    auto_barcode_prefix: Optional[str] = None,
    width_mm: float = 14.0,
    height_mm: float = 40.0,
    copies_per_item: int = 1,
    density: int = 3
) -> str:
    """
    Generates/prints sequential labels with auto-generated unique barcodes and variable replacement.
    
    Args:
        items_json: JSON list of item strings (e.g. ["Chicken Breast", "Thighs"]) or dicts (e.g. [{"title": "Chicken"}]).
        template_id: Optional template ID to use (e.g. 'asset_tag', 'box_label').
        auto_barcode_prefix: Optional barcode prefix (e.g. "CHK" -> "CHK-001", "CHK-002", etc.).
        width_mm: Label width in millimeters (default: 14.0mm).
        height_mm: Label length/height in millimeters (default: 40.0mm).
        copies_per_item: Number of copies to print per item (default: 1).
        density: Thermal head print density 1-15 (default: 3).
    """
    try:
        items = json.loads(items_json) if isinstance(items_json, str) else items_json
        if not isinstance(items, list):
            return "Error: items_json must be a JSON array of items."
    except Exception as e:
        return f"Error: Invalid items JSON: {e}"

    if not items:
        return "Batch is empty. No labels to print."

    driver = get_driver()
    total_copies = 0
    
    try:
        template_data = load_template_data(template_id) if template_id else None
        
        for idx, raw_item in enumerate(items):
            seq_code = f"{auto_barcode_prefix}-{idx + 1:03d}" if auto_barcode_prefix else None
            
            if template_data:
                if isinstance(raw_item, dict):
                    variables = dict(raw_item)
                else:
                    item_str = str(raw_item)
                    variables = {"name": item_str, "title": item_str, "text": item_str}
                    
                if seq_code:
                    if "barcode" not in variables:
                        variables["barcode"] = seq_code
                    if "url" not in variables:
                        variables["url"] = seq_code
                    if "code" not in variables:
                        variables["code"] = seq_code
                        
                img = render_template_image(template_data, variables)
                t_w = template_data.get("width_mm", width_mm)
                t_h = template_data.get("height_mm", height_mm)
                t_gap = template_data.get("gap_mm", 5.0)
            else:
                if isinstance(raw_item, dict):
                    title = raw_item.get("title") or raw_item.get("name") or raw_item.get("text") or str(raw_item)
                    subtitle = raw_item.get("subtitle")
                    barcode_val = raw_item.get("barcode") or raw_item.get("barcode_value") or seq_code
                else:
                    title = str(raw_item)
                    subtitle = None
                    barcode_val = seq_code
                    
                req = PrintTextRequest(
                    text=title,
                    subtitle=subtitle,
                    barcode=barcode_val,
                    width_mm=width_mm,
                    height_mm=height_mm,
                    copies=copies_per_item,
                    density=density
                )
                img = render_simple_label_image(req)
                t_w, t_h, t_gap = width_mm, height_mm, 5.0
                
            mono_img = dither_image(img)
            builder = TSPLStreamBuilder(width_mm=t_w, height_mm=t_h, gap_mm=t_gap)
            builder.set_density(density).set_copies(copies_per_item)
            payload = builder.build_from_image(mono_img)
            
            success = driver.send_bytes(payload)
            if not success:
                driver.disconnect()
                return f"Error: Failed to print batch item #{idx + 1} ('{raw_item}') after printing {total_copies} copies."
                
            total_copies += copies_per_item
            
        driver.disconnect()
        return f"Successfully printed batch of {len(items)} labels ({total_copies} total copies)."
    except Exception as e:
        driver.disconnect()
        return f"Error in batch printing: {e}"


@mcp.tool()
def preview_label(
    title: Optional[str] = None,
    subtitle: Optional[str] = None,
    barcode_value: Optional[str] = None,
    elements_json: Optional[str] = None,
    template_id: Optional[str] = None,
    variables_json: Optional[str] = None,
    width_mm: float = 14.0,
    height_mm: float = 40.0
) -> str:
    """
    Renders a label and returns Base64 PNG data URL + ASCII wireframe layout.
    
    Args:
        title: Optional title text for simple label.
        subtitle: Optional subtitle text for simple label.
        barcode_value: Optional barcode or QR code value.
        elements_json: Optional custom vector elements JSON string.
        template_id: Optional template ID (e.g. 'asset_tag', 'box_label', 'cable_flag').
        variables_json: Optional JSON string of variables for the template.
        width_mm: Label width in millimeters (default: 14.0mm).
        height_mm: Label height in millimeters (default: 40.0mm).
    """
    try:
        if template_id:
            variables = json.loads(variables_json) if variables_json else {}
            template_data = load_template_data(template_id)
            w_mm = template_data.get("width_mm", width_mm)
            h_mm = template_data.get("height_mm", height_mm)
            img = render_template_image(template_data, variables)
        elif elements_json:
            elements = json.loads(elements_json) if isinstance(elements_json, str) else elements_json
            template_data = {
                "width_mm": width_mm,
                "height_mm": height_mm,
                "gap_mm": 5.0,
                "elements": elements
            }
            w_mm, h_mm = width_mm, height_mm
            img = render_template_image(template_data, {})
        else:
            w_mm, h_mm = width_mm, height_mm
            req = PrintTextRequest(
                text=title or "Preview Label",
                subtitle=subtitle,
                barcode=barcode_value,
                width_mm=width_mm,
                height_mm=height_mm
            )
            img = render_simple_label_image(req)

        mono_img = dither_image(img)
        buf = io.BytesIO()
        mono_img.save(buf, format="PNG")
        b64_str = base64.b64encode(buf.getvalue()).decode("ascii")
        data_url = f"data:image/png;base64,{b64_str}"
        ascii_wireframe = generate_ascii_wireframe(mono_img)
        
        return (
            f"### Label Preview ({w_mm}mm × {h_mm}mm)\n\n"
            f"```\n{ascii_wireframe}\n```\n\n"
            f"**Data URL (Base64 PNG)**:\n`{data_url}`"
        )
    except Exception as e:
        return f"Error generating preview: {e}"


# ============================================================================
# MCP Resources
# ============================================================================

@mcp.resource("nelko://specs/printer")
def printer_specs_resource() -> str:
    """Complete hardware specifications for Nelko P21 thermal printer."""
    return json.dumps({
        "device": "Nelko P21 Direct Thermal Label Printer",
        "dpi": 203,
        "dots_per_mm": 8,
        "printhead_width_dots": 112,
        "printhead_width_mm": 14.0,
        "max_length_mm": 50.0,
        "color_mode": "1-bit monochrome (0=black/burn, 1=white)",
        "protocol": "TSPL / TSPL2 bitmap stream",
        "chunk_size_bytes": 244,
        "default_density": 3,
        "density_range": "1-15",
        "default_speed": 2.0,
        "interfaces": ["Bluetooth SPP RFCOMM (Port 1)", "TCP Socket Bridge (Port 9100)"],
        "coordinate_system": "Origin (0,0) at top-left; X across head, Y along feed direction",
        "contrast_rules": "Monochrome 1-bit dithering; use bold sans-serif or monospace fonts for optimal legibility."
    }, indent=2)


@mcp.resource("nelko://presets")
def presets_resource() -> str:
    """JSON list of all physical label presets with dimensions in mm and dots."""
    enriched_presets = []
    for p in settings.PRESETS:
        w_mm = p["width"]
        h_mm = p["height"]
        enriched_presets.append({
            "name": p["name"],
            "width_mm": w_mm,
            "height_mm": h_mm,
            "width_dots": mm_to_dots(w_mm, settings.DPI),
            "height_dots": mm_to_dots(h_mm, settings.DPI),
            "gap_mm": p["gap"],
            "type": p.get("type", 0)
        })
    return json.dumps(enriched_presets, indent=2)


@mcp.resource("nelko://templates")
def templates_resource() -> str:
    """JSON list of all saved templates with variable schemas."""
    templates = []
    if os.path.exists(TEMPLATES_DIR):
        for fname in sorted(os.listdir(TEMPLATES_DIR)):
            if fname.endswith(".json"):
                tid = fname[:-5]
                try:
                    with open(os.path.join(TEMPLATES_DIR, fname), "r", encoding="utf-8") as f:
                        tdata = json.load(f)
                    
                    vars_found = set()
                    for el in tdata.get("elements", []):
                        content = str(el.get("content", ""))
                        matches = re.findall(r"\{\{([a-zA-Z0-9_-]+)\}\}", content)
                        vars_found.update(matches)
                        
                    templates.append({
                        "id": tid,
                        "name": tdata.get("name", tid),
                        "width_mm": tdata.get("width_mm", 40.0),
                        "height_mm": tdata.get("height_mm", 14.0),
                        "gap_mm": tdata.get("gap_mm", 5.0),
                        "variables": sorted(list(vars_found)),
                        "elements_count": len(tdata.get("elements", []))
                    })
                except Exception:
                    pass
    return json.dumps(templates, indent=2)


# ============================================================================
# MCP Prompts
# ============================================================================

@mcp.prompt("label_designer")
def label_designer_prompt(label_type: str = "general", details: str = "") -> str:
    """
    System prompt guiding LLMs on designing and formatting labels for Nelko P21 thermal printer.
    """
    return (
        "You are an expert thermal label designer for the Nelko P21 direct thermal printer (203 DPI, 8 dots/mm).\n\n"
        "Guidelines for optimal thermal print quality:\n"
        "1. **Label Dimensions**: Standard rolls are typically 14x40mm (112x320 dots) or 12x40mm. For cable flags use 15x50mm. For storage boxes use 40x12mm or 20x30mm.\n"
        "2. **Monochrome High Contrast**: Thermal heads only print 1-bit black or white pixels. Avoid thin or light gray elements. Use bold typography.\n"
        "3. **Legibility & Fonts**: Use sans-serif (Liberation Sans / Arial) or monospace (Liberation Mono). Minimum recommended font size is 10-12pt for subtitles and 14-18pt for titles.\n"
        "4. **Barcodes & QR Codes**: Keep barcode height at least 30-40 dots and QR codes at least 30x30 dots so cameras and 1D/2D scanners can reliably read them.\n"
        "5. **Batch Generation**: When generating batches, use sequential naming and prefix codes (e.g. CHK-001, CHK-002).\n\n"
        f"Task details: Designing '{label_type}' label. Context: {details or 'General purpose label design.'}"
    )


if __name__ == "__main__":
    mcp.run()


