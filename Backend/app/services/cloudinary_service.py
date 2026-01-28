import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

class CloudinaryService:
    @staticmethod
    def upload_pdf(file_content, filename: str):
        """Upload PDF to Cloudinary"""
        try:
            result = cloudinary.uploader.upload(
                file_content,
                resource_type="raw",  # For non-image files like PDFs
                public_id=f"pdfs/{filename}",
                format="pdf"
            )
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "file_size": result.get("bytes", 0)
            }
        except Exception as e:
            raise Exception(f"Failed to upload PDF to Cloudinary: {str(e)}")

    @staticmethod
    def upload_image(file_content, filename: str):
        """Upload image to Cloudinary"""
        try:
            result = cloudinary.uploader.upload(
                file_content,
                public_id=f"images/{filename}",
                transformation=[
                    {"width": 4000, "height": 3500, "crop": "limit"},
                    {"quality": 100 }
                ]
            )
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "file_size": result.get("bytes", 0)
            }
        except Exception as e:
            raise Exception(f"Failed to upload image to Cloudinary: {str(e)}")

    @staticmethod
    def delete_file(public_id: str, resource_type="image"):
        """Delete file from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return result["result"] == "ok"
        except Exception as e:
            raise Exception(f"Failed to delete from Cloudinary: {str(e)}")

    @staticmethod
    def get_image_with_transformations(public_id: str, transformations: dict = None):
        """Get image URL with optional transformations"""
        if transformations:
            return cloudinary.CloudinaryImage(public_id).build_url(**transformations)
        return cloudinary.CloudinaryImage(public_id).build_url()