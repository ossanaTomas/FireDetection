import React, { useState, useRef } from 'react';

const VideoSection = ({ sectionRef }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [confidence, setConfidence] = useState(0.5);
  const [frameCount, setFrameCount] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [outputUrl, setOutputUrl] = useState(null);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file); 
      setSelectedVideo(URL.createObjectURL(file)); 
      setAnalysisResult(null); 
    }
  };

  const analyzeVideo = async () => {
  if (!videoFile) return;

  setIsAnalyzing(true);
  const formData = new FormData();
  formData.append("file", videoFile);
  formData.append("confidence", confidence);
  formData.append("cant_frames", frameCount);

  try {
    const response = await fetch("http://127.0.0.1:8001/predict/video/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const data = await response.json();
    setAnalysisResult(data);
  } catch (error) {
    console.error("Error al analizar el video:", error);
    alert("Ocurrió un error al analizar el video.");
  } finally {
    setIsAnalyzing(false);
  }
};

  return (
    <section ref={sectionRef} className="min-h-screen w-full bg-gray-800 flex flex-col md:flex-row">
      {/* Controles - Mitad izquierda (orden invertido) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 order-1 md:order-1">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-white">Analizar Video</h2>
          <p className="text-gray-300">
            Sube un video para detectar posibles incendios en tiempo real usando nuestro modelo de IA.
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
              onClick={() => fileInputRef.current.click()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {selectedVideo ? 'Cambiar Video' : 'Seleccionar Video'}
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={handleVideoUpload} 
              />
            
            <button
              onClick={analyzeVideo}
              disabled={!selectedVideo || isAnalyzing}
              className={`w-full px-6 py-3 rounded-lg font-medium ${selectedVideo && !isAnalyzing ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'} text-white transition-colors`}
            >
              {isAnalyzing ? 'Analizando...' : 'Detectar Fuego'}
            </button>
          </div>
        </div>
      </div>

      {/* Área de carga - Mitad derecha (orden invertido) */}
      <div className="w-full md:w-1/2 h-96 md:h-auto flex items-center justify-center p-8 bg-gray-900 order-2 md:order-2">
        <div className="w-full h-full max-w-2xl flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
          {selectedVideo ? (
            <video ref={videoRef} src={selectedVideo} className="w-full h-full object-contain" controls />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-400 mb-4">Selecciona un video para analizar</p>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                Seleccionar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;