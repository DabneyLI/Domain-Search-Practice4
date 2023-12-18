import { supabase } from "../../utils/supabaseClient";

async function queryDomain(name, suffix) {
  const domain = `${name}.${suffix}`;
  const { data: domainData, error } = await supabase
    .from("queries")
    .select("*")
    .eq("domain", domain)
    .single();

  if (
    domainData &&
    new Date() - new Date(domainData.timestamp) < 24 * 60 * 60 * 1000
  ) {
    // 如果24小时内已查询过
    return domainData;
  }

  // 调用 whois API
  const response = await fetch(
    `https://whois.freeaiapi.xyz/?name=${name}&suffix=${suffix}`,
  );
  const whoisData = await response.json();

  // 更新或插入新记录到Supabase
  const { data, error: updateError } = await supabase.from("queries").upsert({
    domain,
    timestamp: new Date(),
    registered: whoisData.registered,
  });

  if (updateError) {
    console.error("Error updating or inserting the domain data:", updateError);
  }

  return whoisData;
}

export default queryDomain;
