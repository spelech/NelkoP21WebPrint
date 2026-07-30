import os
import json
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/templates", tags=["Template Storage"])

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "templates")
os.makedirs(TEMPLATES_DIR, exist_ok=True)

def init_stock_templates():
    stock = {
        "asset_tag": {
            "name": "Asset Tag (Standard)",
            "width_mm": 40.0,
            "height_mm": 14.0,
            "gap_mm": 5.0,
            "elements": [
                { "id": 1, "type": "text", "content": "PROPERTY OF WILEYRILEY", "fontSize": 12, "fontStyle": "bold", "x": 50, "y": 20 },
                { "id": 2, "type": "text", "content": "{{name}}", "fontSize": 10, "fontStyle": "normal", "x": 50, "y": 50 },
                { "id": 3, "type": "qr", "content": "{{url}}", "x": 50, "y": 80, "size": 35 }
            ]
        },
        "cable_flag": {
            "name": "Cable Wrap Flag",
            "width_mm": 50.0,
            "height_mm": 15.0,
            "gap_mm": 5.0,
            "elements": [
                { "id": 1, "type": "text", "content": "{{name}}", "fontSize": 12, "fontStyle": "bold", "x": 25, "y": 50 },
                { "id": 2, "type": "text", "content": "{{name}}", "fontSize": 12, "fontStyle": "bold", "x": 75, "y": 50 }
            ]
        },
        "box_label": {
            "name": "Storage Box Label",
            "width_mm": 40.0,
            "height_mm": 12.0,
            "gap_mm": 5.0,
            "elements": [
                { "id": 1, "type": "text", "content": "{{title}}", "fontSize": 16, "fontStyle": "bold", "x": 50, "y": 35 },
                { "id": 2, "type": "text", "content": "{{subtitle}}", "fontSize": 10, "fontStyle": "normal", "x": 50, "y": 75 }
            ]
        }
    }
    for tid, tdata in stock.items():
        path = os.path.join(TEMPLATES_DIR, f"{tid}.json")
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                json.dump(tdata, f, indent=2)

init_stock_templates()


@router.get("")
def list_templates() -> List[Dict[str, Any]]:
    """List saved label design templates."""
    templates = []
    for fname in os.listdir(TEMPLATES_DIR):
        if fname.endswith(".json"):
            try:
                with open(os.path.join(TEMPLATES_DIR, fname), "r", encoding="utf-8") as f:
                    data = json.load(f)
                    templates.append({
                        "id": fname[:-5],
                        "name": data.get("name", fname[:-5]),
                        "width_mm": data.get("width_mm", 14),
                        "height_mm": data.get("height_mm", 40),
                        "data": data
                    })
            except Exception:
                pass
    return templates

@router.get("/{template_id}")
def get_template(template_id: str):
    """Retrieve template details by ID."""
    filepath = os.path.join(TEMPLATES_DIR, f"{template_id}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Template not found")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/{template_id}")
def save_template(template_id: str, data: Dict[str, Any]):
    """Save or update label design template."""
    filepath = os.path.join(TEMPLATES_DIR, f"{template_id}.json")
    data["id"] = template_id
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return {"status": "saved", "id": template_id}

@router.delete("/{template_id}")
def delete_template(template_id: str):
    """Delete a template."""
    filepath = os.path.join(TEMPLATES_DIR, f"{template_id}.json")
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Template not found")
