import React from 'react';

const FireFooter = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 p-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold text-white mb-2">FireDetector AI</h3>
            <p className="text-sm">Detección de incendios con inteligencia artificial</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Documentación</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} FireDetector AI. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default FireFooter;