from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from features.auth.models import User
from .models import SavedRoute
from .schemas import SavedRouteCreate, SavedRouteResponse

router = APIRouter(prefix="/saved-routes", tags=["saved-routes"])


@router.post("", response_model=SavedRouteResponse, status_code=201)
def save_route(
    body: SavedRouteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = SavedRoute(user_id=current_user.id, **body.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


@router.get("", response_model=list[SavedRouteResponse])
def list_routes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SavedRoute)
        .filter(SavedRoute.user_id == current_user.id)
        .order_by(SavedRoute.created_at.desc())
        .all()
    )


@router.delete("/{route_id}", status_code=204)
def delete_route(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    route = (
        db.query(SavedRoute)
        .filter(SavedRoute.id == route_id, SavedRoute.user_id == current_user.id)
        .first()
    )
    if route:
        db.delete(route)
        db.commit()
