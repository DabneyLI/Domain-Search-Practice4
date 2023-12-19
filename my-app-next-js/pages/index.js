// This code assumes you have a state hook for your search input and a state hook for the history.
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust the import path if necessary

const IndexPage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [history, setHistory] = useState([]);

  // Function to fetch the history of searches
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Function to perform the WHOIS search
  const performSearch = async (event) => {
    event.preventDefault(); // Prevent page reload on form submission

    try {
      const response = await fetch('/api/whois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: searchInput }),
      });

      if (response.ok) {
        fetchHistory(); // Refresh the history after a successful search
      } else {
        const errorData = await response.json();
        console.error('Search failed:', errorData.error);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  useEffect(() => {
    fetchHistory(); // Fetch the history when the component mounts
  }, []);

  return (
    <div>
      <form onSubmit={performSearch}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter a domain to search"
        />
        <button type="submit">Search</button>
      </form>

      <div>
        <h2>Recent Searches:</h2>
        <ul>
          {history.map((record, index) => (
            <li key={index}>{record.domain} - {record.is_registered ? 'Registered' : 'Available'}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IndexPage;
