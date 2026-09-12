"""initial_tables

Revision ID: 07dcefad5570
Revises: 3233305714a2
Create Date: 2026-09-07 14:20:31.394892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07dcefad5570'
down_revision: Union[str, Sequence[str], None] = '3233305714a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
