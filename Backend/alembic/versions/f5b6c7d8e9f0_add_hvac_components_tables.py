"""add_hvac_components_tables

Revision ID: f5b6c7d8e9f0
Revises: e4a5c3d9f1b7
Create Date: 2026-02-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f5b6c7d8e9f0"
down_revision: Union[str, None] = "e4a5c3d9f1b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum already exists in database, skip creation
    
    # Create materials table
    op.create_table(
        'materials',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    
    # Create manufacturers table
    op.create_table(
        'manufacturers',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(150), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    
    # Create models table
    op.create_table(
        'models',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('manufacturer_id', sa.String(), nullable=False),
        sa.Column('model_number', sa.String(150), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['manufacturer_id'], ['manufacturers.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('manufacturer_id', 'model_number', name='uq_model_per_manufacturer'),
    )
    
    # Create hvac_components table
    op.create_table(
        'hvac_components',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), nullable=False, index=True),
        sa.Column('detection_id', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('class_name', sa.String(100), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('neck_size', sa.String(50), nullable=True),
        sa.Column('face_size', sa.String(50), nullable=True),
        sa.Column('inlet_size', sa.String(50), nullable=True),
        sa.Column('cfm', sa.Integer(), nullable=True),
        sa.Column('orientation', sa.String(20), nullable=True, server_default='0_deg'),
        sa.Column('material_id', sa.String(), nullable=True),
        sa.Column('manufacturer_id', sa.String(), nullable=True),
        sa.Column('model_id', sa.String(), nullable=True),
        sa.Column('unit_cost', sa.Numeric(12, 2), nullable=True),
        sa.Column('total_cost', sa.Numeric(14, 2), nullable=True),
        sa.Column('boq_code', sa.String(100), nullable=True),
        sa.Column('section', sa.String(100), nullable=True),
        sa.Column('specification_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['detection_id'], ['detections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ),
        sa.ForeignKeyConstraint(['manufacturer_id'], ['manufacturers.id'], ),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
    )


def downgrade() -> None:
    op.drop_table('hvac_components')
    op.drop_table('models')
    op.drop_table('manufacturers')
    op.drop_table('materials')
    op.execute("DROP TYPE IF EXISTS orientation_enum")
