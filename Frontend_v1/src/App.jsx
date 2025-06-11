import React, { useRef } from 'react';
import FireHeader from './components/FireHeader';
import HeroSection from './components/HeroSection';
import ImageSection from './components/ImageSection';
import VideoSection from './components/VideoSection';
import WebcamSection from './components/WebcamSection';
import FireFooter from './components/FireFooter';

const App = () => {
  const imageSectionRef = useRef(null);
  const videoSectionRef = useRef(null);
  const webcamSectionRef = useRef(null);

  const scrollToSection = (section) => {
    let ref = null;
    switch (section) {
      case 'image-section':
        ref = imageSectionRef;
        break;
      case 'video-section':
        ref = videoSectionRef;
        break;
      case 'webcam-section':
        ref = webcamSectionRef;
        break;
      default:
        return;
    }

    ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-900 text-white">
      <FireHeader />
      
      <HeroSection scrollToSection={scrollToSection} />
      
      <ImageSection sectionRef={imageSectionRef} />
      
      <VideoSection sectionRef={videoSectionRef} />
      
      <WebcamSection sectionRef={webcamSectionRef} />
      
      <FireFooter />
    </div>
  );
};

export default App;

// DONE