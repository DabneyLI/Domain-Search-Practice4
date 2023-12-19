import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Fetch the last 20 search results from the 'queries' table, ordered by the timestamp in descending order
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      // Send the data back as JSON
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    // Handle any requests that aren't GET
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
