# Panko — Autonomous Medication Delivery Robot

Panko is an end-to-end medication delivery system built for assisted-living and clinical settings. It combines an AI-guided robotic arm, a mobile delivery rover, and a caretaker-facing app to automate medication pickups, room-to-room delivery, and compliance logging.

The caretaker app is cross-platform (React Native via Expo) and uses Firebase for authentication and persistent data.

---

## Overview

### Setup
- Caretakers map the facility and define rooms from the generated floor plan
- A fixed **2×4 shelf (8 cells)** is configured with **patient → medication** assignments
- Patients are enrolled with **name, room assignment, and a face photo** for later verification

### Delivery
- Caretakers schedule deliveries or dispatch immediately from the app
- The robotic arm identifies the correct shelf cell and retrieves the bottle using vision
- The rover navigates to the patient’s room with the payload
- Face verification confirms the recipient before access is granted
- The rover opens its compartment to complete delivery
- A delivery log records outcomes for medical accountability (success, no-face, abort, error)

---

## Tech Stack
- **Frontend**: React Native (Expo: iOS / Android / Web)
- **Backend**: Firebase Firestore + Cloud Storage
- **Auth**: Firebase Auth (Google OAuth + Email/Password)
- **Communication**: WiFi WebSockets + REST
- **Robot**: ROS 2
- **ML**: HuggingFace pretrained models + fine-tuning

---

## Hardware
- **Mini PC**: Central controller; runs inference + orchestration
- **ESP32**: Motor/actuator control (drive, compartment, turret)
- **Rubik Pi 3**: Camera capture + lightweight preprocessing/streaming
- **Robotic Arm**: Picks pill bottles from shelf cells
- **2×4 Shelf**: 8 labeled cells mapped to patient-medication assignments

---

## Current Capabilities
- Automated, vision-assisted bottle dispensing
- Caretaker app for scheduling and control
- Patient enrollment with identity + room assignment + face photo
- Compliance logging for auditing and accountability
- Live telemetry and robot state tracking

---

## Roadmap
- Autonomous LiDAR SLAM navigation
- Real-time face verification at delivery
- Multi-floor support with elevator workflows

---

## Project Goals
- Reduce missed doses and manual delivery workload
- Improve safety via identity verification and audit logs
- Provide real-time visibility into robot state and delivery outcomes
