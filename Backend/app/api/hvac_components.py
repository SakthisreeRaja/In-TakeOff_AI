from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.hvac_component_service import HVACComponentService
from app.schemas.hvac_components import (
    # HVAC Component schemas
    HVACComponentCreate,
    HVACComponentUpdate,
    HVACComponentResponse,
    HVACComponentBulkCreate,
    HVACComponentBulkResponse,
    # Material schemas
    MaterialCreate,
    MaterialUpdate,
    MaterialResponse,
    # Manufacturer schemas
    ManufacturerCreate,
    ManufacturerUpdate,
    ManufacturerResponse,
    # Model schemas
    ModelCreate,
    ModelUpdate,
    ModelResponse,
)

router = APIRouter()


def get_hvac_service(db: Session = Depends(get_db)) -> HVACComponentService:
    """Dependency to get HVAC component service"""
    return HVACComponentService(db)


# ==============================
# HVAC COMPONENT ENDPOINTS
# ==============================

@router.post("/components", response_model=HVACComponentResponse, status_code=201)
def create_hvac_component(
    component: HVACComponentCreate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Create a new HVAC component"""
    return service.create_component(component.model_dump())


@router.get("/components/{component_id}", response_model=HVACComponentResponse)
def get_hvac_component(
    component_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get HVAC component by ID"""
    component = service.get_component_by_id(component_id)
    if not component:
        raise HTTPException(status_code=404, detail="HVAC component not found")
    return component


@router.get("/projects/{project_id}/components", response_model=List[HVACComponentResponse])
def get_project_hvac_components(
    project_id: str,
    tag: str = None,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get all HVAC components for a project, optionally filtered by tag"""
    components = service.get_components_by_project(project_id)
    
    # Filter by tag if provided
    if tag:
        components = [c for c in components if c.tag and tag.lower() in c.tag.lower()]
    
    return components


@router.get("/detections/{detection_id}/component", response_model=HVACComponentResponse)
def get_component_by_detection(
    detection_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get HVAC component by detection ID"""
    component = service.get_component_by_detection(detection_id)
    if not component:
        raise HTTPException(status_code=404, detail="No HVAC component found for this detection")
    return component


@router.patch("/components/{component_id}", response_model=HVACComponentResponse)
def update_hvac_component(
    component_id: str,
    updates: HVACComponentUpdate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Update an HVAC component"""
    update_data = updates.model_dump(exclude_unset=True)
    return service.update_component(component_id, update_data)


@router.delete("/components/{component_id}", status_code=204)
def delete_hvac_component(
    component_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Delete an HVAC component"""
    service.delete_component(component_id)
    return None


@router.post("/components/bulk", response_model=HVACComponentBulkResponse, status_code=201)
def bulk_create_hvac_components(
    bulk_data: HVACComponentBulkCreate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Bulk create HVAC components"""
    components_data = [comp.model_dump() for comp in bulk_data.components]
    return service.bulk_create_components(components_data)


# ==============================
# MATERIAL ENDPOINTS
# ==============================

@router.get("/materials", response_model=List[MaterialResponse])
def get_all_materials(
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get all materials"""
    return service.get_all_materials()


@router.post("/materials", response_model=MaterialResponse, status_code=201)
def create_material(
    material: MaterialCreate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Create a new material"""
    return service.create_material(material.name)


@router.get("/materials/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get material by ID"""
    material = service.get_material_by_id(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.patch("/materials/{material_id}", response_model=MaterialResponse)
def update_material(
    material_id: str,
    updates: MaterialUpdate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Update a material"""
    if not updates.name:
        raise HTTPException(status_code=400, detail="Name is required")
    return service.update_material(material_id, updates.name)


@router.delete("/materials/{material_id}", status_code=204)
def delete_material(
    material_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Delete a material"""
    service.delete_material(material_id)
    return None


# ==============================
# MANUFACTURER ENDPOINTS
# ==============================

@router.get("/manufacturers", response_model=List[ManufacturerResponse])
def get_all_manufacturers(
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get all manufacturers"""
    return service.get_all_manufacturers()


@router.post("/manufacturers", response_model=ManufacturerResponse, status_code=201)
def create_manufacturer(
    manufacturer: ManufacturerCreate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Create a new manufacturer"""
    return service.create_manufacturer(manufacturer.name)


@router.get("/manufacturers/{manufacturer_id}", response_model=ManufacturerResponse)
def get_manufacturer(
    manufacturer_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get manufacturer by ID"""
    manufacturer = service.get_manufacturer_by_id(manufacturer_id)
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return manufacturer


@router.patch("/manufacturers/{manufacturer_id}", response_model=ManufacturerResponse)
def update_manufacturer(
    manufacturer_id: str,
    updates: ManufacturerUpdate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Update a manufacturer"""
    if not updates.name:
        raise HTTPException(status_code=400, detail="Name is required")
    return service.update_manufacturer(manufacturer_id, updates.name)


@router.delete("/manufacturers/{manufacturer_id}", status_code=204)
def delete_manufacturer(
    manufacturer_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Delete a manufacturer"""
    service.delete_manufacturer(manufacturer_id)
    return None


# ==============================
# MODEL ENDPOINTS
# ==============================

@router.get("/manufacturers/{manufacturer_id}/models", response_model=List[ModelResponse])
def get_manufacturer_models(
    manufacturer_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get all models for a manufacturer"""
    return service.get_models_by_manufacturer(manufacturer_id)


@router.post("/models", response_model=ModelResponse, status_code=201)
def create_model(
    model: ModelCreate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Create a new model"""
    return service.create_model(str(model.manufacturer_id), model.model_number)


@router.get("/models/{model_id}", response_model=ModelResponse)
def get_model(
    model_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Get model by ID"""
    model = service.get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.patch("/models/{model_id}", response_model=ModelResponse)
def update_model(
    model_id: str,
    updates: ModelUpdate,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Update a model"""
    manufacturer_id = str(updates.manufacturer_id) if updates.manufacturer_id else None
    return service.update_model(model_id, manufacturer_id, updates.model_number)


@router.delete("/models/{model_id}", status_code=204)
def delete_model(
    model_id: str,
    service: HVACComponentService = Depends(get_hvac_service)
):
    """Delete a model"""
    service.delete_model(model_id)
    return None
