// Function to parse and format the messy announcement_time string
export const formatAnnouncementTime = (timeString) => {
    if (!timeString) return 'N/A';

    // Attempt to extract the date and time from the beginning of the string
    // Example: "10-Jul-2025 23:19:47"
    const match = timeString.match(/(\d{2}-\w{3}-\d{4}\s\d{2}:\d{2}:\d{2})/);
    if (match && match[1]) {
        const dateTimePart = match[1];
        try {
            // Parse into a Date object
            const date = new Date(dateTimePart.replace(/-/g, ' ')); // Convert "10-Jul-2025" to "10 Jul 2025" for parsing
            
            // Format to a more readable string (e.g., "July 10, 2025, 11:19 PM")
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true, // Use AM/PM
            };
            return date.toLocaleString('en-US', options);
        } catch (e) {
            console.error('Error parsing date part:', dateTimePart, e);
            return dateTimePart; // Return original part if parsing fails
        }
    }
    return timeString; // Fallback to original string if no match
};

export const getRelativeDate = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString.split(' ')[0].replace(/-/g, ' ')); 

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.getTime() === today.getTime()) {
        return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
};

export const getGroupDateHeader = (rawTimeString) => {
    const match = rawTimeString.match(/(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2})/);
    if (!match || !match[1]) {
        return 'Unknown Date';
    }
    const date = new Date(match[1]);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1); // Set yesterday's date

    // Normalize dates to remove time component for accurate comparison
    const normalizeDate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const normalizedDate = normalizeDate(date);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);

    if (normalizedDate.getTime() === normalizedToday.getTime()) {
        return 'Today';
    } else if (normalizedDate.getTime() === normalizedYesterday.getTime()) {
        return 'Yesterday';
    } else {
        // For other dates, format as "Month Day, Year"
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
};