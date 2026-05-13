from pydantic import BaseModel


class PlaceResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    photo_score: float
    tourist_score: float

    model_config = {"from_attributes": True}


class PlaceBriefResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}
