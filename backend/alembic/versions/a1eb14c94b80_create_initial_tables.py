"""create_initial_tables

Revision ID: a1eb14c94b80
Revises: 07dcefad5570
Create Date: 2026-09-07 14:22:22.093838

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1eb14c94b80'
down_revision: Union[str, Sequence[str], None] = '07dcefad5570'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
