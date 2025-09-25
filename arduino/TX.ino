// === TX: ESP32 LoRa + Ultrasonido (envía 0/1) ===
#include <SPI.h>
#include <LoRa.h>

// --- LoRa (SX1276/78) ---
#define LORA_SS    5
#define LORA_RST   14
#define LORA_DIO0  2
const long LORA_FREQ = 915E6; // Chile/LatAm

// --- Ultrasonido HC-SR04 ---
const int TRIG_PIN = 27;
const int ECHO_PIN = 32;
const unsigned long PULSE_TIMEOUT_US = 25000UL; // ~4m
// Umbrales con histéresis para evitar parpadeos
const float NEAR_ON_CM  = 50.0; // <= activa "auto cerca"
const float NEAR_OFF_CM = 60.0; // >= desactiva "auto cerca"

// --- Botón de SINCRONIZACIÓN con RX ---
const int BTN_PIN = 33;  // a GND con INPUT_PULLUP
bool lastBtn = HIGH;

// --- LED (dos pines: rojo y verde) ---
const int LED_R = 25;
const int LED_G = 26;

// --- Estado ---
uint8_t state = 0;       // 0=verde (lejos), 1=rojo (cerca)
uint8_t lastSent = 255;  // valor imposible para forzar primer envío

// --- Timings ---
unsigned long lastMeasureMs = 0;
const unsigned long MEASURE_EVERY_MS = 150;  // tasa de lectura
const int FILTER_SAMPLES = 5;                // pequeño promedio móvil

// === Utilidades LED ===
void ledSetup() {
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
}

void setLedByState(uint8_t s) {
  if (s == 1) {            // ROJO (auto cerca)
    digitalWrite(LED_R, HIGH);
    digitalWrite(LED_G, LOW);
  } else {                 // VERDE (libre)
    digitalWrite(LED_R, LOW);
    digitalWrite(LED_G, HIGH);
  }
}

// === LoRa ===
void setupLoRa() {
  SPI.begin(18, 19, 23, LORA_SS);  // SCK, MISO, MOSI, SS
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQ)) {
    Serial.println("Error iniciando LoRa");
    while (1) delay(1000);
  }
  // Opcionalmente: LoRa.setTxPower(14); // dBm
}

void sendState(uint8_t s) {
  LoRa.beginPacket();
  LoRa.write(s ? '1' : '0');   // envía '0' o '1'
  LoRa.endPacket();
  Serial.print("TX -> ");
  Serial.println(s);
  lastSent = s;
}

void sendSyncRequest() {
  LoRa.beginPacket();
  LoRa.print("SYNC?");
  LoRa.endPacket();
  Serial.println("TX -> SYNC? (solicitando estado al RX)");
}

// === Ultrasonido ===
void ultrasonicSetup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
}

float readDistanceCmOnce() {
  // pulso de disparo
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // duración del eco
  unsigned long dur = pulseIn(ECHO_PIN, HIGH, PULSE_TIMEOUT_US);
  if (dur == 0) return NAN; // sin lectura
  // conversión a cm (vel sonido ~340 m/s => 29.1 us por cm ida/vuelta: /58)
  return dur / 58.0;
}

float readDistanceCmFiltered() {
  // promedio simple con descarte de NAN
  float acc = 0.0;
  int cnt = 0;
  for (int i = 0; i < FILTER_SAMPLES; i++) {
    float d = readDistanceCmOnce();
    if (!isnan(d)) { acc += d; cnt++; }
    delay(10);
  }
  return (cnt > 0) ? (acc / cnt) : NAN;
}

// === Sincronización con RX (lee respuesta por 1s) ===
bool waitSyncResponse(uint8_t &rx_state, unsigned long timeoutMs = 1000) {
  unsigned long t0 = millis();
  while (millis() - t0 < timeoutMs) {
    int pkt = LoRa.parsePacket();
    if (pkt > 0) {
      // Leer primer byte y validar '0'/'1'
      int b = LoRa.read();
      if (b == '0' || b == '1') {
        rx_state = (b == '1') ? 1 : 0;
        // vaciar lo restante del paquete si lo hubiera
        while (LoRa.available()) LoRa.read();
        return true;
      } else {
        // limpiar cualquier otro contenido
        while (LoRa.available()) LoRa.read();
      }
    }
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);

  ledSetup();
  setLedByState(state); // inicia en 0 (verde)
  ultrasonicSetup();
  setupLoRa();

  Serial.println("TX listo. El estado 0/1 depende del ultrasonido. "
                 "Pulsa el botón para sincronizar estado desde el RX.");
}

void loop() {
  // --- Lectura de botón (solo para SYNC con RX) ---
  bool reading = digitalRead(BTN_PIN);
  if (lastBtn == HIGH && reading == LOW) {
    delay(30); // debounce
    if (digitalRead(BTN_PIN) == LOW) {
      // Pedimos estado al RX
      sendSyncRequest();
      uint8_t rx_state;
      if (waitSyncResponse(rx_state, 1200)) {
        Serial.print("SYNC <- RX respondió: ");
        Serial.println(rx_state);
        state = rx_state;
        setLedByState(state);
        // (opcional) reenviar para notificar cambio local
        if (state != lastSent) sendState(state);
      } else {
        Serial.println("SYNC: sin respuesta del RX");
      }
    }
  }
  lastBtn = reading;

  // --- Medición periódica de distancia ---
  unsigned long now = millis();
  if (now - lastMeasureMs >= MEASURE_EVERY_MS) {
    lastMeasureMs = now;

    float cm = readDistanceCmFiltered();
    if (!isnan(cm)) {
      // Lógica con histéresis
      uint8_t newState = state;
      if (state == 0 && cm <= NEAR_ON_CM) {
        newState = 1; // pasó a "cerca"
      } else if (state == 1 && cm >= NEAR_OFF_CM) {
        newState = 0; // volvió a "lejos"
      }

      if (newState != state) {
        state = newState;
        setLedByState(state);
        sendState(state); // solo en cambios
        Serial.print("Distancia: ");
        Serial.print(cm, 1);
        Serial.print(" cm -> estado ");
        Serial.println(state);
      }
    } else {
      // Lectura inválida: no cambies estado; puedes loguear si quieres
      // Serial.println("Ultrasonido: sin lectura válida");
    }
  }
}
