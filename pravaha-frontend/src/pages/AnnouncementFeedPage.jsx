import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { formatAnnouncementTime, getRelativeDate, getGroupDateHeader } from '../utils/timeFormatter';
import AnnouncementDetailModal from '../components/AnnouncementDetailModal';
// Import the icons needed for the new pagination UI
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const BACKEND_API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_SERVER_URL = 'http://localhost:5000';
const ITEMS_PER_PAGE = 20;

const AnnouncementsFeedPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [groupedAnnouncements, setGroupedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const processAnnouncementsForGrouping = useCallback((rawAnnouncements) => {
    const newGroupedAnnouncements = [];
    let lastDateHeader = null; // Track the last date header shown

    rawAnnouncements.forEach(ann => {
      const currentAnnDateHeader = getGroupDateHeader(ann.announcement_time);
      if (currentAnnDateHeader !== lastDateHeader) {
        // Add a date header if it's a new date group
        newGroupedAnnouncements.push({ type: 'header', value: currentAnnDateHeader, id: currentAnnDateHeader });
        lastDateHeader = currentAnnDateHeader;
      }
      // Add the announcement itself
      newGroupedAnnouncements.push({ type: 'announcement', data: ann, id: ann._id });
    });
    return newGroupedAnnouncements;
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_API_BASE_URL}/announcements?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;

      console.log(`Fetching announcements from: ${url}`);
      const response = await axios.get(url);
      const { data, currentPage: fetchedPage, totalPages: fetchedTotalPages, totalItems: fetchedTotalItems } = response.data;
      console.log("Announcements data:", data);
      setAnnouncements(data);
      setGroupedAnnouncements(processAnnouncementsForGrouping(data));
      setCurrentPage(fetchedPage);
      setTotalPages(fetchedTotalPages);
      setTotalItems(fetchedTotalItems);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
      setLoading(false);
    }
  }, [currentPage, processAnnouncementsForGrouping]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    let socket;
    socket = io(SOCKET_SERVER_URL);
    socket.on('connect', () => console.log('⚡ Connected to Socket.IO backend!'));
    socket.on('new_announcement_analysis', (newAnalysis) => {
      console.log('Received new analysis from backend:', newAnalysis);
      // Only prepend the new announcement if we are currently on the first page
      // And update total counts
      if (currentPage === 1) {
        const updatedRawAnnouncements = [newAnalysis, ...announcements.slice(0, ITEMS_PER_PAGE - 1)];
        setAnnouncements(updatedRawAnnouncements); // Update raw announcements state
        setGroupedAnnouncements(processAnnouncementsForGrouping(updatedRawAnnouncements)); // Re-process for display

        setTotalItems(prevTotal => prevTotal + 1);
        setTotalPages(Math.ceil((totalItems + 1) / ITEMS_PER_PAGE));
      } else {
        // If not on the first page, just update the total counts
        setTotalItems(prevTotal => prevTotal + 1);
        setTotalPages(Math.ceil((totalItems + 1) / ITEMS_PER_PAGE));
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO backend.');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });

    // Cleanup function for useEffect
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentPage, totalItems, processAnnouncementsForGrouping, announcements]);

  // Handler for pagination button clicks
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openModal = (ann) => setSelectedAnnouncement(ann);
  const closeModal = () => setSelectedAnnouncement(null);

  // Calculate the range of items being shown on the current page
  const firstItemOnPage = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const lastItemOnPage = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Function to generate the page numbers to display in the pagination control
  const getPaginationRange = () => {
    const range = [];
    const numPageLinksToShow = 5; // Total number of visible page buttons (excluding prev/next/ellipses)
    const sidePages = Math.floor(numPageLinksToShow / 2); // Pages to show on each side of current page

    if (totalPages <= numPageLinksToShow + 2) { // If total pages are few, show all
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always add the first page
      range.push(1);

      // Determine the start and end of the central range around the current page
      let start = Math.max(2, currentPage - sidePages);
      let end = Math.min(totalPages - 1, currentPage + sidePages);

      // Adjust start/end if current page is too close to the beginning or end
      if (currentPage - 1 < sidePages) { // Near start
        end = numPageLinksToShow;
      } else if (totalPages - currentPage < sidePages + 1) { // Near end
        start = totalPages - numPageLinksToShow + 1;
      }


      // Add left ellipsis if needed
      if (start > 2) {
        range.push('...');
      }

      // Add central pages
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) { // Avoid duplicating 1 and totalPages if they are already in the loop range
            range.push(i);
        }
      }

      // Add right ellipsis if needed
      if (end < totalPages - 1) {
        range.push('...');
      }

      // Always add the last page (if totalPages > 1 and not already added)
      if (totalPages > 1 && !range.includes(totalPages)) {
        range.push(totalPages);
      }
    }
    return [...new Set(range)].sort((a, b) => (a === '...' || b === '...') ? 0 : a - b); // Ensure unique and sorted, keep '...'
  };


  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-3xl font-bold text-white mb-4">Live Announcements Feed</h2>

      {loading ? (
        <p className="text-gray-400">Loading announcements from database...</p>
      ) : groupedAnnouncements.length === 0 ? ( // Check groupedAnnouncements for emptiness
        <p className="text-gray-400">No announcements found. New ones will appear here as soon as they are processed.</p>
      ) : (
        <>
          <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4">
            {/* Iterate over groupedAnnouncements now */}
            {groupedAnnouncements.map((item) => {
              if (item.type === 'header') {
                return (
                  <h3 key={item.id} className="text-xl font-bold text-gray-300 mt-6 mb-2">{item.value}</h3>
                );
              } else {
                const ann = item.data; // Access the announcement data
                return (
                  <div
                    key={ann._id}
                    onClick={() => openModal(ann)}
                    className="w-full p-4 md:p-6 rounded-lg shadow-xl bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-white/5 backdrop-blur-md cursor-pointer hover:shadow-blue-900/50 hover:border-blue-400/20 transition-all duration-200"
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
                      {/* Formatted Time using the new utility function */}
                      <span className="text-xs text-gray-400 whitespace-nowrap pt-1">
                        {formatAnnouncementTime(ann.announcement_time)}
                      </span>
                    </div>

                    {/* --- SUMMARY --- */}
                    <div className="mt-2">
                      <div className="text-sm md:text-base text-gray-200 leading-snug line-clamp-2">
                        {ann.summary}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-700/40 bg-gray-900/50 px-4 py-3 sm:px-6 w-full max-w-5xl rounded-lg mt-8">
              <div className="flex flex-1 justify-between sm:hidden">
                {/* Mobile Previous/Next buttons */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                {/* Desktop Pagination Summary */}
                <div>
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-medium">{firstItemOnPage}</span> to <span className="font-medium">{lastItemOnPage}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>

                {/* Desktop Pagination Buttons */}
                <div>
                  <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon aria-hidden="true" className="size-5" />
                    </button>

                    {/* Page Numbers */}
                    {getPaginationRange().map((page, idx) => (
                      page === '...' ? (
                        <span
                          key={idx}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-600 focus:outline-offset-0"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          aria-current={currentPage === page ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2
                            ${currentPage === page
                              ? 'z-10 bg-indigo-600 text-white focus-visible:outline-indigo-600'
                              : 'text-gray-300 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:outline-offset-0'
                            }
                            ${loading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}
                          `}
                          disabled={loading}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon aria-hidden="true" className="size-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
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