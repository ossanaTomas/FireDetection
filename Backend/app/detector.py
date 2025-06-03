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

    def draw_detections(self, image: np.ndarray, detections: list):
        for detection in detections:
            x1, y1, x2, y2 = detection["bbox"]
            class_name = detection["class"]
            confidence = detection["confidence"]
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 2)
            texto = f"{class_name} ({confidence:.2f})"
            cv2.putText(image, texto, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        return image
