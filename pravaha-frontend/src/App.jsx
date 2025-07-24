import React from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavbarComponent.jsx';
import AnnouncementFeedPage from './pages/AnnouncementFeedPage.jsx';
import HeroSection from './pages/HeroSection.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative z-10 bg-transparent">
        <Navbar />

        <main className="flex-grow py-6 px-4 md:px-10 lg:px-20 xl:px-40  mx-auto w-full">
          <Routes>
            <Route path="/" element={<HeroSection />} />
            <Route path="/feed" element={<AnnouncementFeedPage />} />
          </Routes>
        </main>
        <footer className="text-center py-6 border-t border-white/10 bg-black/60 text-gray-400 text-sm">
          <p>© 2024 MarketWise. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;