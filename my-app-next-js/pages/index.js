import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  // 将 fetchHistory 函数定义移到 useEffect 外部
  async function fetchHistory() {
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
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`/api/whois?query=${query}`);
    const data = await response.json();
    setResult(data); // 将结果存储在状态中
    setQuery(""); // 清空查询输入
    await fetchHistory(); // 重新获取历史记录
  };

  return (
    <div>
      <h1>WHOIS Query</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          placeholder="Enter domain"
          required
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

      {result && (
        <div>
          <h2>Query Result</h2>
          {/* 在这里展示查询结果，您可以根据需要调整展示方式 */}
          <p>{JSON.stringify(result, null, 2)}</p>
        </div>
      )}
    </div>
  );
}
