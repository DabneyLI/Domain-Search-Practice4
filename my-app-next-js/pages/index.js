import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Home() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        async function fetchHistory() {
            const { data, error } = await supabase
                .from('queries')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching history:', error);
            } else {
                setHistory(data);
            }
        }

        fetchHistory();
    }, []);

    return (
        <div>
            <h1>WHOIS Query</h1>
            <form action="/api/whois" method="get" target="_blank">
                <input name="query" type="search" placeholder="Enter domain" required />
                <button type="submit">Search</button>
            </form>

            <h2>Recent Queries</h2>
            <ul>
                {history.map((item, index) => (
                    <li key={index}>
                        {item.domain} - {item.registered ? 'Registered' : 'Not Registered'}
                    </li>
                ))}
            </ul>
        </div>
    );
}
