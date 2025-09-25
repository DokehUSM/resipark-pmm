#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// --------- LoRa (SX1276/78) ----------
#define LORA_SS    5
#define LORA_RST   14
#define LORA_DIO0  2
const long LORA_FREQ = 915E6;    // CL/LatAm
// SPI por defecto ESP32: SCK=18, MISO=19, MOSI=23

// --------- WiFi ----------
const char* WIFI_SSID = "F.R.I.D.A.Y";
const char* WIFI_PASS = "T.Stark23";

// --------- Supabase ----------
const char* SUPABASE_HOST = "otnuagiyetnkaxbbxffh.supabase.co";
const int   SUPABASE_PORT = 443;
const char* SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bnVhZ2l5ZXRua2F4YmJ4ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDA2NDAsImV4cCI6MjA3MzExNjY0MH0.xpU_RbG6zwyqRpkzxvYqQmLPChb4V49wjvHtFb4xIPE"; // anon key

const char* DEVICE_ID = "4bb61efc-6b58-4f75-b150-f3a8ed573bb3";  // UUID (verifica completo)

WiFiClientSecure https; // (no usado directamente; lo dejo por si lo necesitas)

// --------- LEDs (rojo/verde) ----------
const int LED_R = 25;
const int LED_G = 26;

// ================== Utilidades ==================
inline void setLed(bool ocupado) {
  // Asume conexión directa (HIGH=encendido). Ajusta según tu hardware.
  if (ocupado) { // Rojo
    digitalWrite(LED_R, HIGH);
    digitalWrite(LED_G, LOW);
  } else {       // Verde
    digitalWrite(LED_R, LOW);
    digitalWrite(LED_G, HIGH);
  }
}

void setupLeds() {
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  setLed(false);
}

void setupLoRa() {
  SPI.begin(18, 19, 23, LORA_SS);          // SCK, MISO, MOSI, SS
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("Error iniciando LoRa");
    while (1) delay(1000);
  }
  Serial.println("LoRa RX listo @915 MHz.");
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Conectando WiFi");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    if (millis() - t0 > 20000) {
      Serial.println("\nTimeout WiFi, reintentando...");
      WiFi.disconnect(true);
      WiFi.begin(WIFI_SSID, WIFI_PASS);
      t0 = millis();
    }
  }
  Serial.print("\nWiFi OK. IP: ");
  Serial.println(WiFi.localIP());
}

// ================== HTTP a Supabase ==================
bool postOcupado(bool ocupado) {
  // --- Diagnóstico DNS ---
  IPAddress ip;
  if (!WiFi.hostByName(SUPABASE_HOST, ip)) {
    Serial.println("[ERR] DNS no resolvió el host de Supabase");
    Serial.print("Host: "); Serial.println(SUPABASE_HOST);
    Serial.print("WiFi.status: "); Serial.println(WiFi.status());
    return false;
  }
  Serial.print("[OK] DNS -> "); Serial.println(ip.toString());

  // --- Abrir conexión TLS (una por petición) ---
  WiFiClientSecure cli;
  cli.setInsecure();               // para prototipo; en prod usa CA + NTP
  cli.setTimeout(12000);

  Serial.print("[TLS] Conectando a "); Serial.print(SUPABASE_HOST); Serial.print(":"); Serial.println(SUPABASE_PORT);
  if (!cli.connect(SUPABASE_HOST, SUPABASE_PORT)) {   // IMPORTANTE: usa el HOST, no la IP, para SNI
    Serial.println("[ERR] Fallo conectando TLS a Supabase (SNI/puerto/DNS/red)");
    Serial.print("RSSI: "); Serial.println(WiFi.RSSI());
    return false;
  }
  Serial.println("[TLS] Conectado");

  // --- Construir request ---
  const String path = "/rest/v1/rpc/set_estacionamiento_estado";
  String body = String("{\"p_device_id\":\"") + DEVICE_ID + "\"," +
                "\"p_ocupado\":" + (ocupado ? "true" : "false") + "," +
                "\"p_metodo\":0}";  // 0 = sensor

  String req =
      String("POST ") + path + " HTTP/1.1\r\n" +
      "Host: " + SUPABASE_HOST + "\r\n" +
      "apikey: " + SUPABASE_API_KEY + "\r\n" +
      "Authorization: Bearer " + SUPABASE_API_KEY + "\r\n" +
      "Accept: application/json\r\n" +
      "Content-Type: application/json\r\n" +
      "Content-Length: " + String(body.length()) + "\r\n" +
      "Connection: close\r\n\r\n" +
      body;

  cli.print(req);

  // --- Esperar respuesta ---
  unsigned long t0 = millis();
  while (cli.connected() && !cli.available()) {
    if (millis() - t0 > 12000) {
      Serial.println("[ERR] Timeout esperando headers HTTP");
      cli.stop();
      return false;
    }
    delay(10);
  }

  String status = cli.readStringUntil('\n');  // "HTTP/1.1 200 OK"
  Serial.print("[HTTP] "); Serial.println(status);

  // Leer headers hasta línea vacía
  String line;
  while (cli.connected()) {
    line = cli.readStringUntil('\n');
    if (line == "\r") break;
  }

  // (Opcional) ver body para debug
  // String resp = cli.readString(); Serial.println(resp);
  cli.stop();

  bool ok = (status.indexOf("200") > 0 || status.indexOf("201") > 0 || status.indexOf("204") > 0);
  if (!ok) Serial.println("[ERR] Supabase devolvió código no exitoso");
  return ok;
}

// ================== Arduino lifecycle ==================
void setup() {
  Serial.begin(115200);
  delay(200);
  setupLeds();
  setupLoRa();
  connectWiFi();
  Serial.println("RX listo: recibo '0'/'1' por LoRa y envío a Supabase.");
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (!packetSize) return;

  String payload;
  while (LoRa.available()) payload += (char)LoRa.read();
  payload.trim();

  if (payload.length() == 0) return;

  Serial.print("LoRa RX: \""); Serial.print(payload); Serial.println("\"");

  bool ocupado;
  if (payload[0] == '1')      ocupado = true;
  else if (payload[0] == '0') ocupado = false;
  else {
    Serial.print("Payload inválido: "); Serial.println(payload);
    return;
  }

  // LED local
  setLed(ocupado);

  // WiFi + POST a Supabase
  connectWiFi();
  bool ok = postOcupado(ocupado);
  Serial.println(ok ? "Upsert OK en Supabase." : "Upsert FALLÓ.");
}
