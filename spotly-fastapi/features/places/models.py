from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class Place(Base):
    __tablename__ = "places"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    photo_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tourist_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
