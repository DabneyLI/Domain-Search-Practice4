// pages/api/whois.js
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  const { domain } = req.query;

  // Perform validation on the domain, if needed
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    // Fetch the record from the Supabase database
    const { data: existingRecords, error: fetchError } = await supabase
      .from('queries')
      .select('*')
      .eq('domain', domain)
      .single();

    if (fetchError && fetchError.message !== 'No rows found') {
      throw fetchError;
    }

    const record = existingRecords;
    const currentTime = new Date().toISOString();

    if (record && new Date() - new Date(record.created_at) < 86400000) {
      // Record is less than 24 hours old. Update the timestamp.
      const { error: updateError } = await supabase
        .from('queries')
        .update({ updated_at: currentTime })
        .eq('id', record.id);

      if (updateError) {
        throw updateError;
      }

      return res.status(200).json({ message: 'Record timestamp updated', domain });
    } else {
      // No record or record is more than 24 hours old. Perform a new WHOIS lookup and insert a new record.

      // Dummy WHOIS lookup result - replace this with your actual WHOIS lookup logic
      const whoisResult = {
        status: 'available' // or 'registered', based on your WHOIS lookup
      };

      const { error: insertError } = await supabase
        .from('queries')
        .insert([
          {
            domain,
            registered: whoisResult.status === 'registered',
            created_at: currentTime,
            updated_at: currentTime
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      return res.status(200).json({ message: 'New record created', domain, whoisResult });
    }
  } catch (error) {
    console.error('Error in WHOIS API:', error);
    res.status(500).json({ error: error.message });
  }
}
