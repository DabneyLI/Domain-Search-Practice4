import { supabase } from "../../utils/supabaseClient";

export default async function handler(req, res) {
  const { query } = req.query;
  const [name, suffix] = query.split(".");

  try {
    // 检查最近24小时内是否有查询记录
    let { data: cachedData, error: cachedError } = await supabase
      .from("queries")
      .select("*")
      .eq("domain", query)
      .gte(
        "timestamp",
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
      ) // 最近24小时
      .limit(1); // 只获取最近的一条记录

    if (cachedError) {
      console.error("Error fetching from cache:", cachedError);
      return res.status(500).json({ error: cachedError.message });
    }

    // 如果缓存中有记录，并且域名已注册，则直接返回缓存的数据
    if (cachedData && cachedData.length > 0 && cachedData[0].registered) {
      return res.status(200).json({ domain: query, isRegistered: true });
    }

    // 如果没有缓存记录或域名未注册，则调用 WHOIS 接口
    const apiUrl = `https://whois.freeaiapi.xyz/?name=${name}&suffix=${suffix}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch WHOIS data: ${response.statusText}`);
    }
    const data = await response.json();

    // 根据 WHOIS 接口的响应，确定域名是否已注册
    const isRegistered = data.status !== "available";

    // 保存新的查询结果到 Supabase
    if (!cachedData || cachedData.length === 0) {
      const { error } = await supabase
        .from("queries")
        .insert([{ domain: query, registered: isRegistered }]);

      if (error) {
        console.error("Error saving to Supabase:", error);
        throw error;
      }
    }

    // 返回 WHOIS 查询结果
    res.status(200).json({ domain: query, isRegistered });
  } catch (error) {
    console.error("API route error:", error);
    res.status(500).json({ error: error.message });
  }
}
