import { supabase } from "../../utils/supabaseClient";

export default async function handler(req, res) {
  const { query } = req.query;
  // Check if query is not null and contains a period
  if (!query || !query.includes(".")) {
    return res.status(400).json({ error: "Invalid domain format" });
  }
  const [name, suffix] = query.split(".");

  try {
    let { data: records, error } = await supabase
      .from("queries")
      .select("*")
      .eq("domain", query);

    if (error) {
      console.error("Error fetching from Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    const recentRecord = records.find(
      (record) => new Date() - new Date(record.timestamp) < 86400000, // 24 hours in milliseconds
    );

    if (recentRecord) {
      const updatedTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("queries")
        .update({ timestamp: updatedTimestamp })
        .match({ id: recentRecord.id });

      if (updateError) {
        console.error("Error updating timestamp in Supabase:", updateError);
        throw updateError;
      }

      return res.status(200).json(recentRecord);
    } else {
      const apiUrl = `https://whois.freeaiapi.xyz/?name=${name}&suffix=${suffix}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        // If the WHOIS API fails to fetch the data, do not save to database and return an error message
        return res
          .status(200)
          .json({ error: "Error for domain search, not supported." });
      }

      const whoisData = await response.json();

      // Check if the status information was successfully retrieved and domain is supported
      if (whoisData.status !== "ok") {
        // If the domain is not supported or another error occurred, do not save to database
        return res
          .status(200)
          .json({ error: "Error for domain search, not supported." });
      }

      // Extract the required details from whoisData
      let newRecord;
      // Check if the domain is registered
      if (!whoisData.available) {
        newRecord = {
          domain: whoisData.domain, // domain name
          registered: whoisData.available === false, // registration status
          creationDate: whoisData.creation_datetime, // domain creation date
          expiryDate: whoisData.expiry_datetime, // domain expiry date

          timestamp: new Date().toISOString(), // current timestamp
        };
      } else {
        newRecord = {
          domain: whoisData.domain, // domain name
          registered: whoisData.available === false, // registration status
          timestamp: new Date().toISOString(), // current timestamp
        };
      }

      const { error: insertError } = await supabase
        .from("queries")
        .insert([newRecord]);

      if (insertError) {
        console.error("Error saving to Supabase:", insertError);
        return res.status(500).json({ error: insertError.message });
      }

      res.status(200).json(newRecord);
    }
  } catch (error) {
    console.error("API route error:", error);
    res.status(500).json({ error: error.message });
  }
}
