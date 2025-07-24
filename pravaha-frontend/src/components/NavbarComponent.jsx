import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CiSearch } from "react-icons/ci";
import axios from 'axios';
import {
    Navbar,
    NavBody,
    NavItems,
    MobileNav,
    NavbarLogo,
    NavbarButton,
    MobileNavHeader,
    MobileNavToggle,
    MobileNavMenu,
} from "./resizable-navbar"


const navigation = [
    { name: 'My Feed', href: '/feed' },
    { name: 'Watchlist', href: '#' },
    { name: 'Portfolio', href: '#' },
    { name: 'News', href: '#' },
];
const COMPANY_SEARCH_API_URL = 'http://localhost:5000/api/companies/search';

const NavbarComponent = () => {

    const searchInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    // Function to fetch suggestions from the backend
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

    // Debounced version of fetchSuggestions
    const debouncedFetchSuggestions = useCallback(
        debounce(fetchSuggestions, 300),
        [fetchSuggestions]
    );

    // Handle input change
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

    // Handle clicking a suggestion
    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion.Scrip_Name || suggestion.scrip_id); // Set input to company name or symbol
        setSuggestions([]); // Clear suggestions
        setShowSuggestions(false); // Hide the dropdown
        // You might want to trigger a search or navigate to a company page here
        console.log('Selected company:', suggestion);
    };

    // Handle blur event for the input field to hide suggestions if not selected
    const handleInputBlur = () => {
        // Delay hiding suggestions to allow click on a suggestion item
        setTimeout(() => setShowSuggestions(false), 100);
    };

    const handleInputFocus = () => {
        if (searchTerm.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    // 2. Add keyboard event listener on mount and clean up on unmount
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

    return (
        <header style={{
            padding: '16px 24px',
        }}
            className="flex justify-between items-center py-4 px-6 md:px-10 border-b border-white/10 bg-black/60 backdrop:bg-gray-50 shadow-lg sticky top-0 z-50 text-white">
            {/* Left Section: App Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Placeholder for a simple logo if needed */}
                {/* <div style={{ width: '28px', height: '28px', backgroundColor: '#53d22c' }}></div> */}
                <a href="/" className="m-0 text-3xl !font-bold">Pravaha</a>
            </div>

            <nav style={{ display: 'flex', gap: '20px' }}>
                {navigation.map((n) => (
                    <div key={n.name} className="hover:scale-125">
                        <a href={n.href}>{n.name}</a>
                    </div>
                ))}
            </nav>

            {/* Right Section: Search, Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: "8px 12px" }} className="flex items-center bg-white/10 rounded-lg gap-2 ">
                    <CiSearch className="text-xl" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder="Search companies"
                        className="bg-transparent border-none outline-none text-white !text-sm w-[150px] placeholder:text-gray-400"
                    />
                    <span className="bg-black/20 rounded p-1 !text-xs text-white">Ctrl+K</span>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
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

                {/* Avatar */}
                <div >
                    <img className="inline-block size-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AK" />
                </div>

            </div>
        </header>
    );
};

export default NavbarComponent;