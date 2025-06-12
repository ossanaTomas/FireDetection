import React, { useState, useRef, useEffect } from 'react';

const WebcamSection = ({ sectionRef }) => {
  const [webcamActive, setWebcamActive] = useState(false);
  const [confidence, setConfidence] = useState(0.5);
  const [resolution, setResolution] = useState("720p");
  const [resultUrl, setResultUrl] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const resultRef = useRef(null);

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const resolutionMap = {
    "240p": { width: 426, height: 240 },
    "360p": { width: 640, height: 360 },
    "480p": { width: 854, height: 480 },
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 }
  };

  useEffect(() => {
    let triedFallback = false;

    const startCamera = async () => {
      const { width, height } = resolutionMap[resolution];
      try {
        console.log("[Webcam] Solicitando acceso a cámara con resolución:", width, "x", height);
        const constraints = { video: { width, height } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        console.log("[Webcam] Cámara iniciada. Conectando a WebSocket...");
        const ws = new WebSocket("ws://127.0.0.1:8001/ws");
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[WebSocket] Conectado.");
        };

        ws.onerror = (e) => {
          console.error("[WebSocket] Error:", e);
        };

        ws.onmessage = (event) => {
          const blob = new Blob([event.data], { type: "image/jpeg" });
          const imgUrl = URL.createObjectURL(blob);
          setResultUrl(imgUrl);
          if (resultRef.current) {
            resultRef.current.src = imgUrl;
          }
        };

        const ctx = canvasRef.current.getContext("2d");

        intervalRef.current = setInterval(() => {
          if (!videoRef.current || !canvasRef.current || ws.readyState !== WebSocket.OPEN) return;
          ctx.drawImage(videoRef.current, 0, 0, width, height);
          canvasRef.current.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                ws.send(buffer);
              });
            }
          }, "image/jpeg");
        }, 200);

      } catch (err) {
        if (!triedFallback) {
          triedFallback = true;
          console.warn("[Webcam] Resolución no compatible. Intentando sin restricciones...");
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        } else {
          console.error("[Webcam] Error irreparable:", err);
          alert("No se pudo acceder a la webcam.");
        }
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      setResultUrl(null);
    };

    if (webcamActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [webcamActive, resolution]);

  return (
    <section ref={sectionRef} className="min-h-screen w-full bg-gray-800 flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 p-8 bg-gray-900 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-white">Cámara en vivo 🔴</h2>
        <video ref={videoRef} autoPlay muted width="320" height="240" className="rounded-lg border border-gray-600" />
        <canvas ref={canvasRef} width={resolutionMap[resolution].width} height={resolutionMap[resolution].height} style={{ display: "none" }} />
        <button
          onClick={() => setWebcamActive(prev => !prev)}
          className={`px-6 py-3 rounded-lg font-medium ${webcamActive ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
        >
          {webcamActive ? 'Desactivar cámara' : 'Activar cámara'}
        </button>
      </div>

      <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-white">Detección en tiempo real</h2>

        <label className="text-white">
          Confianza: <span className="text-blue-400">{confidence.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          className="w-full"
        />

        <label className="text-white">Resolución:</label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
        >
          {Object.keys(resolutionMap).map((res) => (
            <option key={res} value={res}>{res}</option>
          ))}
        </select>

        {resultUrl && (
          <div className="w-full mt-4">
            <h3 className="text-white mb-2">Resultado:</h3>
            <img ref={resultRef} src={resultUrl} alt="Resultado de la detección" className="w-full rounded-lg border border-gray-700" />
          </div>
        )}
      </div>
    </section>
  );
};

export default WebcamSection;
