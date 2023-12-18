import React, { useEffect, useState } from "react";
import queryDomain from "./api/whois";
import { supabase } from "../utils/supabaseClient";

const DomainChecker = () => {
  const [domain, setDomain] = useState("");
  const [recentDomains, setRecentDomains] = useState([]);

  useEffect(() => {
    getRecentDomains().then(setRecentDomains);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const [name, suffix] = domain.split(".");
    const whoisData = await queryDomain(name, suffix);
    window.open(
      `data:text/json,${encodeURIComponent(JSON.stringify(whoisData))}`,
      "_blank",
    );
  };

  async function getRecentDomains() {
    let { data: domains, error } = await supabase
      .from("queries")
      .select("domain, registered")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching recent domains:", error);
      return [];
    }

    return domains.filter((d) => d.registered); // 只返回已注册的域名
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="请输入域名"
        />
        <button type="submit">查询</button>
      </form>
      <div>
        最近查询的域名:
        {recentDomains.map((d, i) => (
          <div key={i}>
            {d.domain} - {d.registered ? "已注册" : "未注册"}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DomainChecker;
