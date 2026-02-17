"""Add tag to HVAC components

Revision ID: g6h7i8j9k0l1
Revises: f5b6c7d8e9f0
Create Date: 2026-02-17 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g6h7i8j9k0l1'
down_revision: Union[str, None] = 'f5b6c7d8e9f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tag column to hvac_components table
    op.add_column('hvac_components', sa.Column('tag', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove tag column from hvac_components table
    op.drop_column('hvac_components', 'tag')
