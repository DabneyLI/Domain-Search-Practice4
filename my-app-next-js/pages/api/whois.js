import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
    const { query } = req.query;
    const [name, suffix] = query.split('.');

    try {
        // Compare search input with each existing item of domain column in Supabase table
        let { data: records, error } = await supabase
            .from('queries')
            .select('*')
            .eq('domain', query);

        if (error) {
            console.error('Error fetching from Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        // Check if any record matches and is within the last 24 hours
        const recentRecord = records.find(record => 
            new Date() - new Date(record.timestamp) < 86400000 // 24 hours in milliseconds
        );

        if (recentRecord) {
            // Update the timestamp of the recent record
            const updatedTimestamp = new Date().toISOString();
            const { error: updateError } = await supabase
                .from('queries')
                .update({ timestamp: updatedTimestamp })
                .match({ id: recentRecord.id }); // Assuming the table has an 'id' column

            if (updateError) {
                console.error('Error updating timestamp in Supabase:', updateError);
                throw updateError;
            }

            // Return domain and its registered status, with updated timestamp
            return res.status(200).json({ 
                domain: query, 
                isRegistered: recentRecord.registered,
                updatedTimestamp
            });
        } else {
            // Perform a WHOIS lookup and log data into Supabase
            const apiUrl = `https://whois.freeaiapi.xyz/?name=${name}&suffix=${suffix}`;
            const response = await fetch(apiUrl);
        
            if (!response.ok) {
                throw new Error(`Failed to fetch WHOIS data: ${response.statusText}`);
            }
        
            const whoisData = await response.json();
            // Check if the status information was successfully retrieved
            const statusOk = whoisData.status === "ok";

            // Log the new data into Supabase
            const newRecord = {
                domain: whoisData.domain, // domain name
                registered: whoisData.available === false, // registration status
                creationDate: whoisData.creation_datetime, // domain creation date
                expiryDate: whoisData.expiry_datetime, // domain expiry date
                registrarName: whoisData.info.match(/Registrar: (.+)/)[1], // registrar name
                whoisServer: whoisData.info.match(/WHOIS Server: (.+)/)[1], // WHOIS server
                updatedDate: whoisData.info.match(/Updated Date: (.+)/)[1], // last updated date
                registrarContactEmail: whoisData.info.match(/Registrar Abuse Contact Email: (.+)/)[1], // registrar contact email
                registrarContactPhone: whoisData.info.match(/Registrar Abuse Contact Phone: (.+)/)[1], // registrar contact phone
                nameServers: whoisData.info.match(/Name Server: (.+)/g), // array of name servers
                domainStatus: whoisData.info.match(/Domain Status: (.+)/)[1], // domain status
                timestamp: new Date().toISOString(), // current timestamp
              };

            const { error: insertError } = await supabase.from('queries').insert([newRecord]);

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
