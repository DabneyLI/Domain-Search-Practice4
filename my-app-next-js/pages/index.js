// Inside your index.js or wherever your search component is

// ... other imports
import { useEffect, useState } from 'react';

const fetchHistory = async () => {
  // Fetch the updated history and set it in the state
  const response = await fetch('/api/history');
  const data = await response.json();
  if (response.ok) {
    setHistory(data);
  } else {
    console.error('Error fetching history');
  }
};

const SearchComponent = () => {
  // ... existing state and other hooks

  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Initially fetch the history when the component mounts
    fetchHistory();
  }, []);

  const performSearch = async (domain) => {
    try {
      // Perform the WHOIS lookup
      const response = await fetch('/api/whois?query=' + domain);
      const data = await response.json();
      if (response.ok) {
        // If the search was successful, refresh the history
        fetchHistory();
      } else {
        console.error('Error during WHOIS lookup:', data.error);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  // ... your JSX including the search input and submit button

  return (
    // ... your JSX
  );
};

export default SearchComponent;
