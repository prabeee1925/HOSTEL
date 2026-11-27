/*
  HOSTEL POWER - BEGINNER HARDWARE PROTOTYPE
  Demo room: A-193
  Board: classic ESP32 DevKit

  What this sketch does:
  - Creates a local Wi-Fi network named HostelPower-A193.
  - Serves a phone-friendly control page at http://192.168.4.1
  - Controls one LED (GPIO 26) and one small 5V DC fan through a
    3.3V-trigger-compatible 5V relay module (GPIO 27).
  - Reports the ESP32 output states to the page.

  This is a LOW-VOLTAGE demonstration only. Do not connect this project
  to hostel mains electricity or 230V wiring.
*/

#include <WiFi.h>
#include <WebServer.h>

const char* AP_SSID = "HostelPower-A193";
const char* AP_PASSWORD = "PrabiA193";  // WPA2 password: at least 8 characters

const uint8_t LIGHT_PIN = 26;      // LED + resistor
const uint8_t FAN_RELAY_PIN = 27;  // Relay module IN pin

// Many beginner relay modules are active LOW. If your relay works in reverse,
// change this to false and upload again. Do not change any wiring while powered.
const bool RELAY_ACTIVE_LOW = true;

bool lightOn = false;
bool fanOn = false;
WebServer server(80);

