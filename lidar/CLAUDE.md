# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

This is the LiDAR firmware component of **Panko**, an autonomous medication delivery robot. The ESP32 in this directory drives the TF-Luna LiDAR sensor, sweeps it to produce 2D scans, and streams polar scan data to the Mini PC over WiFi WebSocket. The Mini PC runs ROS 2 SLAM on that data to build the occupancy grid used for navigation.

See `../claude.md` for the full system architecture.

---

## Hardware

| Component | Detail |
|-----------|--------|
| MCU | ESP32 (dual-core, 240 MHz) |
| Sensor | TF-Luna (single-beam ToF LiDAR, 0.2–8 m range, up to 250 Hz) |
| Rotation | Stepper motor or continuous servo sweeping TF-Luna through 360° |
| Interface | TF-Luna → ESP32 via UART (default 115200 baud) or I2C |
| Uplink | ESP32 → Mini PC via WiFi WebSocket |

---

## TF-Luna Protocol

TF-Luna outputs 9-byte frames over UART:

```
Byte 0: 0x59  (frame header)
Byte 1: 0x59  (frame header)
Byte 2: Dist_L   — distance low byte  (cm)
Byte 3: Dist_H   — distance high byte (cm)
Byte 4: Str_L    — signal strength low byte
Byte 5: Str_H    — signal strength high byte
Byte 6: Temp_L   — chip temperature low byte
Byte 7: Temp_H   — chip temperature high byte
Byte 8: Checksum — low 8 bits of sum of bytes 0–7
```

Distance is valid when signal strength is between 100 and 65535. Discard readings outside that range.

I2C mode is available (address 0x10) but UART is preferred for the sample rates needed for sweeping.

---

## Scan Architecture

Because TF-Luna is single-beam, 2D mapping requires mechanical rotation:

1. **Sweep driver** steps the motor one angular increment (e.g. 1°).
2. **Sample loop** waits for TF-Luna to produce a valid frame at the new angle.
3. **Scan buffer** accumulates `(angle_deg, distance_cm)` pairs for a full 360° revolution.
4. **WebSocket publish** sends the completed scan as a JSON array to the Mini PC.
5. Mini PC feeds the scan into ROS 2 (sensor_msgs/LaserScan → SLAM node).

Keep angular resolution ≥ 1° and scan rate as high as the motor allows. At 1°/step with ~4 ms per TF-Luna frame, a full revolution takes ~1.4 s minimum.

---

## WebSocket Scan Message Format

Sent from ESP32 → Mini PC after each complete 360° sweep:

```json
{
  "type": "LIDAR_SCAN",
  "timestamp_ms": 1234567890,
  "angle_min_deg": 0,
  "angle_max_deg": 359,
  "angle_increment_deg": 1,
  "ranges_cm": [342, 341, 0, 298, ...]
}
```

Use `0` for invalid/out-of-range readings so the ROS 2 side can apply range filters.

---

## ESP-IDF Commands

```bash
# First-time setup (run once per shell session)
. $IDF_PATH/export.sh

# Set target chip
idf.py set-target esp32

# Configure WiFi SSID/password, UART pins, WebSocket host IP
idf.py menuconfig

# Build
idf.py build

# Flash and open serial monitor
idf.py flash monitor

# Flash only (no monitor)
idf.py flash -p /dev/ttyUSB0

# Serial monitor only
idf.py monitor -p /dev/ttyUSB0
```

---

## Project Configuration (menuconfig)

Key config items under `Component config → LiDAR Mapping`:

- **WiFi SSID / Password** — must match the Mini PC's network
- **Mini PC WebSocket IP / Port** — default port matches the Mini PC WS server (see `../mini-pc/`)
- **TF-Luna UART port, TX pin, RX pin** — match physical wiring
- **Motor step pin, direction pin** — for stepper; or PWM pin for servo
- **Steps per revolution** — calibrate to your motor/gearing for accurate angle tracking

---

## Key Implementation Notes

- **Checksum validation**: always verify byte 8 before using a frame. Drop and re-sync on mismatch.
- **UART buffer sizing**: set RX buffer large enough for burst reads (≥ 256 bytes) to avoid dropped frames during motor stepping.
- **Motor settling time**: insert a short delay after each step before sampling TF-Luna to let vibration settle — typically 2–5 ms.
- **WiFi reconnect loop**: if the WebSocket connection to the Mini PC drops, buffer scans locally (ring buffer) and flush on reconnect; do not block the scan loop.
- **Robot state gating**: the ESP32 should only transmit scans when the Mini PC has sent a `START_MAPPING` command (see WebSocket schema in `../claude.md`). Ignore all scan data in other robot states to reduce noise.
