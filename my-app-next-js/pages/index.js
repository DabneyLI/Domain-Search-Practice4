import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("queries")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setHistory(data);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/whois?query=${searchQuery}`);
    if (response.ok) {
      fetchHistory(); // Refresh history after search
    } else {
      console.error("Error performing WHOIS lookup");
    }
  };

  return (
    <div>
      <h1>WHOIS Query</h1>
      <form onSubmit={handleSearch}>
        <input 
          name="query" 
          type="search" 
          placeholder="Enter domain" 
          required 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <h2>Recent Queries</h2>
      <ul>
        {history.map((item, index) => (
          <li key={index}>
            {item.domain} - {item.registered ? "Registered" : "Not Registered"}
          </li>
        ))}
      </ul>
    </div>
  );
}
