"""add_company_phone_to_users

Revision ID: a6c3e4e6e4e5
Revises: d17d21803ea9
Create Date: 2026-01-26 11:43:17.137744

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6c3e4e6e4e5'
down_revision: Union[str, None] = 'd17d21803ea9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add company and phone columns to users table
    op.add_column('users', sa.Column('company', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove company and phone columns from users table
    op.drop_column('users', 'phone')
    op.drop_column('users', 'company')
