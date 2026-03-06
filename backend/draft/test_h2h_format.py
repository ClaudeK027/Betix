import asyncio
from app.engine.data_aggregation import get_match_context

async def main():
    ctx = await get_match_context('football', 1243577)
    import json
    print(json.dumps(ctx.get('h2h'), indent=2, default=str))

if __name__ == '__main__':
    asyncio.run(main())
