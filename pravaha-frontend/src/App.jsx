import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'; // <--- NEW IMPORTS
import Navbar from './components/NavbarComponent.jsx';
import io from 'socket.io-client';
import axios from 'axios';
import HeroSection from './pages/HeroSection.jsx';
import AnnouncementFeedPage from './pages/AnnouncementFeedPage.jsx';

function App() {
  return (
    <Router> {/* Wrap your entire app with Router */}
      <div className="min-h-screen flex flex-col relative z-10 bg-transparent">
        <Navbar />

        <main className="flex-grow py-6 px-4 md:px-10 lg:px-20 xl:px-40  mx-auto w-full">
          <Routes> {/* Define your routes here */}
            <Route path="/" element={<HeroSection />} /> {/* Root path shows Hero Section */}
            <Route path="/feed" element={<AnnouncementFeedPage />} /> {/* /feed path shows Announcements Feed */}
            {/* Add more routes here as your app grows (e.g., /watchlist, /portfolio) */}
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