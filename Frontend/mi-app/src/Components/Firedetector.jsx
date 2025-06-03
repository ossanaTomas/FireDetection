// src/components/FireDetector.jsx
import { useState } from "react";

export default function FireDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Elegí una imagen");

    const formData = new FormData();
    formData.append("file", selectedFile);

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

  return (
    <div>
      <h1>Subí una imagen para detectar fuego 🔥</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          required
        />
        <button type="submit">Detectar</button>
      </form>
      {resultImage && (
        <div>
          <h2>Resultado:</h2>
          <img src={resultImage} style={{ maxWidth: "500px" }} />
        </div>
      )}
    </div>
  );
}
