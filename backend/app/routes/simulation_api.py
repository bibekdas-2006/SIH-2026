from fastapi import APIRouter
from typing import Dict, Any
from ..simulator.iot_streamer import stream_simulator

router = APIRouter(prefix="/simulation", tags=["Simulation Engine"])

@router.get("/status")
def get_simulation_status():
    return {
        "current_scenario": stream_simulator.scenario,
        "available_scenarios": [
            {
                "id": "NORMAL",
                "name": "Clear Autumn / Normal Baseline",
                "description": "Routine dry weather, baseline slope stability, minimal pore pressure, normal traffic."
            },
            {
                "id": "MONSOON_TORRENTIAL",
                "name": "Monsoon Torrential Rain Storm",
                "description": "Widespread cloudburst across Meghalaya & Assam (38–65 mm/hr rain), soil moisture > 85%, rising slope pore pressures."
            },
            {
                "id": "SLOPE_ANOMALY",
                "name": "Sudden Slope Failure Anomaly (Sohra/Haflong)",
                "description": "Catastrophic sudden shear displacement (0.88°/hr) & micro-seismic shock, triggering immediate fast-path evacuation alarm."
            },
            {
                "id": "FLASH_FLOOD",
                "name": "Teesta / River Valley Flash Surge",
                "description": "High hydraulic surcharge causing toe erosion and road corridor collapses along NH-10 & NH-27."
            }
        ]
    }

@router.post("/scenario")
def set_scenario(payload: Dict[str, Any]):
    scenario_id = payload.get("scenario", "NORMAL")
    res = stream_simulator.set_scenario(scenario_id)
    return res
