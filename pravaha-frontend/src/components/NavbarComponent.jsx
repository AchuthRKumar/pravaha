import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CiSearch } from "react-icons/ci";
import { FaBars, FaTimes } from 'react-icons/fa'; // Import icons for mobile menu
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom'; // Import Link for proper navigation

const navigation = [
    { name: 'My Feed', href: '/feed' },
    { name: 'Watchlist', href: '#' },
    { name: 'Portfolio', href: '#' },
    { name: 'News', href: '#' },
];
const COMPANY_SEARCH_API_URL = 'http://localhost:5000/api/companies/search';

const NavbarComponent = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // New state for mobile menu

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    const fetchSuggestions = useCallback(async (query) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const response = await axios.get(`${COMPANY_SEARCH_API_URL}?q=${query}`);
            setSuggestions(response.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, []);

    const debouncedFetchSuggestions = useCallback(
        debounce(fetchSuggestions, 300),
        [fetchSuggestions]
    );

    const handleInputChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
        } else {
            debouncedFetchSuggestions(value);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion.Scrip_Name || suggestion.scrip_id);
        setSuggestions([]);
        setShowSuggestions(false);
        console.log('Selected company:', suggestion);
    };

    const handleInputBlur = () => {
        setTimeout(() => setShowSuggestions(false), 100);
    };

    const handleInputFocus = () => {
        if (searchTerm.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    return (
        <header
            className="flex items-center justify-between py-4 px-6 md:px-10 lg:px-20 border-b border-white/10 bg-black/60 backdrop-blur-sm shadow-lg sticky top-0 z-50 text-white"
        >
            {/* Left Section: App Title */}
            <div className="flex items-center gap-2">
                <Link to="/" className="text-2xl sm:text-3xl font-bold">Pravaha</Link>
            </div>

            {/* Desktop Navigation Links (hidden on small screens) */}
            <nav className="hidden lg:flex items-center gap-6">
                {navigation.map((n) => (
                    <div key={n.name} className="hover:scale-105 transition-transform">
                        <Link to={n.href} className="text-lg font-medium text-gray-300 hover:text-white">
                            {n.name}
                        </Link>
                    </div>
                ))}
            </nav>

            {/* Right Section: Search & Auth */}
            <div className="flex items-center gap-3 relative"> {/* Added relative for search suggestions positioning */}
                <div className="hidden md:flex items-center bg-white/10 rounded-lg gap-2 px-3 py-2"> {/* Hidden on small, flex on md+ */}
                    <CiSearch className="text-xl text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder="Search companies"
                        className="bg-transparent border-none outline-none text-white text-sm w-[120px] lg:w-[150px] placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                    />
                    <span className="bg-black/20 rounded px-1 py-0.5 text-xs text-white hidden lg:inline">Ctrl+K</span>
                </div>

                {/* Suggestions Dropdown (positioned relative to its parent .relative div) */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full right-0 mt-2 w-60 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {suggestions.map((suggestion) => (
                            <div
                                key={suggestion.ISIN_NUMBER}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-700 text-sm text-gray-200"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion.Scrip_Name} ({suggestion.scrip_id})
                            </div>
                        ))}
                    </div>
                )}

                {/* Auth UI for Desktop (hidden on small screens) */}
                <div className="hidden lg:flex items-center gap-3">
                    {currentUser ? (
                        <div className="relative group">
                            <img className="inline-block size-8 rounded-full ring-2 ring-white cursor-pointer"
                                src={currentUser.photoURL || "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                                alt={currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "User"}
                                title={currentUser.email}
                            />
                            <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-md"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold">
                                Login
                            </Link>
                            <Link to="/signup" className="px-3 py-1.5 md:px-4 md:py-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-semibold">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle (visible on small screens) */}
                <button
                    className="lg:hidden text-white text-xl p-2 rounded-md hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle navigation"
                >
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Menu Content (conditionally rendered) */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-gray-900 border-t border-gray-700 flex flex-col items-center py-6 gap-4 shadow-lg z-40">
                    <nav className="flex flex-col items-center gap-4">
                        {navigation.map((n) => (
                            <Link
                                key={n.name}
                                to={n.href}
                                className="text-lg font-medium text-gray-300 hover:text-white"
                                onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                            >
                                {n.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex flex-col items-center gap-4 mt-4">
                        {currentUser ? (
                            <>
                                <span className="text-gray-400 text-sm">Logged in as: <span className="font-semibold">{currentUser.email}</span></span>
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-semibold"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold w-40 text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-semibold w-40 text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                    {/* Mobile Search Bar */}
                    <div className="flex items-center bg-white/10 rounded-lg gap-2 px-3 py-2 mt-4 w-full max-w-[250px]">
                        <CiSearch className="text-xl text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder="Search companies"
                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                        />
                    </div>
                </div>
            )}
        </header>
    );
};

export default NavbarComponent;