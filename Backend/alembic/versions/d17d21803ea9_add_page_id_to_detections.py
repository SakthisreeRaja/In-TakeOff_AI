from alembic import op
import sqlalchemy as sa

revision = "d17d21803ea9"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "detections",
        sa.Column("page_id", sa.String(), nullable=True)
    )

    op.create_foreign_key(
        "fk_detections_page",
        "detections",
        "pages",
        ["page_id"],
        ["id"]
    )

def downgrade():
    op.drop_constraint(
        "fk_detections_page",
        "detections",
        type_="foreignkey"
    )
    op.drop_column("detections", "page_id")
