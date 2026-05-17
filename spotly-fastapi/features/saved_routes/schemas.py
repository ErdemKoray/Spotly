from datetime import datetime
from pydantic import BaseModel
from typing import Literal


class SavedRouteCreate(BaseModel):
    route_type: Literal['photo', 'tourist']
    label: str
    description: str
    total_distance_km: float
    estimated_minutes: int
    stop_count: int
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    start_name: str | None = None
    end_name: str | None = None


class SavedRouteResponse(BaseModel):
    id: int
    route_type: str
    label: str
    description: str
    total_distance_km: float
    estimated_minutes: int
    stop_count: int
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    start_name: str | None
    end_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
