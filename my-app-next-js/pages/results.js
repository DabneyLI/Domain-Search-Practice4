// pages/results.js
import { useRouter } from "next/router";
import NodeCache from "node-cache";

// 设置缓存存活时间为24小时（24h x 60min x 60s）
const cache = new NodeCache({ stdTTL: 24 * 60 * 60 });

export default function Results({ data }) {
  const router = useRouter();
  const { query } = router.query;

  const resultItems =
    data &&
    Object.entries(data).map(([key, value]) => (
      <li key={key}>
        {key}: {value.toString()}
      </li>
    ));

  return (
    <div>
      <h1>Results for: {query}</h1>
      {data && <ul>{resultItems}</ul>}
      {!data && <p>No results found for the query.</p>}
    </div>
  );
}

// 此函数在服务器端运行，并预先获取页面所需的数据
export async function getServerSideProps(context) {
  const { query } = context.query;

  // 检查缓存中是否有数据
  const cachedData = cache.get(query);
  if (cachedData) {
    console.log("Returning cached data for:", query);
    return { props: { data: cachedData } };
  }

  // 执行 WHOIS 查询
  const apiUrl = `https://whois.freeaiapi.xyz/?name=${query}&suffix=com`;
  const res = await fetch(apiUrl);
  const data = await res.json();

  // 将新查询的数据添加到缓存
  cache.set(query, data);

  return { props: { data } };
}
