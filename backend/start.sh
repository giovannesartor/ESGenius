#!/bin/bash
echo "=== ESG360 Backend Startup ==="
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
echo "=== Patching schema (idempotent ALTER TABLE for missing columns) ==="
python -c "
import asyncio
from sqlalchemy import text
from app.core.database import engine

PATCHES = [
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE',
    \"ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free'\",
]

async def patch():
    async with engine.begin() as conn:
        for sql in PATCHES:
            try:
                await conn.execute(text(sql))
                print(f'OK: {sql[:60]}...')
            except Exception as e:
                print(f'SKIP: {sql[:60]}... -> {e}')

asyncio.run(patch())
" 2>&1 || echo "WARNING: Schema patching had issues"

echo ""
echo "=== Seeding Default Admin ==="
python seed_admin.py 2>&1 || echo "WARNING: Admin seeding had issues"

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
