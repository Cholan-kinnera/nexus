import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from dependencies.auth import get_current_user
from models.user import User
from services.storage_service import storage_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Uploads a file to the Cloudflare R2 storage bucket.
    Validates file size (max 10MB) and file format extensions.
    """
    try:
        file_data = await file.read()
        
        # Validate and upload
        file_key = storage_service.upload_file(
            file_data=file_data,
            file_name=file.filename or "uploaded_file",
            content_type=file.content_type
        )
        
        # Generate retrieval URL
        file_url = storage_service.generate_file_url(file_key)
        
        return {
            "file_key": file_key,
            "url": file_url,
            "filename": file.filename,
            "content_type": file.content_type
        }
    except ValueError as e:
        # Catch validation errors (size/type)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error occurred during file upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.delete("/delete/{file_key}")
async def delete_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
):
    """
    Deletes an uploaded file from Cloudflare R2 storage by its file key.
    """
    success = storage_service.delete_file(file_key)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete file. The key '{file_key}' may not exist."
        )
    return {
        "success": True,
        "message": f"File key '{file_key}' was deleted successfully."
    }

@router.get("", status_code=status.HTTP_200_OK)
async def list_files(
    current_user: User = Depends(get_current_user),
):
    """
    List all uploaded files in Cloudflare R2 storage (or local simulator).
    """
    try:
        return storage_service.list_files()
    except Exception as e:
        logger.error(f"Error occurred during file listing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )
