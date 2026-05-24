#include <Wire.h>
#include <LoRa.h>
#include <DHT.h>
#include <MPU6050.h>

#define DHTPIN 4
#define DHTTYPE DHT11
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2

// Objects
DHT dht(DHTPIN, DHTTYPE);
MPU6050 mpu;

int16_t ax, ay, az, gx, gy, gz;
float temperature, humidity;
int packetCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nInitializing sensors...");

  Wire.begin(21, 22);
  delay(500);

  dht.begin();

  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("❌ MPU6050 not found! Check wiring or power.");
  } else {
    Serial.println("✅ MPU6050 connected!");
  }

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("❌ Starting LoRa failed!");
    while (1);
  }
  Serial.println("✅ LoRa initialized!");
}

void loop() {

  temperature = dht.readTemperature();
  humidity = dht.readHumidity(); 


  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;
  float vibration = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g) - 1.0;
  vibration = abs(vibration); // should be always positive, SHOULD BE!! 
  

String payload = "T:" + String(temperature, 1) + "C, "
               + "H:" + String(humidity, 1) + "%, "
               + "Vibration:" + String(vibration, 3) + "g, "
               + "Packet:" + String(++packetCount);
  // Send packet
  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();

  Serial.println(payload);
  delay(2000);
}
