import React from 'react';
import { formatAnnouncementTime } from '../utils/timeFormatter';

const AnnouncementDetailModal = ({ announcement, onClose }) => {
  if (!announcement) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl bg-gradient-to-br from-slate-800/90 via-gray-900/90 to-gray-800/90 border border-white/10 p-6 md:p-10 text-white animate-fade-in-up flex flex-col gap-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="flex flex-col gap-y-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-300 tracking-tight">
            {announcement.company_name} <span className="text-xl sm:text-2xl font-semibold">({announcement.symbol})</span>
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">AI Analysis</h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-400 font-bold">Classification:</span>
                <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm
                    ${announcement.classification === 'Potential Upside' ? 'bg-green-700/70 text-green-200' :
                        announcement.classification === 'Potential Downside' ? 'bg-red-700/70 text-red-200' :
                        'bg-gray-700/70 text-gray-200'}`}
                >
                    {announcement.classification}
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-400 font-bold">Sentiment:</span>
                <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                    ${announcement.sentiment === 'Positive' ? 'bg-green-900/40 text-green-300' :
                        announcement.sentiment === 'Negative' ? 'bg-red-900/40 text-red-300' :
                        'bg-gray-800/40 text-gray-300'}`}
                >
                    {announcement.sentiment}
                </span>
            </div>

            <span className="text-xs sm:text-sm font-bold text-gray-400 ml-auto">
              {formatAnnouncementTime(  announcement.announcement_time)}
            </span>
        </div>

        <div>
          <span className="block text-xs uppercase tracking-wide text-gray-400 font-bold mb-2">Summary</span>
          <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
            {announcement.summary}
          </p>
        </div>

        {announcement.reasoning && (
          <div>
            <span className="block text-xs uppercase tracking-wide text-gray-400 font-bold mb-2">Reasoning</span>
            <p className="text-sm sm:text-base text-gray-300 italic leading-relaxed">
              {announcement.reasoning}
            </p>
          </div>
        )}

        {announcement.source_pdf_url && (
          <div className="mt-6 border-t border-gray-700/40 pt-4">
            <span className="block text-xs uppercase tracking-wide text-gray-400 font-bold mb-3">Source of Truth</span>
            <a
              href={announcement.source_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700/70 text-blue-200 hover:bg-blue-600/80 hover:text-white font-semibold text-sm shadow transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="M5 12l14-9"/><path d="M5 12v7a2 2 0 002 2h7"/></svg>
              View Original Circular
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementDetailModal;