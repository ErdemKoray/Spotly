from pydantic import BaseModel
from typing import Literal


class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    route_type: Literal['photo', 'tourist']


class PlaceInRoute(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    photo_score: float
    tourist_score: float
    order: int


class RouteOption(BaseModel):
    id: str
    label: str
    description: str
    places: list[PlaceInRoute]
    waypoints: list[list[float]]
    total_distance_km: float
    estimated_minutes: int
    total_score: float


class RoutesResponse(BaseModel):
    routes: list[RouteOption]
    route_type: str
