import asyncio
from market import fetch_raw_mandi_records

async def main():
    result = await fetch_raw_mandi_records(limit=10)
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
