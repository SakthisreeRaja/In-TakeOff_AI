"""remove_manual_item_detections

Revision ID: e4a5c3d9f1b7
Revises: b1f2c3d4e5f6
Create Date: 2026-02-13 12:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4a5c3d9f1b7"
down_revision: Union[str, None] = "b1f2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove legacy manual placeholders from stored detections.
    op.execute(
        sa.text(
            """
            DELETE FROM detections
            WHERE lower(replace(replace(replace(class_name, '_', ''), '-', ''), ' ', '')) = 'manualitem'
            """
        )
    )


def downgrade() -> None:
    # Deleted rows cannot be restored automatically.
    pass
