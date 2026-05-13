from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from features.places.models import Place
from features.places.schemas import PlaceResponse

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=list[PlaceResponse])
def get_places(db: Session = Depends(get_db)):
    return db.query(Place).order_by(Place.id).all()
