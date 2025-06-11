from ultralytics import YOLO
import numpy as np
import cv2


#clase que agrupa la logica de deteccion y anotacion de imagenes
class FireDetector:
    def __init__(self, model_path="best60epocas.pt"):
        self.model = YOLO(model_path)
        self.names = self.model.names

    def predict(self, image: np.ndarray, imgsz=416, conf=0.25):
        results = self.model.predict(source=image, imgsz=imgsz, conf=conf, verbose=False)
        return results[0].plot()  # directamente devolvés el result  
    
    def predict_video(self, image: np.ndarray, imgsz=416, conf=0.25):
        results = self.model.predict(source=image, imgsz=imgsz, conf=conf, verbose=False)
        return results  # directamente devolvés el result  
    
    def dibujar_anotaciones(self,frame, result):
         
         class_colors = {
            "fire": (255, 0, 0),       # azul
            "smoke": (128, 128, 128),    # Gris
            "other": (0, 255, 0),     # Verde
          }
         for box in result.boxes:
             x1, y1, x2, y2 = map(int, box.xyxy[0])
             clase_id = int(box.cls[0])
             conf = float(box.conf[0])
             nombre_clase = self.names.get(clase_id)
             color=class_colors.get(nombre_clase)
            
             cv2.rectangle(frame, (x1, y1), (x2, y2), color , 10)
             texto = f"{nombre_clase} ({conf:.2f})"
             cv2.putText(frame, texto, (x1, y1 - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 10)
             
         return frame
         
         
   #para mas control, prodria utilizar: 
'''
    def draw_detections(self, image: np.ndarray, detections: list):
class FireDetector:
    def __init__(self, model_path="best60epocas.pt"):
        self.model = YOLO(model_path)
        self.names = self.model.names

    def predict(self, image: np.ndarray, imgsz=416, conf=0.25):
        results = self.model.predict(source=image, imgsz=imgsz, conf=conf, verbose=False)
        result = results[0]
        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = self.names[class_id]
            detections.append({
                "class": class_name,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2]
            })
        return detections
    

        class_colors = {
            "fire": (0, 0, 255),       # Rojo
            "smoke": (128, 128, 128),    # Gris
            "other": (0, 255, 0),     # Verde
        }
        for detection in detections:
            x1, y1, x2, y2 = detection["bbox"]
            class_name = detection["class"]
            confidence = detection["confidence"]
            color=class_colors.get(class_name)
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            texto = f"{class_name} ({confidence:.2f})"
            cv2.putText(image, texto, (x1+5, y1+15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        return image
    
        

'''
    


