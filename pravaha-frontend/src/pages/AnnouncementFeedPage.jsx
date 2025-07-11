import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { formatAnnouncementTime, getRelativeDate } from '../utils/timeFormatter';
import AnnouncementDetailModal from '../components/AnnouncementDetailModal';

const BACKEND_API_URL = 'http://localhost:5000/api/announcements';
const SOCKET_SERVER_URL = 'http://localhost:5000';

const AnnouncementsFeedPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    let socket;

    const fetchInitialAnnouncements = async () => {
      try {
        const response = await axios.get(BACKEND_API_URL);
        const processedAnnouncements = response.data.map(ann => ({
          ...ann,
          formattedTime: formatAnnouncementTime(ann.announcement_time),
          relativeDate: getRelativeDate(ann.announcement_time)
        }));
        setAnnouncements(processedAnnouncements);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial announcements:', err);
        setError('Failed to load initial announcements.');
        setLoading(false);
      }
    };

    const setupSocketConnection = () => {
      socket = io(SOCKET_SERVER_URL);
      socket.on('connect', () => console.log('⚡ Connected to Socket.IO backend!'));
      socket.on('new_announcement_analysis', (newAnalysis) => {
        const processedNewAnalysis = {
          ...newAnalysis,
          formattedTime: formatAnnouncementTime(newAnalysis.announcement_time),
          relativeDate: getRelativeDate(newAnalysis.announcement_time)
        };
        setAnnouncements((prevAnnouncements) => [processedNewAnalysis, ...prevAnnouncements]);
      });
      socket.on('disconnect', () => console.log('🔌 Disconnected from Socket.IO backend.'));
      socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err));
    };

    fetchInitialAnnouncements();
    setupSocketConnection();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const openModal = (ann) => setSelectedAnnouncement(ann);
  const closeModal = () => setSelectedAnnouncement(null);

  const statusMessage = loading
    ? 'Loading announcements...'
    : error
    ? error
    : 'Waiting for new announcements to be processed by the backend...';

  return (
    <div className="flex flex-col items-center w-full px-4 md:px-0">
      <h2 className="text-3xl font-bold text-white mb-4">Live Announcements Feed</h2>
      <p className={`mb-8 ${error ? 'text-red-500' : 'text-gray-300'}`}>
        {statusMessage}
      </p>

      {loading ? (
        <p className="text-gray-400">Loading announcements from database...</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-400">No announcements found. New ones will appear here as soon as they are processed.</p>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4">
          {announcements.map((ann, index) => {
            const cardKey = ann._id || ann.source_pdf_url || index;

            return (
              <div
                key={cardKey}
                onClick={() => openModal(ann)}
                className="w-full !p-4 md:p-6 rounded-lg shadow-xl bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-white/5 backdrop-blur-md cursor-pointer hover:shadow-blue-900/50 hover:border-blue-400/20 transition-all duration-200"
              >
                {/* --- HEADER ROW --- */}
                <div className="flex items-start justify-between gap-4 mb-2">
                    {/* Classification Tag & Company Name/Symbol */}
                    <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center gap-1 !px-2 !py-0.5 rounded-full text-xs font-semibold
                        ${ann.classification === 'Potential Upside' ? 'bg-green-700/70 text-green-200' :
                            ann.classification === 'Potential Downside' ? 'bg-red-700/70 text-red-200' :
                            'bg-gray-700/70 text-gray-200'}`}>
                        {ann.classification}
                        </span>
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                            {ann.company_name} <span className="text-base font-semibold text-blue-300 ml-1">({ann.symbol})</span>
                        </h3>
                    </div>
                    {/* Formatted Time */}
                    <span className="text-xs text-gray-400 whitespace-nowrap pt-1">
                        {ann.formattedTime}
                    </span>
                </div>

                {/* --- SUMMARY --- */}
                <div className="mt-2">
                  <div className="text-sm md:text-base text-gray-200 leading-snug line-clamp-2"> {/* Reduced lines to 2 */}
                    {ann.summary}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AnnouncementsFeedPage;