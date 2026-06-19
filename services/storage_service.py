import os
import logging
import uuid
import mimetypes
from typing import Optional, Tuple
from datetime import datetime
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Allowed file extensions & mime types for validation
ALLOWED_EXTENSIONS = {
    # Images
    "png", "jpg", "jpeg", "gif", "webp", "svg",
    # Documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
    # Archives
    "zip", "tar", "gz", "rar",
    # Code
    "json", "xml", "html", "css", "js", "ts", "py"
}

ALLOWED_MIME_TYPES = {
    # Images
    "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
    # Documents
    "application/pdf", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "text/csv",
    # Archives
    "application/zip", "application/x-tar", "application/gzip", "application/vnd.rar",
    # Code
    "application/json", "application/xml", "text/html", "text/css", 
    "application/javascript", "text/javascript", "text/x-python"
}

# Max file size: 10 MB (10 * 1024 * 1024 bytes)
MAX_FILE_SIZE = 10 * 1024 * 1024 

class StorageService:
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key_id = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.public_url = os.getenv("R2_PUBLIC_URL")

        self.use_simulator = not all([
            self.account_id,
            self.access_key_id,
            self.secret_access_key,
            self.bucket_name
        ])

        # ── Startup Diagnostics ──────────────────────────────────────────
        logger.info("=" * 60)
        logger.info("STORAGE SERVICE STARTUP DIAGNOSTICS")
        logger.info("=" * 60)
        logger.info(f"  R2_ACCOUNT_ID    : {'[SET]' if self.account_id else '[EMPTY]'}")
        logger.info(f"  R2_ACCESS_KEY_ID : {'[SET]' if self.access_key_id else '[EMPTY]'}")
        logger.info(f"  R2_SECRET_ACCESS : {'[SET]' if self.secret_access_key else '[EMPTY]'}")
        logger.info(f"  R2_BUCKET_NAME   : {self.bucket_name or '[EMPTY]'}")
        logger.info(f"  R2_PUBLIC_URL    : {self.public_url or '[EMPTY]'}")
        logger.info(f"  MODE             : {'☁️  CLOUDFLARE R2 (LIVE)' if not self.use_simulator else '💾 LOCAL SIMULATOR'}")

        # Always initialize local storage path for simulator fallback or safe testing
        self.local_storage_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            "local_storage_uploads"
        )
        os.makedirs(self.local_storage_path, exist_ok=True)

        if self.use_simulator:
            logger.warning(
                "Cloudflare R2 environment variables are not fully configured. "
                "Storage service will run in local simulation mode."
            )
            logger.info(f"  LOCAL PATH       : {self.local_storage_path}")
            logger.info(f"  CONNECTION TEST  : SKIPPED (simulator mode)")
        else:
            # Initialize S3 client for Cloudflare R2
            endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"
            self.s3_client = boto3.client(
                service_name="s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
                config=Config(signature_version="s3v4"),
            )
            logger.info(f"  ENDPOINT URL     : {endpoint_url}")

            # Connection test — try to list objects (max 1) to verify credentials
            try:
                self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name, MaxKeys=1
                )
                logger.info(f"  CONNECTION TEST  : ✅ SUCCESS — bucket '{self.bucket_name}' reachable")
            except ClientError as e:
                error_code = e.response["Error"]["Code"]
                logger.error(f"  CONNECTION TEST  : ❌ FAILED — {error_code}: {e}")
            except Exception as e:
                logger.error(f"  CONNECTION TEST  : ❌ FAILED — {e}")

            logger.info("Cloudflare R2 storage client successfully initialized.")

        logger.info("=" * 60)


    def list_files(self) -> list[dict]:
        """
        Lists all files in R2 storage (or local simulator).
        """
        if self.use_simulator:
            files_list = []
            try:
                for filename in os.listdir(self.local_storage_path):
                    filepath = os.path.join(self.local_storage_path, filename)
                    if os.path.isfile(filepath):
                        stat = os.stat(filepath)
                        mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
                        files_list.append({
                            "file_key": filename,
                            "filename": filename,
                            "size": stat.st_size,
                            "content_type": mime_type,
                            "url": self.generate_file_url(filename),
                            "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
                        })
            except Exception as e:
                logger.error(f"Failed to list files in local simulator: {e}")
            return files_list
        else:
            files_list = []
            try:
                response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
                for obj in response.get("Contents", []):
                    key = obj["Key"]
                    mime_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
                    files_list.append({
                        "file_key": key,
                        "filename": key,
                        "size": obj["Size"],
                        "content_type": mime_type,
                        "url": self.generate_file_url(key),
                        "updated_at": obj["LastModified"].isoformat()
                    })
            except Exception as e:
                logger.error(f"Failed to list files in Cloudflare R2: {e}")
            return files_list

    def validate_file(self, file_data: bytes, file_name: str, content_type: Optional[str] = None) -> Tuple[bool, str]:
        """
        Validates file type and file size.
        Returns (is_valid, error_message).
        """
        # Validate size
        if len(file_data) > MAX_FILE_SIZE:
            return False, f"File size exceeds the limit of {MAX_FILE_SIZE / (1024 * 1024)} MB."

        # Validate extension
        ext = file_name.split(".")[-1].lower() if "." in file_name else ""
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"File extension '.{ext}' is not supported."

        # Validate mime type
        mime = content_type or mimetypes.guess_type(file_name)[0]
        if mime and mime not in ALLOWED_MIME_TYPES:
            return False, f"Mime type '{mime}' is not supported."

        return True, ""

    def upload_file(self, file_data: bytes, file_name: str, content_type: Optional[str] = None) -> str:
        """
        Uploads file data to Cloudflare R2 (or local simulator if unconfigured).
        Generates a unique key for the file to prevent overwrite.
        Returns the generated file key.
        """
        # 1. Validate
        is_valid, err_msg = self.validate_file(file_data, file_name, content_type)
        if not is_valid:
            raise ValueError(err_msg)

        # 2. Generate unique key
        ext = file_name.split(".")[-1].lower() if "." in file_name else ""
        unique_id = uuid.uuid4().hex
        file_key = f"{unique_id}.{ext}" if ext else unique_id

        # Guess mime type if not provided
        if not content_type:
            content_type = mimetypes.guess_type(file_name)[0] or "application/octet-stream"

        # 3. Perform upload
        if self.use_simulator:
            try:
                dest_path = os.path.join(self.local_storage_path, file_key)
                with open(dest_path, "wb") as f:
                    f.write(file_data)
                logger.info(f"[R2 SIMULATOR] Uploaded file to local storage: {dest_path}")
                return file_key
            except Exception as e:
                logger.error(f"Failed to write file to local simulator storage: {e}")
                raise RuntimeError(f"Simulator upload failed: {e}")
        else:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=file_key,
                    Body=file_data,
                    ContentType=content_type,
                )
                logger.info(f"[Cloudflare R2] Successfully uploaded file: {file_key}")
                return file_key
            except ClientError as e:
                logger.error(f"Cloudflare R2 upload client error: {e}")
                raise RuntimeError(f"Cloudflare R2 upload failed: {e}")
            except Exception as e:
                logger.error(f"Cloudflare R2 upload unexpected error: {e}")
                raise RuntimeError(f"Cloudflare R2 upload failed: {e}")

    def delete_file(self, file_key: str) -> bool:
        """
        Deletes a file from Cloudflare R2 (or local simulator).
        Returns True if successful, False otherwise.
        """
        if self.use_simulator:
            try:
                filepath = os.path.join(self.local_storage_path, file_key)
                if os.path.exists(filepath):
                    os.remove(filepath)
                    logger.info(f"[R2 SIMULATOR] Deleted file from local storage: {filepath}")
                    return True
                logger.warning(f"[R2 SIMULATOR] File key not found for deletion: {file_key}")
                return False
            except Exception as e:
                logger.error(f"Failed to delete file from local simulator storage: {e}")
                return False
        else:
            try:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=file_key
                )
                logger.info(f"[Cloudflare R2] Successfully deleted file: {file_key}")
                return True
            except ClientError as e:
                logger.error(f"Cloudflare R2 delete client error for key {file_key}: {e}")
                return False
            except Exception as e:
                logger.error(f"Cloudflare R2 delete unexpected error for key {file_key}: {e}")
                return False

    def generate_file_url(self, file_key: str) -> str:
        """
        Generates the public access URL for a file key.
        """
        if self.use_simulator:
            # Return a mock localhost URL for dev/testing
            return f"http://127.0.0.1:8000/static/uploads/{file_key}"
        
        # Use custom public R2 domain url if configured, otherwise fall back to Cloudflare public dev URL structure
        base_url = self.public_url.rstrip("/") if self.public_url else f"https://{self.bucket_name}.r2.dev"
        return f"{base_url}/{file_key}"

# Singleton instance of StorageService
storage_service = StorageService()
