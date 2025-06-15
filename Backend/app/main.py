from fastapi import FastAPI, File, Form, UploadFile, HTTPException, WebSocket
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import cv2, time,os,tempfile
import subprocess
import io
import av


ffmpeg_path = "D:/ffmpeg/bin/ffmpeg.exe"

if ffmpeg_path is None:
    raise RuntimeError("ffmpeg no encontrado en PATH")


#import uuid #generar identificadores unicos universales 
#import shutil #Copiar archivos completos entre flujos binarios (streaming)
from fastapi.middleware.cors import CORSMiddleware
from app.detector import FireDetector


app = FastAPI(title="Fire Detector Backend")
# app.mount("/static", StaticFiles(directory="app/static"), name="static")

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
       
        # Codificamos la imagen anotada para enviarla al frontend
        _, buffer = cv2.imencode('.jpg', detections)
        return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")





@app.post("/predict/video/")
async def predict_video(file: UploadFile = File(...), confidence:float = Form(...), cant_frames:int=Form(...)):
    try: 
        print("comenzando a guardar video")
        #creo archivo temporal de tipo .mp4, delete false significa que no se borre al terminar el bloque
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        print(f"Tamaño del video cargado: {os.path.getsize(tmp_path)} bytes")
        
        cap = cv2.VideoCapture(tmp_path)
        print("Video abierto")
        if not cap.isOpened():
            return {"error": "No se pudo abrir el video"}

        # Obtener parámetros del video original
        fps = cap.get(cv2.CAP_PROP_FPS)
        ancho = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        alto = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".avi") as tmp_output: #creo otro arc tmp pero para la salida por eso .avi
            output_path = tmp_output.name

        fourcc = cv2.VideoWriter_fourcc(*'MJPG')  # Codec mp4v
        out = cv2.VideoWriter(output_path, fourcc, fps, (ancho//2, alto//2))

        frame_index=0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            #cada que cantidad de frames se realiza un analisis
            if frame_index % cant_frames == 0:
                
                start=time.time()
                resultados = fire_detector.predict_video(frame, imgsz=416, conf=confidence)
                result = resultados[0]
                print("Procesando frame:",frame_index," Tiempo por frame:", time.time() - start)# Dibujar resultados en el frame
                
            annotated_frame=fire_detector.dibujar_anotaciones(frame, result)
            #redimenciono antes de escribir
            annotated_frame = cv2.resize(annotated_frame, (ancho // 2, alto // 2))
            out.write(annotated_frame)
            frame_index += 1

        cap.release()
        out.release()
        print(f"Video procesado intermedio guardado en {output_path}, tamaño: {os.path.getsize(output_path)} bytes")

        #Conversión final a H.264
        output_h264 = output_path.replace(".avi", "_h264.mp4")
        subprocess.run([
             ffmpeg_path, "-y", "-i", output_path,
               "-c:v", "libx264", "-preset", "ultrafast", "-crf", "32",
              output_h264
        ], check=True)

        print(f"Video convertido a H.264 guardado en {output_h264}, tamaño: {os.path.getsize(output_h264)} bytes")

        return FileResponse(path=output_h264, media_type="video/mp4", filename="video_procesado.mp4")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
    


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        data = await websocket.receive_bytes()
        np_data = np.frombuffer(data, np.uint8)
        frame = cv2.imdecode(np_data, cv2.IMREAD_COLOR)

        # Procesar con YOLO
        detections = fire_detector.predict(frame, conf=0.45)
        # Codificar imagen de nuevo para enviar
        _, buffer = cv2.imencode('.jpg', detections)
        await websocket.send_bytes(buffer.tobytes())





#Para poner a correr el backend:
#desde la carpeta backend: uvicorn app.main:app --port 8001 --reload
#para correr el front:
#desde src: npm run dev 

