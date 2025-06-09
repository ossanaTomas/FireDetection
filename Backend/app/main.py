from fastapi import FastAPI, File, Form, UploadFile, HTTPException, WebSocket
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import cv2
import io
import av
import tempfile

import os #trabajar con rutas de archivos
#import uuid #generar identificadores unicos universales 
#import shutil #Copiar archivos completos entre flujos binarios (streaming)
from fastapi.middleware.cors import CORSMiddleware
from app.detector import FireDetector


app = FastAPI(title="Fire Detector Backend")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

fire_detector = FireDetector("modelos/best60epocas.pt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, # Permitir cookies, cabeceras de autorización, etc.
    allow_methods=["*"],    #todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    #todas las cabeceras
)

@app.get("/")
def root():
    return {"message": "Hello World, This is FIRE detector!"}

@app.post("/predict/image/")
def predict_image(file: UploadFile = File(...),confidence:float = Form(...)):
    try:
        contents = file.file.read()
        nparr = np.frombuffer(contents, np.uint8) 
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        detections = fire_detector.predict(image, conf=confidence) # predigo el contenido de la imagen
        image_with_detections = fire_detector.draw_detections(image, detections)  #dibujo resultados sobre la iimage
        # Codificamos la imagen anotada para enviarla al frontend
        _, buffer = cv2.imencode('.jpg', image_with_detections)

        return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@app.post("/predict/video/")
def predict_video(file: UploadFile = File(...)):
    try:
        # Leer el video en memoria
        contents = file.file.read()
        input_buffer = io.BytesIO(contents)
        container = av.open(input_buffer)
        stream = container.streams.video[0]

        # Configurar salida en memoria como MP4
        output_buffer = io.BytesIO()
        out = av.open(output_buffer, 'w', format='mp4')
        out_stream = out.add_stream(codec_name="libx264")  # Usar H.264
        out_stream.width = int(stream.width)  # Ancho del stream de entrada
        out_stream.height = int(stream.height)  # Alto del stream de entrada
        
        out_stream.pix_fmt = "yuv420p"  # Formato de píxeles compatible con H.264

    # esto deberia ser pasado desde el front como parametro
        frame_count = 0
        sample_rate = 5  # Procesar 1 de cada 5 frames

        for packet in container.demux(stream):
            for frame in packet.decode():
                frame_count += 1
                if frame_count % sample_rate != 0:
                    continue

                # Convertir frame de AV a OpenCV
                frame_np = frame.to_ndarray(format="bgr24")
                frame_resized = cv2.resize(frame_np, (416, 416))

                # Predicción y dibujo
                detections = fire_detector.predict(frame_resized, imgsz=416, conf=0.5)
                frame_annotated = fire_detector.draw_detections(frame_resized, detections)

                # Convertir de vuelta a AV frame
                new_frame = av.VideoFrame.from_ndarray(frame_annotated, format="bgr24")
                for packet_out in out_stream.encode(new_frame):
                    out.mux(packet_out)

        # Finalizar codificación
        for packet_out in out_stream.encode(None):  # Flush encoder
            out.mux(packet_out)
        out.close()
        container.close()

        # Preparar respuesta
        output_buffer.seek(0)
        return StreamingResponse(output_buffer, media_type="video/mp4")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar video: {str(e)}")
    


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_bytes()
        np_data = np.frombuffer(data, np.uint8)
        frame = cv2.imdecode(np_data, cv2.IMREAD_COLOR)

        # Procesar con YOLO
        detections = fire_detector.predict(frame)
        annotated = fire_detector.draw_detections(frame, detections)
        # Codificar imagen de nuevo para enviar
        _, buffer = cv2.imencode('.jpg', annotated)
        await websocket.send_bytes(buffer.tobytes())

@app.post("/predict/video/mjpeg/")
def predict_video_mjpeg(file: UploadFile = File(...)):
    # Guardamos temporalmente el archivo
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    def generate():
        cap = cv2.VideoCapture(tmp_path)
        detector = fire_detector

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                detections = fire_detector.predict(frame)
                frame_detected = fire_detector.draw_detections(frame, detections)

                _, jpeg = cv2.imencode('.jpg', frame_detected)
                frame_bytes = jpeg.tobytes()

                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" +
                    frame_bytes +
                    b"\r\n"
                )
        except Exception as e:
            print("⚠️ Error en streaming MJPEG:", e)
        finally:
            cap.release()

    return StreamingResponse(
    generate(),
    media_type="multipart/x-mixed-replace; boundary=frame",
    headers={"Content-Disposition": "inline; filename=stream.mjpeg"}
)


#Para poner a correr el backend:
#desde la carpeta backend: uvicorn app.main:app --port 8001 --reload
#para correr el front:
#desde src: npm run dev 