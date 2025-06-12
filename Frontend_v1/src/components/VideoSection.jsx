import React, { useState, useRef } from 'react';

const VideoSection = ({ sectionRef }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [confidence, setConfidence] = useState(0.5);
  const [frameCount, setFrameCount] = useState(5);
  const [resolution, setResolution] = useState("720p");

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file); 
      setSelectedVideo(URL.createObjectURL(file)); 
      setAnalysisResult(null);
      // Limpiar video procesado anterior
      if (processedVideoUrl) {
        URL.revokeObjectURL(processedVideoUrl);
        setProcessedVideoUrl(null);
      }
    }
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("confidence", confidence);
    formData.append("cant_frames", frameCount);

    try {
      const response = await fetch("http://127.0.0.1:8001/predict/video/", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get('content-type'));

      if (!response.ok) {
        // Si hay error, intentar leer como JSON
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el servidor");
      }

      // Leer respuesta como archivo binario
      const blob = await response.blob();
      console.log("Blob size:", blob.size, "bytes");
      
      // Crear URL para el video procesado
      const videoUrl = URL.createObjectURL(blob);
      setProcessedVideoUrl(videoUrl);
    

    } catch (error) {
      console.error("Error al analizar el video:", error);
      setAnalysisResult({ 
        error: error.message || "Ocurrió un error al analizar el video" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Cleanup de URLs al desmontar componente
  React.useEffect(() => {
    return () => {
      if (selectedVideo) URL.revokeObjectURL(selectedVideo);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
    };
  }, []);

  return (
    <section ref={sectionRef} className="min-h-screen w-full bg-gray-800 flex flex-col">
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Controles - Lado izquierdo */}
        <div className="w-full lg:w-1/3 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6">
            <h2 className="text-3xl font-bold text-white">Detectar Fuego en Video</h2>
            <p className="text-gray-300">
              Sube un video para detectar posibles incendios usando IA. El sistema analizará cada frame y marcará las detecciones.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-white block mb-2">
                  Confianza: <span className="text-blue-400 font-mono">{confidence.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Baja (0.0)</span>
                  <span>Alta (1.0)</span>
                </div>
              </div>

              <div>
                <label className="text-white block mb-2">
                  Frames a procesar: <span className="text-blue-400 font-mono">{frameCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={frameCount}
                  onChange={(e) => setFrameCount(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Cada frame</span>
                  <span>Cada 10 frames</span>
                </div>
              </div>
              
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
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
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedVideo && !isAnalyzing 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 cursor-not-allowed text-gray-300'
                }`}
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  'Detectar Fuego'
                )}
              </button>

              {/* Resultado del análisis */}
              {analysisResult && (
                <div className={`p-4 rounded-lg ${
                  analysisResult.error 
                    ? 'bg-red-900 border border-red-600' 
                    : 'bg-green-900 border border-green-600'
                }`}>
                  {analysisResult.error ? (
                    <p className="text-red-200">
                      <span className="font-semibold">Error:</span> {analysisResult.error}
                    </p>
                  ) : (
                    <div className="text-green-200">
                      <p className="font-semibold mb-1">{analysisResult.message}</p>
                      <p className="text-sm">Tamaño: {analysisResult.fileSize}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos - Lado derecho */}
        <div className="w-full lg:w-2/3 p-8 space-y-6">
          {/* Video original */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Video Original</h3>
            </div>
            <div className="aspect-video flex items-center justify-center">
              {selectedVideo ? (
                <video 
                  ref={videoRef} 
                  src={selectedVideo} 
                  className="w-full h-full object-contain" 
                  controls 
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-4">Selecciona un video para comenzar</p>
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  >
                    Seleccionar archivo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Video procesado */}
          {processedVideoUrl && (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-white font-semibold">Video con Detección de Fuego</h3>
              </div>
              <div className="aspect-video">
                <video 
                  src={processedVideoUrl} 
                  className="w-full h-full object-contain" 
                  controls 
                  autoPlay={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;