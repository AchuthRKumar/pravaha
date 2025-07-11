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

// Also add a helper to format the current date/time to show "Today" or "Yesterday"
export const getRelativeDate = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString.split(' ')[0].replace(/-/g, ' ')); // Use only the date part for comparison

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

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