const char PHONE_PAGE[] PROGMEM = R"rawliteral(
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#111a36">
<title>Hostel Power · A-193</title>
<style>
:root{color-scheme:dark;--bg:#0b1021;--panel:#151e38;--line:#293758;--muted:#a7b4d0;--text:#f6f8ff;--green:#24c78a;--red:#ff667b;--blue:#8da8ff}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 85% 0%,#253568 0,transparent 35%),var(--bg);font-family:Arial,Helvetica,sans-serif;color:var(--text);padding:22px 14px 40px}
main{max-width:620px;margin:auto}.top{display:flex;align-items:center;gap:14px;margin:10px 0 22px}.logo{width:52px;height:52px;border-radius:17px;background:linear-gradient(145deg,#6f88ff,#8a5af4);display:grid;place-items:center;font-size:26px;box-shadow:0 10px 28px #0005}.eyebrow{font-size:11px;letter-spacing:2px;color:#b7c5ff;font-weight:800}.top h1{font-size:27px;margin:4px 0}.top p{margin:0;color:var(--muted);font-size:13px}
.connection{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#172342;border:1px solid #33466e;border-radius:14px;padding:13px 15px;margin-bottom:16px;font-size:13px}.dot{width:9px;height:9px;background:var(--green);border-radius:50%;display:inline-block;margin-right:8px;box-shadow:0 0 12px #24c78a}.small{color:var(--muted);font-size:12px}
.card{background:linear-gradient(160deg,#182443,#121a30);border:1px solid var(--line);border-radius:20px;padding:19px;margin:13px 0;box-shadow:0 16px 32px #0003}.cardhead{display:flex;align-items:center;justify-content:space-between;gap:12px}.appliance{display:flex;align-items:center;gap:12px}.ico{width:46px;height:46px;border-radius:14px;background:#27365e;display:grid;place-items:center;font-size:24px}.card h2{font-size:19px;margin:0}.state{padding:7px 11px;border-radius:30px;font-size:11px;font-weight:900;letter-spacing:.5px;background:#342338;color:#ffabb4}.state.off{background:#123d37;color:#7af0c2}.buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}button{border:0;border-radius:13px;padding:14px 12px;font-size:14px;font-weight:800;cursor:pointer;color:white;transition:transform .12s,opacity .12s}button:active{transform:scale(.98)}button:disabled{opacity:.45;cursor:wait}.on{background:linear-gradient(135deg,#1ebd85,#11835f)}.offbtn{background:linear-gradient(135deg,#344366,#25314e);border:1px solid #46577b}.alloff{width:100%;margin-top:15px;background:linear-gradient(135deg,#e25c70,#ae3856);padding:16px}.note{line-height:1.55;color:var(--muted);font-size:12px;margin:16px 2px}.result{min-height:22px;color:#c8d5f5;font-size:13px;margin-top:12px}.foot{text-align:center;color:#7f8eaf;font-size:11px;margin-top:22px}.pill{border:1px solid #43557f;color:#c6d3f6;border-radius:20px;padding:6px 9px;font-size:10px;font-weight:800}
@media(max-width:390px){.top h1{font-size:23px}.card{padding:15px}}
</style>
</head>
<body>
<main>
  <div class="top">
    <div class="logo">⚡</div>
    <div><div class="eyebrow">SMART HOSTEL PROJECT</div><h1>Hostel Power</h1><p>Beginner hardware prototype · Room A-193</p></div>
  </div>
  <div class="connection"><span><span class="dot" id="dot"></span><span id="connectionText">Connecting to ESP32…</span></span><span class="pill">LOCAL CONTROL</span></div>

  <section class="card">
    <div class="cardhead">
      <div class="appliance"><div class="ico">💡</div><div><h2>Room Light</h2><div class="small">LED demonstration</div></div></div>
      <span class="state off" id="lightState">OFF</span>
    </div>
    <div class="buttons">
      <button class="on" onclick="setOutput('light','ON',this)">Turn ON</button>
      <button class="offbtn" onclick="setOutput('light','OFF',this)">Turn OFF</button>
    </div>
  </section>

  <section class="card">
    <div class="cardhead">
      <div class="appliance"><div class="ico">🌀</div><div><h2>Room Fan</h2><div class="small">5V mini fan demonstration</div></div></div>
      <span class="state off" id="fanState">OFF</span>
    </div>
    <div class="buttons">
      <button class="on" onclick="setOutput('fan','ON',this)">Turn ON</button>
      <button class="offbtn" onclick="setOutput('fan','OFF',this)">Turn OFF</button>
    </div>
  </section>

  <button class="alloff" onclick="allOff(this)">⏻ Turn BOTH OFF</button>
  <div class="result" id="result" aria-live="polite">Connect your phone to the ESP32 Wi-Fi to begin.</div>
  <p class="note"><b>How this demo works:</b> Your phone sends a command to the ESP32 over its own Wi-Fi network. The ESP32 changes the LED output or fan relay and sends the output state back to this page. All phones connected to this same ESP32 see the same room output state.</p>
  <p class="note"><b>Prototype limit:</b> ON/OFF here means the ESP32 output/relay command state. This beginner version does not measure actual electrical current and does not detect people in the room. Automatic occupancy cutoff, reminders, Firebase and the warden dashboard are saved for a later stage.</p>
  <div class="foot">Hostel Power · Low-voltage demonstration only · No mains wiring</div>
</main>
<script>
const $=id=>document.getElementById(id);
let busy=false;
function paint(data){
  for(const item of ['light','fan']){
    const isOn=data[item]==='ON';
    const badge=$(item+'State');
    badge.textContent=isOn?'ON':'OFF';
    badge.classList.toggle('off',!isOn);
  }
  $('connectionText').textContent='ESP32 connected · '+(data.clients??'')+' phone(s) connected';
  $('dot').style.background='#24c78a';
}
async function refresh(){
  if(busy)return;
  try{
    const r=await fetch('/api/state',{cache:'no-store'});
    if(!r.ok)throw new Error('Device not responding');
    paint(await r.json());
  }catch(e){
    $('connectionText').textContent='Reconnecting to ESP32…';
    $('dot').style.background='#ff667b';
  }
}
async function setOutput(item,state,button){
  if(busy)return;
  busy=true;button.disabled=true;$('result').textContent='Sending '+item+' '+state+' command…';
  try{
    const r=await fetch('/api/'+item+'?state='+state,{cache:'no-store'});
    if(!r.ok)throw new Error('Command failed');
    const data=await r.json();paint(data);
    $('result').textContent=(item==='light'?'Light':'Fan')+' output set to '+state+'.';
  }catch(e){$('result').textContent='Could not reach the ESP32. Check your Wi-Fi connection.';}
  finally{busy=false;button.disabled=false;}
}
async function allOff(button){
  if(busy)return;
  busy=true;button.disabled=true;$('result').textContent='Switching both outputs OFF…';
  try{
    const r=await fetch('/api/all-off',{cache:'no-store'});
    if(!r.ok)throw new Error('Command failed');
    paint(await r.json());$('result').textContent='Both outputs are OFF.';
  }catch(e){$('result').textContent='Could not reach the ESP32. Check your Wi-Fi connection.';}
  finally{busy=false;button.disabled=false;}
}
refresh();setInterval(refresh,1500);
</script>
</body>
</html>
)rawliteral";

void applyLight() {
  digitalWrite(LIGHT_PIN, lightOn ? HIGH : LOW);
}

void applyFan() {
  // Relay boards can be active LOW or active HIGH.
  const uint8_t outputLevel = (fanOn == RELAY_ACTIVE_LOW) ? LOW : HIGH;
  digitalWrite(FAN_RELAY_PIN, outputLevel);
}

void sendState() {
  String json = "{\"room\":\"A-193\",\"light\":\"";
  json += lightOn ? "ON" : "OFF";
  json += "\",\"fan\":\"";
  json += fanOn ? "ON" : "OFF";
  json += "\",\"clients\":";
  json += String(WiFi.softAPgetStationNum());
  json += "}";
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", json);
}

void handleLight() {
  if (!server.hasArg("state")) {
    server.send(400, "application/json", "{\"error\":\"Missing state\"}");
    return;
  }
  String state = server.arg("state");
  state.toUpperCase();
  if (state != "ON" && state != "OFF") {
    server.send(400, "application/json", "{\"error\":\"State must be ON or OFF\"}");
    return;
  }
  lightOn = (state == "ON");
  applyLight();
  sendState();
}

void handleFan() {
  if (!server.hasArg("state")) {
    server.send(400, "application/json", "{\"error\":\"Missing state\"}");
    return;
  }
  String state = server.arg("state");
  state.toUpperCase();
  if (state != "ON" && state != "OFF") {
    server.send(400, "application/json", "{\"error\":\"State must be ON or OFF\"}");
    return;
  }
  fanOn = (state == "ON");
  applyFan();
  sendState();
}

void handleAllOff() {
  lightOn = false;
  fanOn = false;
  applyLight();
  applyFan();
  sendState();
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found. Open http://192.168.4.1/");
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // Set both demo outputs OFF before starting Wi-Fi.
  pinMode(LIGHT_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, LOW);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  fanOn = false;
  applyFan();

  WiFi.mode(WIFI_AP);
  const bool apStarted = WiFi.softAP(AP_SSID, AP_PASSWORD);
  if (!apStarted) {
    Serial.println("ERROR: Could not start the Hostel Power Wi-Fi network.");
    while (true) delay(1000);
  }

  Serial.println();
  Serial.println("HOSTEL POWER - ROOM A-193");
  Serial.print("Wi-Fi name: ");
  Serial.println(AP_SSID);
  Serial.print("Wi-Fi password: ");
  Serial.println(AP_PASSWORD);
  Serial.print("Open this address on your phone: http://");
  Serial.println(WiFi.softAPIP());

  server.on("/", HTTP_GET, []() {
    server.send_P(200, "text/html", PHONE_PAGE);
  });
  server.on("/api/state", HTTP_GET, sendState);
  server.on("/api/light", HTTP_GET, handleLight);
  server.on("/api/fan", HTTP_GET, handleFan);
  server.on("/api/all-off", HTTP_GET, handleAllOff);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("Phone control page is ready.");
}

void loop() {
  server.handleClient();
  delay(2);
}
