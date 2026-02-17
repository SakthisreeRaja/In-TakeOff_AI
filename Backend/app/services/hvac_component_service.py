import uuid
from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.models.hvac_components import (
    HVACComponent,
    Material,
    Manufacturer,
    Model,
    OrientationEnum
)
from app.services.base import BaseService


class HVACComponentService(BaseService):
    """Service for managing HVAC components and related entities"""

    # =====================
    # HVAC COMPONENT CRUD
    # =====================

    def get_component_by_id(self, component_id: str) -> Optional[HVACComponent]:
        """Get HVAC component by ID with related data"""
        return (
            self.db.query(HVACComponent)
            .options(
                joinedload(HVACComponent.material),
                joinedload(HVACComponent.manufacturer),
                joinedload(HVACComponent.model)
            )
            .filter(HVACComponent.id == component_id)
            .first()
        )

    def get_components_by_project(self, project_id: str) -> List[HVACComponent]:
        """Get all HVAC components for a project"""
        return (
            self.db.query(HVACComponent)
            .options(
                joinedload(HVACComponent.material),
                joinedload(HVACComponent.manufacturer),
                joinedload(HVACComponent.model)
            )
            .filter(HVACComponent.project_id == project_id)
            .all()
        )

    def get_component_by_detection(self, detection_id: str) -> Optional[HVACComponent]:
        """Get HVAC component by detection ID"""
        return (
            self.db.query(HVACComponent)
            .filter(HVACComponent.detection_id == detection_id)
            .first()
        )

    def create_component(self, data: Dict[str, Any]) -> HVACComponent:
        """Create a new HVAC component"""
        # Check if component already exists for this detection
        existing = self.get_component_by_detection(data.get("detection_id"))
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"HVAC component already exists for detection {data.get('detection_id')}"
            )

        # Validate orientation if provided
        if "orientation" in data and data["orientation"] is not None:
            try:
                OrientationEnum(data["orientation"])
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid orientation. Must be one of: {[e.value for e in OrientationEnum]}"
                )

        try:
            component = HVACComponent(
                id=uuid.uuid4(),
                **data
            )
            self.db.add(component)
            self.db.commit()
            self.db.refresh(component)
            return component
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    def update_component(self, component_id: str, updates: Dict[str, Any]) -> HVACComponent:
        """Update an existing HVAC component"""
        component = self.get_component_by_id(component_id)
        if not component:
            raise HTTPException(status_code=404, detail="HVAC component not found")

        # Validate orientation if being updated
        if "orientation" in updates and updates["orientation"] is not None:
            try:
                OrientationEnum(updates["orientation"])
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid orientation. Must be one of: {[e.value for e in OrientationEnum]}"
                )

        try:
            for key, value in updates.items():
                if hasattr(component, key) and value is not None:
                    setattr(component, key, value)
            
            self.db.commit()
            self.db.refresh(component)
            return component
        except IntegrityError as e:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    def delete_component(self, component_id: str) -> bool:
        """Delete an HVAC component"""
        component = self.get_component_by_id(component_id)
        if not component:
            raise HTTPException(status_code=404, detail="HVAC component not found")

        self.db.delete(component)
        self.db.commit()
        return True

    # =====================
    # MATERIAL CRUD
    # =====================

    def get_all_materials(self) -> List[Material]:
        """Get all materials"""
        return self.db.query(Material).order_by(Material.name).all()

    def get_material_by_id(self, material_id: str) -> Optional[Material]:
        """Get material by ID"""
        return self.db.query(Material).filter(Material.id == material_id).first()

    def create_material(self, name: str) -> Material:
        """Create a new material"""
        try:
            material = Material(id=uuid.uuid4(), name=name)
            self.db.add(material)
            self.db.commit()
            self.db.refresh(material)
            return material
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Material '{name}' already exists")

    def update_material(self, material_id: str, name: str) -> Material:
        """Update a material"""
        material = self.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        try:
            material.name = name
            self.db.commit()
            self.db.refresh(material)
            return material
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Material '{name}' already exists")

    def delete_material(self, material_id: str) -> bool:
        """Delete a material"""
        material = self.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        self.db.delete(material)
        self.db.commit()
        return True

    # =====================
    # MANUFACTURER CRUD
    # =====================

    def get_all_manufacturers(self) -> List[Manufacturer]:
        """Get all manufacturers"""
        return self.db.query(Manufacturer).order_by(Manufacturer.name).all()

    def get_manufacturer_by_id(self, manufacturer_id: str) -> Optional[Manufacturer]:
        """Get manufacturer by ID"""
        return self.db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()

    def create_manufacturer(self, name: str) -> Manufacturer:
        """Create a new manufacturer"""
        try:
            manufacturer = Manufacturer(id=uuid.uuid4(), name=name)
            self.db.add(manufacturer)
            self.db.commit()
            self.db.refresh(manufacturer)
            return manufacturer
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Manufacturer '{name}' already exists")

    def update_manufacturer(self, manufacturer_id: str, name: str) -> Manufacturer:
        """Update a manufacturer"""
        manufacturer = self.get_manufacturer_by_id(manufacturer_id)
        if not manufacturer:
            raise HTTPException(status_code=404, detail="Manufacturer not found")

        try:
            manufacturer.name = name
            self.db.commit()
            self.db.refresh(manufacturer)
            return manufacturer
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"Manufacturer '{name}' already exists")

    def delete_manufacturer(self, manufacturer_id: str) -> bool:
        """Delete a manufacturer"""
        manufacturer = self.get_manufacturer_by_id(manufacturer_id)
        if not manufacturer:
            raise HTTPException(status_code=404, detail="Manufacturer not found")

        self.db.delete(manufacturer)
        self.db.commit()
        return True

    # =====================
    # MODEL CRUD
    # =====================

    def get_models_by_manufacturer(self, manufacturer_id: str) -> List[Model]:
        """Get all models for a manufacturer"""
        return (
            self.db.query(Model)
            .filter(Model.manufacturer_id == manufacturer_id)
            .order_by(Model.model_number)
            .all()
        )

    def get_model_by_id(self, model_id: str) -> Optional[Model]:
        """Get model by ID"""
        return (
            self.db.query(Model)
            .options(joinedload(Model.manufacturer))
            .filter(Model.id == model_id)
            .first()
        )

    def create_model(self, manufacturer_id: str, model_number: str) -> Model:
        """Create a new model"""
        # Verify manufacturer exists
        manufacturer = self.get_manufacturer_by_id(manufacturer_id)
        if not manufacturer:
            raise HTTPException(status_code=404, detail="Manufacturer not found")

        try:
            model = Model(
                id=uuid.uuid4(),
                manufacturer_id=manufacturer_id,
                model_number=model_number
            )
            self.db.add(model)
            self.db.commit()
            self.db.refresh(model)
            return model
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_number}' already exists for this manufacturer"
            )

    def update_model(self, model_id: str, manufacturer_id: Optional[str], model_number: Optional[str]) -> Model:
        """Update a model"""
        model = self.get_model_by_id(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")

        try:
            if manufacturer_id:
                # Verify new manufacturer exists
                manufacturer = self.get_manufacturer_by_id(manufacturer_id)
                if not manufacturer:
                    raise HTTPException(status_code=404, detail="Manufacturer not found")
                model.manufacturer_id = manufacturer_id
            
            if model_number:
                model.model_number = model_number

            self.db.commit()
            self.db.refresh(model)
            return model
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_number}' already exists for this manufacturer"
            )

    def delete_model(self, model_id: str) -> bool:
        """Delete a model"""
        model = self.get_model_by_id(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")

        self.db.delete(model)
        self.db.commit()
        return True

    # =====================
    # BULK OPERATIONS
    # =====================

    def bulk_create_components(self, components_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Bulk create HVAC components"""
        created = []
        failed = []

        for data in components_data:
            try:
                component = self.create_component(data)
                created.append(component)
            except HTTPException as e:
                failed.append({
                    "data": data,
                    "error": e.detail
                })
            except Exception as e:
                failed.append({
                    "data": data,
                    "error": str(e)
                })

        return {
            "created": created,
            "failed": failed
        }
