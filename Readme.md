# 🔥 FireDetector con YOLOv8

Este proyecto corresponde al trabajo final de la materia "Sistemas Inteligentes" (UCC). Desarrolla un sistema web completo de detección de fuego y humo utilizando un modelo personalizado entrenado con **YOLOv8**. El frontend está desarrollado en **React**, y el backend en **FastAPI**. Los archivos subidos por el usuario son procesados por el modelo, devolviendo resultados anotados y visualizables.


---
## 🎯 Objetivo
Entrenar un modelo que fuera capaz de detectar de forma automática la presencia de fuego o humo en imágenes o videos. 
---

## 🧰 Tecnologías utilizadas
- **Frontend**: React
- **Backend**: FastAPI + OpenCV + Ultralytics YOLOv8
- **Modelo**: YOLOv8, entrenado en la plataforma de Google Colab
- **Dataset**: Roboflow

---

## Para instalar el backend
## Desde la raiz: 
* python3 -m venv venv
* .\venv\Scripts\Activate.ps1 # al menos en windows
* pip install uvicorn

## Desde /backend
* pip install numpy
* pip install pip install opencv-python
* pip install fastapi
* pip install av
* pip install ultralytics
* pip install python-multipath #si te lo pide

# para ejecutar el Backend
* .\venv\Scripts\Activate.ps1 #siempre que se reinicie
* uvicorn app.main:app --port 8001 --reload


# Para instalar el frontend
en /frontend_v1/mi-app
* npm install

# Para ejecutar el frontend
en /frontend_v1/mi-app/src
* npm run dev



### **Uso:**
#### Imagen:
Subir una imagen desde el frontend.
El backend retorna la misma imagen con los cuadros de detección dibujados.

#### Video:
Subir un video en .mp4.
El backend devuelve el video con anotaciones visualizable en el navegador.

#### Webcam:
Dar permiso de uso de webcam
El backend procesa los frames y devuelve un video en tiempo real con anotaciones


#### Notas técnicas
Se pueden ajustar parámetros como imgsz, conf: umbral de confianza (ej: 0.25)  y sample_rate: frecuencia de muestreo de frames en videos para mejorar performance (ej: cada 5 frames).


Universidad Catolica de Córdoba, Argentina
