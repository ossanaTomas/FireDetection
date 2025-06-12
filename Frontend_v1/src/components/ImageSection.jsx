import React, { useState, useRef } from 'react';

const ImageSection = ({ sectionRef }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState(0.5);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !fileInputRef.current.files[0]) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);
    formData.append("confidence", confidence);

    try {
      const response = await fetch("http://localhost:8001/predict/image/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error en la respuesta del servidor");

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setSelectedImage(imageUrl);
    } catch (error) {
      console.error("Error al analizar la imagen:", error);
      alert("Ocurrió un error al analizar la imagen.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section ref={sectionRef} className="min-h-screen w-full bg-gray-800 flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 h-96 md:h-auto flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full h-full max-w-2xl flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
          <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
          {selectedImage ? (
            <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-400 mb-4">Selecciona una imagen para analizar</p>
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
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-white">Analizar Imagen</h2>
          <p className="text-gray-300">
            Sube una imagen para detectar posibles incendios.
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
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {selectedImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </button>
            
            <button
              onClick={analyzeImage}
              disabled={!selectedImage || isAnalyzing}
              className={`w-full px-6 py-3 rounded-lg font-medium ${selectedImage && !isAnalyzing ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'} text-white transition-colors`}
            >
              {isAnalyzing ? 'Analizando...' : 'Detectar Fuego'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageSection;