"""
Seed script to populate initial HVAC materials, manufacturers, and models
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.hvac_components import Material, Manufacturer, Model

def seed_materials(db: Session):
    """Seed initial materials"""
    materials_data = [
        {"name": "Aluminum"},
        {"name": "Steel"},
        {"name": "Galvanized Steel"},
        {"name": "Stainless Steel"},
        {"name": "Plastic"},
        {"name": "Fiberglass"},
    ]
    
    existing = db.query(Material).first()
    if existing:
        print("Materials already exist, skipping...")
        return
    
    for mat_data in materials_data:
        material = Material(**mat_data)
        db.add(material)
    
    db.commit()
    print(f"✅ Seeded {len(materials_data)} materials")

def seed_manufacturers(db: Session):
    """Seed initial manufacturers with models"""
    manufacturers_data = [
        {
            "name": "Titus",
            "models": ["T-123", "T-456", "T-789", "RL-200", "RL-400"]
        },
        {
            "name": "Price Industries",
            "models": ["GRD-500", "GRD-600", "CV-100", "CV-200"]
        },
        {
            "name": "Krueger",
            "models": ["K-100", "K-200", "K-300", "SD-50"]
        },
        {
            "name": "Nailor",
            "models": ["N-500", "N-600", "DWG-100"]
        },
        {
            "name": "Metalaire",
            "models": ["M-100", "M-200", "M-300"]
        },
    ]
    
    existing = db.query(Manufacturer).first()
    if existing:
        print("Manufacturers already exist, skipping...")
        return
    
    for mfr_data in manufacturers_data:
        manufacturer = Manufacturer(name=mfr_data["name"])
        db.add(manufacturer)
        db.flush()  # Get the manufacturer ID
        
        # Add models for this manufacturer
        for model_number in mfr_data["models"]:
            model = Model(
                manufacturer_id=manufacturer.id,
                model_number=model_number
            )
            db.add(model)
    
    db.commit()
    print(f"✅ Seeded {len(manufacturers_data)} manufacturers with models")

def main():
    """Main seed function"""
    print("🌱 Starting HVAC data seeding...")
    
    db = SessionLocal()
    try:
        seed_materials(db)
        seed_manufacturers(db)
        print("✅ HVAC data seeding completed successfully!")
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
