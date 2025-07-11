import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from "./components/ui/provider"; 
import Silk from './backgrounds/silk.jsx'; 
import { BackgroundBeams } from './backgrounds/beams.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider> 
      <div style={{
        position: 'fixed', 
        top: 0,
        left: 0,
        width: '100vw',    
        height: '100vh',   
        zIndex: -1,        
        overflow: 'hidden', 
      }}>
        {/* <Silk
          speed={1}
          scale={1}
          color="#7B7481" 
          noiseIntensity={1}
          rotation={0}
        /> */}
        <BackgroundBeams />
      </div>
      <App />
    </Provider>
  </StrictMode>
);