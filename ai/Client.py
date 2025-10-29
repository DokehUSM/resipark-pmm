import cv2
import requests
import time
import subprocess
import numpy as np
from datetime import datetime
import os

# URLs de las APIs
URL_DETECCION = "https://greeting-ryan-requesting-june.trycloudflare.com/predict"
URL_VERIFICACION = "http://192.168.100.11:8003/verificar-patente"
URL_REGISTRO_RESIDENTE = "http://192.168.100.11:8003/registrar-ingreso-residente"
URL_REGISTRO_VISITANTE = "http://192.168.100.11:8003/registrar-ingreso-visitante"
url = "Video prueba.mp4"


# Configuración de la camara
cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("Error: No se puede acceder a la cámara")
    exit()

print("Iniciando procesamiento de camara. Presiona 'Ctrl+C' para detener.")

# Función para verificar patente
def verificar_patente(patente: str, tipo_vehiculo: int) -> dict:
    try:
        response = requests.get(
            f"{URL_VERIFICACION}/{patente}/{tipo_vehiculo}",
            timeout=5
        )
        return response.json() if response.status_code == 200 else {
            "existe": False, 
            "valido": False,
            "mensaje": "Error en verificación"
        }
    except Exception as e:
        return {
            "existe": False,
            "valido": False, 
            "mensaje": f"Error de conexión: {str(e)}"
        }

# Función para registrar ingreso
def registrar_ingreso(patente: str, tipo_vehiculo: str) -> dict:
    try:
        if tipo_vehiculo == "residente":
            url = f"{URL_REGISTRO_RESIDENTE}/{patente}"
        elif tipo_vehiculo == "visitante":
            url = f"{URL_REGISTRO_VISITANTE}/{patente}"
        else:
            return {"success": False, "mensaje": "Tipo de vehículo inválido"}
        
        response = requests.post(url, timeout=5)
        return response.json() if response.status_code == 200 else {
            "success": False,
            "mensaje": "Error en registro"
        }
    except Exception as e:
        return {
            "success": False,
            "mensaje": f"Error de conexión: {str(e)}"
        }

frame_count = 0
processed_frames = 0
detection_count = 0
plates = []
tiempo = False
mapeo_cars = {'car': 1, 'auto': 1}

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Servidor desconectado...")
            break

        #cv2.imshow("Stream RTSP", frame)
        frame_count += 1

        # Procesar cada 10 frames (para no saturar)
        if frame_count % (10) == 0:
            processed_frames += 1
            
            # Codificar imagen
            _, img_encoded = cv2.imencode(".jpg", frame)    
            files = {"file": ("frame.jpg", img_encoded.tobytes(), "image/jpeg")}
            ts = datetime.now().strftime("%H:%M:%S")

            try:
                # 1. ENVIAR PARA DETECCIÓN
                response = requests.post(URL_DETECCION, files=files, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Mostrar información de detecciones en consola
                    if "detections" in data and data["detections"]:
                        for detection in data["detections"]:
                            detection_count += 1
                            
                            patente_text = detection.get('plate_text', '')
                            tipo_vehiculo_detectado = detection.get('vehicle_type', 1)
                            confianza_vehiculo = detection.get('vehicle_confidence', 0)
                            confianza_patente = detection.get('plate_confidence', 0)

                            
                            print(f"[{ts}] ✅ DETECTADO (Frame {frame_count}):")
                            print(f"   🚗 Vehículo: {tipo_vehiculo_detectado}")
                            print(f"   📊 Conf. Vehículo: {confianza_vehiculo:.3f}")
                            print(f"   🔢 Patente: {patente_text}")
                            print(f"   📈 Conf. Patente: {confianza_patente:.3f}")
                            
                            # 2. VERIFICAR PATENTE
                            if patente_text and patente_text != 'No detectada':
                                print(f"   🔍 Verificando patente...")

                                tipo_vehiculo_detectado = mapeo_cars[tipo_vehiculo_detectado]
                                resultado_verificacion = verificar_patente(patente_text, tipo_vehiculo_detectado)
                                
                                if resultado_verificacion["existe"] and resultado_verificacion["valido"]:

                                    # 3. REGISTRAR INGRESO   Aqui deberia abrirse el porton



                                    

                                    resultado_registro = registrar_ingreso(patente_text, resultado_verificacion["tipo"])
                                    
                                    if resultado_registro["success"]:
                                        print(f"   ✅ {resultado_registro['mensaje']}")
                                        tiempo = True
                                        ## Codigo para abrir el porton
                                        subprocess.run(["python3", "/home/aceve/remoto.py"])
                                        #time.sleep(5)
                                    else:
                                        print(f"   ⚠️  Error en registro: {resultado_registro['mensaje']}")
                                else:
                                    print(f"   ❌ {resultado_verificacion['mensaje']}")
                            
                            if patente_text not in plates:
                                plates.append(patente_text)
                            
                            print("-" * 50)
                    
                
                else:
                    print(f"[{ts}] ❌ Error del servidor de detección: {response.status_code}")

            except requests.exceptions.Timeout:
                print(f"[{ts}] ⏰ Timeout: Servidor no responde")
            except requests.exceptions.ConnectionError:
                print(f"[{ts}] 🔌 Error de conexión")
            except Exception as e:
                print(f"[{ts}] ⚠️  Error: {e}")

        # Pequeña pausa para no saturar el servidor
        time.sleep(0.01)

except KeyboardInterrupt:
    print("\n🛑 Deteniendo el procesamiento...")

finally:
    cap.release()
    print("✅ Procesamiento terminado.")
    print(f"📊 Resumen:")
    print(f"   Detecciones encontradas: {detection_count}")
    print(f"   Patentes detectadas: {plates}")
    
