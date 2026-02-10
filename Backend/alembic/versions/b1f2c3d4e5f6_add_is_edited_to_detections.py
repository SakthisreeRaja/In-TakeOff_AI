"""add_is_edited_to_detections

Revision ID: b1f2c3d4e5f6
Revises: a6c3e4e6e4e5
Create Date: 2026-02-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1f2c3d4e5f6"
down_revision: Union[str, None] = "a6c3e4e6e4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "detections",
        sa.Column("is_edited", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("detections", "is_edited", server_default=None)


def downgrade() -> None:
    op.drop_column("detections", "is_edited")
