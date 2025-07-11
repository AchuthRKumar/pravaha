import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Define backend URLs
const BACKEND_API_URL = 'http://localhost:5000/api/announcements'; // Your existing API endpoint
const SOCKET_SERVER_URL = 'http://localhost:5000'; // Socket.IO endpoint

const AnnouncementsFeedPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let socket;

    const fetchInitialAnnouncements = async () => {
      try {
        const response = await axios.get(BACKEND_API_URL);
        setAnnouncements(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial announcements:', err);
        setError('Failed to load initial announcements.');
        setLoading(false);
      }
    };

    const setupSocketConnection = () => {
      socket = io(SOCKET_SERVER_URL);

      socket.on('connect', () => {
        console.log('⚡ Connected to Socket.IO backend!');
      });

      socket.on('new_announcement_analysis', (newAnalysis) => {
        console.log('Received new analysis from backend:', newAnalysis);
        setAnnouncements((prevAnnouncements) => [newAnalysis, ...prevAnnouncements]);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from Socket.IO backend.');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
      });
    };

    fetchInitialAnnouncements();
    setupSocketConnection();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-4 md:px-0"> 
      <h2 className="text-3xl font-bold text-white mb-4">Live Announcements Feed</h2>
      <p className="text-gray-300 mb-8">
        {loading ? 'Loading announcements...' : 'Waiting for new announcements to be processed by the backend...'}
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading announcements from database...</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-400">No announcements found. New ones will appear here as soon as they are processed.</p>
      ) : (
        <div className="space-y-8 w-full max-w-5xl mx-auto">
          {announcements.map((ann, index) => (
            <div
              key={ann._id || ann.source_pdf_url || index}
              className="w-full p-6 md:p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-gray-800/90 border border-white/10 backdrop-blur-lg hover:shadow-blue-900/40 hover:border-blue-400/30 transition-all duration-200"
            >
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse shadow-lg" />
                  <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    {ann.company_name}
                  </span>
                  <span className="text-base font-semibold text-blue-300 ml-2">({ann.symbol})</span>
                </div>

              </div>

              {/* Status Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4 mt-2">
                <span className="text-xs font-bold text-gray-400">Classification:</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm
                  ${ann.classification === 'Potential Upside' ? 'bg-green-700/70 text-green-200' :
                    ann.classification === 'Potential Downside' ? 'bg-red-700/70 text-red-200' :
                    'bg-gray-700/70 text-gray-200'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  {ann.classification}
                </span>
                <span className="text-xs font-bold text-gray-400 ml-2">Sentiment:</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                  ${ann.sentiment === 'Positive' ? 'bg-green-900/40 text-green-300' :
                    ann.sentiment === 'Negative' ? 'bg-red-900/40 text-red-300' :
                    'bg-gray-800/40 text-gray-300'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {ann.sentiment}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700/40 my-3" />

              {/* Summary Section */}
              <div className="mb-2">
                <span className="block text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">Summary</span>
                <div className="text-lg font-semibold text-white leading-snug">
                  {ann.summary}
                </div>
              </div>

              {/* Reasoning Section */}
              {ann.reasoning && (
                <div className="mb-2">
                  <span className="block text-xs uppercase tracking-wide text-gray-400 font-bold mb-1">Reasoning</span>
                  <div className="text-sm text-gray-300 italic">
                    {ann.reasoning}
                  </div>
                </div>
              )}

              {/* Source PDF Link */}
              {ann.source_pdf_url && (
                <a
                  href={ann.source_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 px-4 py-2 rounded-lg bg-blue-900/60 text-blue-200 hover:bg-blue-800/80 hover:text-white font-semibold text-sm shadow transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="M5 12l14-9"/><path d="M5 12v7a2 2 0 002 2h7"/></svg>
                  View Source PDF
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsFeedPage;