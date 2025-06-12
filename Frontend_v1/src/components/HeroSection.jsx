import React from 'react';

const HeroSection = ({ scrollToSection }) => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <img 
        src="/fondo.jpg" 
        alt="Fondo de incendio" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Fire detection 🔥 </h1>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8"></h1>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <button 
            onClick={() => scrollToSection('image-section')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            Cargar Imagen
          </button>
          <button 
            onClick={() => scrollToSection('video-section')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            Cargar Video
          </button>
          <button 
            onClick={() => scrollToSection('webcam-section')}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            Abrir WebCam
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;