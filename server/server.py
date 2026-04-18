#!/usr/bin/env python3
import asyncio
import json

import websockets

HOST = "0.0.0.0"
PORT = 8765


async def handle(websocket):
    print(f"[+] Client connected: {websocket.remote_address}")
    async for raw in websocket:
        print(f"[recv] {raw}")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print("[warn] non-JSON message, echoing raw")
            data = {"raw": raw}
        data["server_touched"] = True
        response = json.dumps(data)
        print(f"[send] {response}")
        await websocket.send(response)
    print(f"[-] Client disconnected: {websocket.remote_address}")


async def main():
    print(f"WebSocket server listening on ws://{HOST}:{PORT}")
    async with websockets.serve(handle, HOST, PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
