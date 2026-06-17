"""backfill_owner_project_members

Revision ID: b3f1a7d92e01
Revises: 028abf637114
Create Date: 2026-06-13 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision: str = 'b3f1a7d92e01'
down_revision: Union[str, Sequence[str], None] = '028abf637114'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Backfill project_members rows for existing project owners.

    For every project where the owner_id has no corresponding
    ProjectMember record, insert one with role='owner'.
    """
    conn = op.get_bind()

    # Find all projects whose owner is missing from project_members
    missing_owners = conn.execute(
        sa.text("""
            SELECT p.id AS project_id, p.owner_id
            FROM projects p
            WHERE p.owner_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM project_members pm
                  WHERE pm.project_id = p.id
                    AND pm.user_id = p.owner_id
              )
        """)
    ).fetchall()

    if not missing_owners:
        print("No projects missing owner membership — nothing to backfill.")
        return

    now = datetime.now(timezone.utc)
    print(f"Backfilling {len(missing_owners)} project(s) with owner membership...")

    for row in missing_owners:
        project_id = row[0]
        owner_id = row[1]
        conn.execute(
            sa.text("""
                INSERT INTO project_members (project_id, user_id, role, invited_by, joined_at)
                VALUES (:project_id, :user_id, 'owner', NULL, :joined_at)
                ON CONFLICT ON CONSTRAINT uq_project_member DO NOTHING
            """),
            {
                "project_id": project_id,
                "user_id": owner_id,
                "joined_at": now,
            },
        )

    print(f"Backfill complete: {len(missing_owners)} owner membership(s) inserted.")


def downgrade() -> None:
    """Remove backfilled owner memberships.

    Only removes rows that were auto-created by this migration
    (role='owner' AND invited_by IS NULL).
    """
    conn = op.get_bind()

    conn.execute(
        sa.text("""
            DELETE FROM project_members pm
            USING projects p
            WHERE pm.project_id = p.id
              AND pm.user_id = p.owner_id
              AND pm.role = 'owner'
              AND pm.invited_by IS NULL
        """)
    )
    print("Downgrade complete: backfilled owner memberships removed.")
