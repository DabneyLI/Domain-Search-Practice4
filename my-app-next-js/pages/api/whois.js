import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
    const { query } = req.query;
    const [name, suffix] = query.split('.');

    try {
        // Step 1: Compare search input with each existing item of domain column in Supabase table
        let { data: records, error } = await supabase
            .from('queries')
            .select('*')
            .eq('domain', query);

        if (error) {
            console.error('Error fetching from Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        // Step 2: Check if any record matches and is within the last 24 hours
        const recentRecord = records.find(record => 
            new Date() - new Date(record.timestamp) < 86400000 // 24 hours in milliseconds
        );

        if (recentRecord) {
            // Step 3: Return domain and registered status, no new record in Supabase
            return res.status(200).json({ domain: query, isRegistered: recentRecord.registered });
        } else {
            // Step 4: Perform a WHOIS lookup and log data into Supabase
            const apiUrl = `https://whois.freeaiapi.xyz/?name=${name}&suffix=${suffix}`;
            const response = await fetch(apiUrl);
        
            if (!response.ok) {
                throw new Error(`Failed to fetch WHOIS data: ${response.statusText}`);
            }
        
            const whoisData = await response.json();
            const isRegistered = whoisData.status !== 'available';

            // Log the new data into Supabase
            const { error: insertError } = await supabase.from('queries').insert([
                { domain: query, registered: isRegistered, timestamp: new Date().toISOString() }
            ]);

            if (insertError) {
                console.error('Error saving to Supabase:', insertError);
                throw insertError;
            }

            // Return the WHOIS full response
            res.status(200).json({ domain: query, whoisData, isRegistered });
        }
    } catch (error) {
        console.error('API route error:', error);
        res.status(500).json({ error: error.message });
    }
}
