import uuid
from sqlalchemy.exc import IntegrityError
from app.services.base import BaseService
from app.models.users import User

class UserService(BaseService):

    def get_user(self, user_id: str):
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str):
        return self.db.query(User).filter(User.email == email).first()

    def upsert_user(self, user_data: dict):
        # 1. Try to find user by ID
        user = None
        if user_data.get("id"):
            user = self.get_user(user_data["id"])
        
        # 2. If not found by ID, try to find by Email (Login Scenario)
        if not user and user_data.get("email"):
            user = self.get_user_by_email(user_data["email"])

        if user:
            # --- UPDATE EXISTING USER ---
            # Update fields but NEVER overwrite the ID
            for key, value in user_data.items():
                if key != "id" and value is not None:
                    setattr(user, key, value)
        else:
            # --- CREATE NEW USER ---
            # Ensure we have an ID if one wasn't provided
            if "id" not in user_data or not user_data["id"]:
                user_data["id"] = str(uuid.uuid4())
            
            # Set default profile image if missing
            if "profile_image_url" not in user_data:
                user_data["profile_image_url"] = ""
                
            user = User(**user_data)
            self.db.add(user)

        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            # Email already exists, rollback and fetch the existing user
            self.db.rollback()
            existing_user = self.get_user_by_email(user_data["email"])
            if existing_user:
                return existing_user
            # If somehow we still don't have a user, re-raise the error
            raise