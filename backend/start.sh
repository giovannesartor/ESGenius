#!/bin/bash
echo "=== ESGenius Backend Startup ==="
echo "PORT=${PORT:-not set}"
echo "DATABASE_URL is ${DATABASE_URL:+configured}"
echo "REDIS_URL is ${REDIS_URL:+configured}"
echo "Python: $(python --version)"

echo ""
echo "=== Running Alembic Migrations ==="
alembic upgrade head 2>&1 || echo "WARNING: Alembic migration failed (this may be OK on first run)"

echo ""
echo "=== Creating tables (fallback) ==="
python -c "
import asyncio
from app.core.database import engine, Base
from app.domain.models import *

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Tables created/verified successfully')

asyncio.run(create_tables())
" 2>&1 || echo "WARNING: Table creation had issues"

echo ""
echo "=== Testing App Import ==="
python -c "
try:
    from main import app
    print('App import successful')
except Exception as e:
    import traceback
    print(f'IMPORT ERROR: {e}')
    traceback.print_exc()
" 2>&1

echo ""
echo "=== Starting Uvicorn on port ${PORT:-8000} ==="
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
