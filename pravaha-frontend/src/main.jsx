import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Silk from './backgrounds/silk.jsx'; 
import { BackgroundBeams } from './backgrounds/beams.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="fixed w-screen h-screen z-[-1] overflow-hidden bg-black">
        <BackgroundBeams />
      </div>
      <App />
  </StrictMode>
);


{/* <Silk
          speed={1}
          scale={1}
          color="#7B7481" 
          noiseIntensity={1}
          rotation={0}
        /> */}