import React from 'react';

const FireHeader = () => {
  return (
    <header className="bg-gray-900 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">FireDetector with YOLO V8s</h1>
        <div className="flex items-center space-x-4">
        </div>
      </div>
    </header>
  );
};

export default FireHeader;