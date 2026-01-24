from app.services.base import BaseService
from app.models.users import User

class UserService(BaseService):

    def get_user(self, user_id: str):
        return self.db.query(User).filter(User.id == user_id).first()

    def upsert_user(self, user_data: dict):
        # Ensure profile_image_url has a default value if not provided
        if 'profile_image_url' not in user_data or user_data['profile_image_url'] is None:
            user_data['profile_image_url'] = ""
            
        user = self.get_user(user_data["id"])
        if user:
            for key, value in user_data.items():
                setattr(user, key, value)
        else:
            user = User(**user_data)
            self.db.add(user)

        self.db.commit()
        self.db.refresh(user)
        return user
