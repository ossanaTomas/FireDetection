// src/components/FireDetector.jsx
import { useState } from "react";
import { useEffect, useRef } from "react";

export default function FireDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [confidence, setConfidence] = useState(0.5); // valor inicial dentro de lo razonable 
  const [resultvideo, setResultVideo] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);



  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const resultRef = useRef(null);



  useEffect(() => {

    let stream = null;
    let intervalId = null;
    let ws = null;

    const startCamera = async () => {
      const ws = new WebSocket("ws://127.0.0.1:8001/ws"); // cambiar el puerto si es necesario!!!
      const stream = await navigator.mediaDevices.getUserMedia({ video: true }); //pide permiso al navegador a utilizar la camara
      if (videoRef.current) videoRef.current.srcObject = stream; //
      const ctx = canvasRef.current.getContext("2d");

      intervalId = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.toBlob((blob) => {
          if (blob && ws.readyState === WebSocket.OPEN) {
            blob.arrayBuffer().then(buffer => ws.send(buffer));
          }
        }, "image/jpeg");
      }, 200);

      ws.onmessage = (event) => {
        const blob = new Blob([event.data], { type: "image/jpeg" });
        resultRef.current.src = URL.createObjectURL(blob);
      };
    }

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };

    if (webcamActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera(); // cleanup al desmontar
  }, [webcamActive]);

  const handleSubmitImage = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Elegí una imagen");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("confidence", confidence);

    try {
      const response = await fetch("http://127.0.0.1:8001/predict/image/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al detectar fuego");
      }

      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    if (!selectedVideo) return alert("Elegí un video");

    const formData = new FormData();
    formData.append("file", selectedVideo);

    try {
      const response = await fetch("http://127.0.0.1:8001/predict/video/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al detectar fuego");
      }

      const blob = await response.blob()
      const videoUrl = URL.createObjectURL(blob);
      setResultVideo(videoUrl)

      console.log(`Tamaño del blob recibido: ${blob.size} bytes`);
      console.log("Tipo MIME del blob:", blob.type);

      /*
      // Descargar para verificar (puedes quitar esto después de probar)
      const tempUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = tempUrl;
      a.download = "video_procesado.mp4";
      a.click();
     */
    /*
      const file = new File([blob], "video_procesado.mp4", { type: "video/mp4" });
      const url = URL.createObjectURL(file);
   */
    

    } catch (err) {
      alert("Error: " + err.message);
    }

  };

  // 📺 VIDEO STREAMING (MJPEG)




  return (
    <div>
      <h1>Subí una imagen para detectar fuego 🔥</h1>
      <form onSubmit={handleSubmitImage}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          required
        />
        <h4>confianza para seleccion de fuego🔥</h4>
        <input
          type="range" // tipo barra deslizante
          min="0"
          max="1"
          step="0.05"
          value={confidence} // Permite valores decimaleses
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          required
        />
        <span>{confidence.toFixed(2)}</span>
        <button type="submit">Detectar</button>
      </form>

      <h1>Subí un video para detectar fuego 🔥</h1>
      <form onSubmit={handleSubmitVideo}>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setSelectedVideo(e.target.files[0])}
          required
        />
        <button type="submit">Detectar</button>
      </form>



      <h1>Modo cámara en vivo 🔴</h1>
      <button onClick={() => setWebcamActive(!webcamActive)}>
        {webcamActive ? "Desactivar cámara" : "Activar cámara"}
      </button>

      {webcamActive && (
        <div>
          <video ref={videoRef} autoPlay muted width="320" height="240" />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />
          <h3>Resultado en tiempo real:</h3>
          <img ref={resultRef} width="320" height="240" />
        </div>
      )}

      {resultvideo && (
        <div>
          <h2>Resultado del video:</h2>
          <video
            src={resultvideo}
            controls
            autoPlay
            style={{ maxWidth: "500px" }}
            onError={(e) => console.error("Error al cargar el video:", e.target.error)}
          />
        </div>
      )}

      {resultImage && (
        <div>
          <h2>Resultado:</h2>
          <img src={resultImage} style={{ maxWidth: "500px" }} />
        </div>
      )}
    </div>
  );
}