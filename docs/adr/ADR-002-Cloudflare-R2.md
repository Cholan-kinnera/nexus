# ADR-002: Cloudflare R2 for Object Storage

## Status
Accepted

## Context
Nexus PM supports file uploads, user avatars, and task attachments. Saving these assets directly to the API container's local disk is unsustainable for production because:
1. Render container filesystems are ephemeral (wiped on deploy or restart).
2. Local disks do not scale horizontally across multiple instances.

To solve this, we needed S3-compatible cloud object storage. We evaluated:
1. **AWS S3 (Simple Storage Service):** The industry standard, but charges egress fees when users download files.
2. **Cloudflare R2:** S3-compatible API with zero egress fees.

## Decision
We decided to adopt **Cloudflare R2** for file and asset storage, with an automated local file system simulator fallback for development.

### Key Factors:
* **Zero Egress Fees:** Cloudflare R2 does not charge for outbound bandwidth when clients retrieve files. This eliminates scaling cost spikes.
* **S3 Compatibility:** Uses standard AWS S3 API protocols, allowing us to utilize Python's standard `boto3` library for client initialization and operations.
* **Developer Fallback:** Designed the `StorageService` to run in local folder simulation mode if R2 keys are omitted. This allows developers to test locally without needing cloud keys.

## Consequences
* **Client Implementation:** The backend uses standard `boto3` client calls (`put_object`, `delete_object`) configured with a custom endpoint URL (`https://{account_id}.r2.cloudflarestorage.com`).
* **Environment Variables:** Developers must configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` to activate live storage.
* **Metadata Persistence:** The file object is uploaded to R2, and its generated unique URL is saved in PostgreSQL (`task_attachments`), allowing fast lookup and referential integrity.
