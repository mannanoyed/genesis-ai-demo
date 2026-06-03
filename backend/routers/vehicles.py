import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"
_vehicles_cache = None


def load_vehicles() -> list:
    global _vehicles_cache
    if _vehicles_cache is None:
        with open(DATA_DIR / "genesis_vehicles.json", "r") as f:
            _vehicles_cache = json.load(f)
    return _vehicles_cache


@router.get("/vehicles")
async def get_all_vehicles():
    """Get all Genesis vehicles with full specs."""
    vehicles = load_vehicles()
    return {"vehicles": vehicles, "count": len(vehicles)}


@router.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    """Get full specs for a specific vehicle by ID."""
    vehicles = load_vehicles()
    vehicle = next((v for v in vehicles if v["id"] == vehicle_id), None)

    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")

    return vehicle
