import React from 'react';

const FireHeader = () => {
  return (
    <header className="bg-gray-900 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">FireDetector AI</h1>
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-red-500 rounded-full text-xs font-semibold">LIVE</span>
          <button className="text-sm hover:text-red-300 transition-colors">Docs</button>
        </div>
      </div>
    </header>
  );
};

export default FireHeader;