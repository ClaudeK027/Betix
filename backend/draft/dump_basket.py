import asyncio
import json
from app.engine.data_aggregation import get_match_context

async def main():
    ctx = await get_match_context("basketball", 4283)
    with open("basket_4283.json", "w", encoding="utf-8") as f:
        json.dump(ctx, f, default=str, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(main())
