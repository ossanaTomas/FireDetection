import React, { useState, useRef, useEffect } from 'react';

const WebcamSection = ({ sectionRef }) => {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [confidence, setConfidence] = useState(0.5);
  const [frameCount, setFrameCount] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [outputUrl, setOutputUrl] = useState(null);


  const resolutionMap = {
    "240p": { width: 426, height: 240 },
    "360p": { width: 640, height: 360 },
    "480p": { width: 854, height: 480 },
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsActive(true);
    } catch (err) {
      console.error("Error al acceder a la webcam:", err);
      alert("No se pudo acceder a la webcam. Asegúrate de permitir el acceso.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsActive(false);
    }
  };

  const analyzeWebcam = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("http://localhost:8001/predict/camera/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confidence: confidence,
          frames: frameCount
        }),
      });

      if (!response.ok) throw new Error("Error al analizar el stream");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
    } catch (error) {
      console.error("Error:", error);
      alert("Ocurrió un error al analizar el stream.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopWebcam();
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="min-h-screen w-full bg-gray-800 flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 h-96 md:h-auto flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full h-full max-w-2xl bg-black rounded-lg overflow-hidden flex items-center justify-center">
          {isActive ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <p className="text-gray-400">Webcam inactiva</p>
          )}
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-white">Analizar Webcam</h2>
          <p className="text-gray-300">
            Activa tu webcam para detectar incendios en tiempo real usando nuestro modelo de IA.
          </p>
          
          <div className="space-y-4">
            <label className="text-white block">
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

            <label className="text-white block">
              Cantidad de Frames: <span className="text-blue-400">{frameCount}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={frameCount}
              onChange={(e) => setFrameCount(parseInt(e.target.value))}
              className="w-full"
            />

            <label className="text-white block">
              Resolución:
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
            >
              <option value="240p">240p</option>
              <option value="360p">360p</option>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>

            <button
              onClick={isActive ? stopWebcam : startWebcam}
              className={`w-full px-6 py-3 rounded-lg font-medium ${isActive ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
            >
              {isActive ? 'Detener Webcam' : 'Activar Webcam'}
            </button>
            
            <button
              onClick={analyzeWebcam}
              disabled={!isActive || isAnalyzing}
              className={`w-full px-6 py-3 rounded-lg font-medium ${isActive && !isAnalyzing ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'} text-white transition-colors`}
            >
              {isAnalyzing ? 'Analizando...' : 'Detectar Fuego'}
            </button>

            {outputUrl && (
              <video
                src={outputUrl}
                controls
                className="w-full mt-4 rounded-lg border border-gray-700"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebcamSection;