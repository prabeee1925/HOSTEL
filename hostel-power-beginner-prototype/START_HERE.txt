HOSTEL POWER - BEGINNER PROTOTYPE (ROOM A-193)

THIS IS THE SMALL FIRST VERSION TO BUILD AND DEMONSTRATE.

WHAT IT DOES
1. The ESP32 creates its own Wi-Fi network.
2. A phone connects to that network.
3. The phone opens a simple control page.
4. Pressing Light ON/OFF controls an LED on the ESP32.
5. Pressing Fan ON/OFF controls a small 5V DC fan through a low-voltage relay module.
6. Every phone connected to this ESP32 sees the same output states.

WHAT WE ARE DELIBERATELY NOT BUILDING YET
- No room occupancy sensors.
- No automatic occupancy-based cutoff.
- No Firebase hardware connection.
- No 230V hostel wiring.
- No multi-room controller or student registration in this first physical demo.
- No background alarm system in this standalone hardware page. Keep the existing Hostel Power reminder app separately until this hardware demo works.

PARTS
- 1 ESP32 DevKit board (classic ESP32-WROOM type).
- 1 ordinary LED (5mm).
- 1 resistor, 220 ohm to 330 ohm.
- 1 single-channel 5V relay module explicitly stated to accept 3.3V ESP32 GPIO trigger signals.
- 1 small 5V DC mini fan (use a low-current model; check its label).
- 1 regulated 5V DC supply suitable for the fan and relay module.
- Breadboard and jumper wires.
- USB data cable for the ESP32.
- Optional multimeter for checking 5V polarity before connecting the fan.

IMPORTANT SAFETY
- This project is only for low-voltage LED and 5V mini-fan demonstration loads.
- Do not connect the relay to hostel lights, ceiling fans, wall sockets, or any 230V mains supply.
- Do not power a fan directly from an ESP32 GPIO pin or the ESP32 3.3V pin.
- Ask your teacher or lab technician to check the wiring and relay module before applying power.
- Keep all wiring disconnected from power while assembling or changing connections.
- Relay module input logic differs. The included sketch assumes an active-LOW relay. If the relay behaves in reverse, ask the lab supervisor to check the module and only then change RELAY_ACTIVE_LOW in the sketch.

WIRING - LED
1. ESP32 GPIO 26 -> 220-330 ohm resistor -> LED long leg (anode).
2. LED short leg (cathode) -> ESP32 GND.
3. Never connect the LED directly to GPIO 26 without the resistor.

WIRING - RELAY INPUT SIDE
1. Relay module IN -> ESP32 GPIO 27.
2. Relay module VCC -> regulated 5V.
3. Relay module GND -> ESP32 GND.
4. Use a relay module whose input is compatible with 3.3V ESP32 signals.

WIRING - 5V FAN CONTACT SIDE
1. 5V supply positive (+) -> relay COM terminal.
2. Relay NO terminal -> fan positive (+).
3. Fan negative (-) -> 5V supply negative (-).
4. The fan is OFF when COM and NO are open; it turns ON when the relay closes.
5. The relay contact side is separate from its input side. Check the printed COM/NO labels on your actual module before wiring.
6. Do not use NC for this beginner demo.
7. Confirm the fan voltage and current label. The power supply and relay contact rating must be suitable for that fan.

ESP32 AND RELAY INPUT GROUND
The relay module input GND must share ground with ESP32 GND. The fan is switched through the relay contacts. Do not connect the fan to ESP32 GPIO pins.

UPLOAD AND TEST
1. Install Arduino IDE on a computer.
2. Install the Espressif ESP32 board package in Arduino IDE Boards Manager (if it is not already installed).
3. Open esp32/HostelPower_A193.ino.
4. Select the board that matches your ESP32 DevKit. For a common ESP32-WROOM DevKit, select "ESP32 Dev Module".
5. Connect the ESP32 with a USB data cable and select its COM port.
6. Upload the sketch. The board's LED may blink during upload.
7. Open Serial Monitor at 115200 baud.
8. You should see the Wi-Fi name, password and address.
9. On the phone, join Wi-Fi: HostelPower-A193
10. Password: PrabiA193
11. If the phone says "No internet", choose to stay connected. This Wi-Fi is only for local control.
12. Open Safari or Chrome and enter: http://192.168.4.1
13. Press Light ON. The LED should glow. Press Light OFF.
14. Press Fan ON. The relay should click and the 5V fan should run. Press Fan OFF.
15. Press "Turn BOTH OFF" to switch both outputs off.

IF THE PHONE DOES NOT LOAD THE PAGE
- Make sure it is connected to HostelPower-A193, not campus Wi-Fi/mobile hotspot.
- Keep the phone connected even though the ESP32 Wi-Fi has no internet.
- Type the full address including http:// : http://192.168.4.1
- Check that the ESP32 is powered and that Serial Monitor says the phone control page is ready.
- Only one to a few phones are needed for the classroom demo; the ESP32 access point has a limited number of simultaneous connections.

WHAT THE STATUS MEANS
The status shown is the ESP32's commanded output/relay state. It does not measure current and cannot detect a disconnected or failed fan/LED. This is enough for the first demonstration: a phone button physically changes the LED/fan output. Current sensors and actual electrical state verification can be a later upgrade.

DEMO SCRIPT FOR FACULTY
1. Show the LED and mini fan connected to the ESP32.
2. Connect a phone to HostelPower-A193.
3. Open http://192.168.4.1.
4. Press Light ON and show the LED glowing.
5. Press Fan ON and show the mini fan spinning.
6. Press BOTH OFF and show both outputs stopping.
7. Explain that the phone communicates with the ESP32 through local Wi-Fi; no cloud account or internet is needed for this first hardware demonstration.

LATER UPGRADES (ONLY AFTER THIS WORKS)
1. Add the existing Firebase room/member dashboard.
2. Add sensor-based confirmation.
3. Add reminders from the existing native app.
4. Consider occupancy-based automatic cutoff only after proper occupancy detection and supervised safety review.

Official ESP32 Wi-Fi AP documentation:
https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html
