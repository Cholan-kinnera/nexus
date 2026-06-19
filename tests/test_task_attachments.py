import os
import unittest
import httpx
from fastapi import status
from main import app
from db.database import AsyncSessionLocal
from models.user import User
from models.project import Project
from models.project_member import ProjectMember
from models.task import Task
from models.task_attachment import TaskAttachment
from core.security import hash_password, create_access_token
from services.storage_service import storage_service
from sqlalchemy import select, delete


class TestTaskAttachments(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Configure storage service to use simulator for safe local file testing
        self.original_use_simulator = storage_service.use_simulator
        storage_service.use_simulator = True

        self.db = AsyncSessionLocal()

        # 1. Clean up potential leftovers
        await self.cleanup_db()

        # 2. Create testing users
        self.owner_user = User(
            full_name="Owner User",
            email="owner@test.com",
            password=hash_password("password123"),
            auth_provider="local",
        )
        self.dev_user = User(
            full_name="Developer User",
            email="dev@test.com",
            password=hash_password("password123"),
            auth_provider="local",
        )
        self.viewer_user = User(
            full_name="Viewer User",
            email="viewer@test.com",
            password=hash_password("password123"),
            auth_provider="local",
        )
        self.outsider_user = User(
            full_name="Outsider User",
            email="outsider@test.com",
            password=hash_password("password123"),
            auth_provider="local",
        )

        self.db.add_all(
            [self.owner_user, self.dev_user, self.viewer_user, self.outsider_user]
        )
        await self.db.commit()
        await self.db.refresh(self.owner_user)
        await self.db.refresh(self.dev_user)
        await self.db.refresh(self.viewer_user)
        await self.db.refresh(self.outsider_user)

        # 3. Create test project owned by owner_user
        self.project = Project(
            title="Test Project",
            description="Test Description",
            owner_id=self.owner_user.id,
        )
        self.db.add(self.project)
        await self.db.commit()
        await self.db.refresh(self.project)

        # 4. Add project members
        self.owner_member = ProjectMember(
            project_id=self.project.id, user_id=self.owner_user.id, role="owner"
        )
        self.dev_member = ProjectMember(
            project_id=self.project.id, user_id=self.dev_user.id, role="developer"
        )
        self.viewer_member = ProjectMember(
            project_id=self.project.id, user_id=self.viewer_user.id, role="viewer"
        )
        self.db.add_all([self.owner_member, self.dev_member, self.viewer_member])
        await self.db.commit()

        # 5. Create test task
        self.task = Task(
            title="Test Task",
            description="Test Task Description",
            project_id=self.project.id,
            status="TODO",
            priority="MEDIUM",
        )
        self.db.add(self.task)
        await self.db.commit()
        await self.db.refresh(self.task)

        # 6. Generate access tokens
        self.owner_token = create_access_token(data={"sub": self.owner_user.email})
        self.dev_token = create_access_token(data={"sub": self.dev_user.email})
        self.viewer_token = create_access_token(data={"sub": self.viewer_user.email})
        self.outsider_token = create_access_token(
            data={"sub": self.outsider_user.email}
        )

        # Keep track of file keys created during tests to verify deletion/cleanup
        self.created_file_keys = []

    async def asyncTearDown(self):
        # Clean up files created in simulator path
        for key in self.created_file_keys:
            filepath = os.path.join(storage_service.local_storage_path, key)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass

        await self.cleanup_db()
        await self.db.close()
        storage_service.use_simulator = self.original_use_simulator

    async def cleanup_db(self):
        # We delete our testing entities in the correct dependency order
        await self.db.execute(delete(TaskAttachment))
        await self.db.execute(delete(ProjectMember))
        await self.db.execute(delete(Task))
        await self.db.execute(delete(Project))
        for user_email in [
            "owner@test.com",
            "dev@test.com",
            "viewer@test.com",
            "outsider@test.com",
        ]:
            await self.db.execute(delete(User).where(User.email == user_email))
        await self.db.commit()

    async def test_attachment_lifecycle(self):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://127.0.0.1"
        ) as client:
            # 1. Test POST upload - valid file by developer
            file_content = b"This is a test document content for task attachments integration tests."
            files = {"file": ("document.txt", file_content, "text/plain")}
            headers = {"Authorization": f"Bearer {self.dev_token}"}

            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments", files=files, headers=headers
            )
            if response.status_code != status.HTTP_201_CREATED:
                print("UPLOAD FAILED RESP:", response.status_code, response.text)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            res_data = response.json()
            self.assertEqual(res_data["file_name"], "document.txt")
            self.assertEqual(res_data["file_size"], len(file_content))
            self.assertEqual(res_data["mime_type"], "text/plain")
            self.assertIn("file_key", res_data)
            self.assertIn("file_url", res_data)
            self.assertEqual(res_data["user"]["email"], "dev@test.com")

            attachment_id = res_data["id"]
            file_key = res_data["file_key"]
            self.created_file_keys.append(file_key)

            # Verify file exists on disk in simulator
            filepath = os.path.join(storage_service.local_storage_path, file_key)
            self.assertTrue(os.path.exists(filepath))

            # 2. Test GET attachments list by viewer (viewers can view)
            headers_viewer = {"Authorization": f"Bearer {self.viewer_token}"}
            response = await client.get(
                f"/api/tasks/{self.task.id}/attachments", headers=headers_viewer
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            attachments = response.json()
            self.assertEqual(len(attachments), 1)
            self.assertEqual(attachments[0]["id"], attachment_id)

            # 3. Test POST upload - CSV file by owner
            csv_content = b"header1,header2\nvalue1,value2"
            files_csv = {"file": ("data.csv", csv_content, "text/csv")}
            headers_owner = {"Authorization": f"Bearer {self.owner_token}"}

            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments",
                files=files_csv,
                headers=headers_owner,
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            csv_data = response.json()
            self.assertEqual(csv_data["file_name"], "data.csv")
            self.created_file_keys.append(csv_data["file_key"])
            csv_attachment_id = csv_data["id"]

            # 4. Test POST upload - XLSX file by dev
            xlsx_content = b"fake-xlsx-binary-content"
            files_xlsx = {
                "file": (
                    "sheet.xlsx",
                    xlsx_content,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            }
            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments",
                files=files_xlsx,
                headers=headers,
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            xlsx_data = response.json()
            self.assertEqual(xlsx_data["file_name"], "sheet.xlsx")
            self.created_file_keys.append(xlsx_data["file_key"])

            # 5. Test POST upload - viewer block
            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments",
                files={"file": ("viewer.txt", b"viewer", "text/plain")},
                headers=headers_viewer,
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

            # 6. Test POST upload - outsider block
            headers_outsider = {"Authorization": f"Bearer {self.outsider_token}"}
            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments",
                files={"file": ("outsider.txt", b"outsider", "text/plain")},
                headers=headers_outsider,
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

            # 7. Test POST upload - oversized file (> 10MB)
            oversized_content = b"x" * (10 * 1024 * 1024 + 1)
            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments",
                files={"file": ("big.txt", oversized_content, "text/plain")},
                headers=headers,
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("File size exceeds", response.json()["detail"])

            # 8. Test POST upload - invalid format (e.g. .exe / application/x-msdownload)
            response = await client.post(
                f"/api/tasks/{self.task.id}/attachments",
                files={"file": ("virus.exe", b"malware", "application/octet-stream")},
                headers=headers,
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("is not supported", response.json()["detail"])

            # 9. Test GET attachments list - outsider block
            response = await client.get(
                f"/api/tasks/{self.task.id}/attachments", headers=headers_outsider
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

            # 10. Test DELETE - unauthorized user delete block (outsider try to delete dev's attachment)
            response = await client.delete(
                f"/api/tasks/attachments/{attachment_id}", headers=headers_outsider
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

            # 11. Test DELETE - viewer delete block (viewer try to delete dev's attachment)
            response = await client.delete(
                f"/api/tasks/attachments/{attachment_id}", headers=headers_viewer
            )
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

            # 12. Test DELETE - uploader delete success (dev deletes document.txt)
            response = await client.delete(
                f"/api/tasks/attachments/{attachment_id}", headers=headers
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            # Verify file deleted from disk simulator
            self.assertFalse(os.path.exists(filepath))

            # 13. Test DELETE - owner delete success (owner deletes dev's csv_attachment_id)
            response = await client.delete(
                f"/api/tasks/attachments/{csv_attachment_id}", headers=headers_owner
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
