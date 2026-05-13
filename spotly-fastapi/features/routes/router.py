from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from .schemas import RouteRequest, RoutesResponse
from .logic import calculate_routes

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/calculate", response_model=RoutesResponse)
def calculate_route(req: RouteRequest, db: Session = Depends(get_db)):
    routes = calculate_routes(
        req.start_lat, req.start_lng,
        req.end_lat,   req.end_lng,
        req.route_type, db,
    )
    return RoutesResponse(routes=routes, route_type=req.route_type)
