from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import cv2
import io

from fastapi.middleware.cors import CORSMiddleware


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





#Para poner a correr el backend:
#desde la carpeta backend: uvicorn app.main:app --port 8001 --reload
#para correr el front:
#desde src: npm run dev 