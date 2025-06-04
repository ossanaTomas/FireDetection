from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import cv2
import io
import av
import os #trabajar con rutas de archivos
#import uuid #generar identificadores unicos universales 
#import shutil #Copiar archivos completos entre flujos binarios (streaming)
from fastapi.middleware.cors import CORSMiddleware # esto ya no debe ser necesatio
from app.detector import FireDetector


app = FastAPI(title="Fire Detector Backend")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

detector = FireDetector("modelos/best60epocas.pt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción sería mejor usar ["http://localhost:3000"] o el dominio exacto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"message": "Hello World, This is FIRE detector!"}

@app.post("/predict/image/")
async def predict_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8) 
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="No se pudo leer la imagen.")

        detections = detector.predict(image) # predigo el contenido de la imagen
        image_with_detections = detector.draw_detections(image, detections)  #dibujo resultados sobre la iimagen

        # Codificamos la imagen anotada para enviarla al frontend
        _, buffer = cv2.imencode('.png', image_with_detections)

        return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



TEMP_DIR='/app/static/media'
os.makedirs(TEMP_DIR,exist_ok=True)

@app.post("/predict/video/")
async def predict_video(file: UploadFile = File(...)):
    try:
        # Leer el video en memoria
        contents = await file.read()
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
                detections = detector.predict(frame_resized, imgsz=416, conf=0.5)
                frame_annotated = detector.draw_detections(frame_resized, detections)

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
#Para poner a correr el backend:
#desde la carpeta backend: uvicorn app.main:app --port 8001 --reload
#para correr el front:
#desde src: npm run dev 