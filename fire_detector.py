print("Hello word this is: FIRE DETECTOR!")

#"D:\Program Files\python\python.exe" -m pip install ultralytics opencv-python
# "D:\Program Files\python\python.exe" -m pip install --force-reinstall torch --no-cache-dir 

import cv2
import time
from ultralytics import YOLO
modelo=YOLO('Models/best60epocas.pt') #cargo el modelo entrenado



IMAGEN=1
VIDEO=0
WEBCAM=0




def dibujar_anotaciones(frame, result, nombres_clases):
    for box in result.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        clase_id = int(box.cls[0])
        conf = float(box.conf[0])
        nombre_clase = nombres_clases[clase_id]

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
        texto = f"{nombre_clase} ({conf:.2f})"
        cv2.putText(frame, texto, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    return frame


if VIDEO==1:
    nombres_clases = modelo.names  # Diccionario {id: nombre}

    # Cargar video
    video_path = 'videos/Fogata.mp4'
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error al abrir el video.")
        exit()

    frame_index=0
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Fin del video o error al leer un frame.")
            break

        # Hacer predicción (stream=False devuelve lista con un solo resultado)
        if frame_index %4 ==0:
            start=time.time()
           # resized_frame = cv2.resize(frame, (320, 320))  # match imgsz
            resultados = modelo.predict(source=frame, imgsz=416, conf=0.3, verbose=False)
            result = resultados[0]
            print("Tiempo por frame:", time.time() - start)

        frame_index+=1
     
        
        dibujar_anotaciones(frame, result,nombres_clases)
        '''
        # Anotar el frame manualmente con bounding boxes y nombres de clases
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # Coordenadas de la caja
            clase_id = int(box.cls[0])  # ID de clase detectada
            conf = float(box.conf[0])   # Confianza
            nombre_clase = nombres_clases[clase_id]

            # Dibujar la caja
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)

            # Etiqueta con clase y confianza
            texto = f"{nombre_clase} ({conf:.2f})"
            cv2.putText(frame, texto, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Mostrar el frame anotado
        frame = cv2.resize(frame, (800, 600))
        '''
        frame = cv2.resize(frame, (800, 600))
        cv2.imshow(' Detección Multiclase - Presioná Q para salir', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("🛑 Saliste del análisis en tiempo real.")
            break

    cap.release()
    cv2.destroyAllWindows()


if WEBCAM==1:

    cap = cv2.VideoCapture(0)  # cámara

    if not cap.isOpened():
        print("error tomando el video")
    while True:
        ret, frame = cap.read() #toma el frame
        resultados = modelo.predict(frame, imgsz=416, conf=0.5, show=True)
        cv2.imshow('webCamara! ', frame) #muestra el frame en una ventana llamada webCamara
        if not ret:
            print("No se pudo recibir el frame (fin del stream?). Saliendo...")
            break
        # Si el usuario presiona la tecla 'q' de quit, se sale del bucle
        if cv2.waitKey(1) == ord('q'):
            break
    # Liberamos los recursosq
    cap.release()
    cv2.destroyAllWindows()  



if IMAGEN==1:
    resultados=modelo(['imagenes/fire.526.png'],imgsz=416)

    for result in resultados:
        boxes = result.boxes  # Boxes object for bounding box outputs
        masks = result.masks  # Masks object for segmentation masks outputs
        keypoints = result.keypoints  # Keypoints object for pose outputs
        probs = result.probs  # Probs object for classification outputs
        obb = result.obb  # Oriented boxes object for OBB outputs
        result.show()  # display to screen



