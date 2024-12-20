import { WebSocket } from "k6/experimental/websockets";
import { Trend } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

export const options = {
  vus: __ENV.TOTAL_CLIENT,
  duration: "1m",
};

const url = __ENV.WS_URL;
const payloadData = open("../data/1kb.html");
const duration = 60000; // 1m

const latency = new Trend("latency", true);

export default function () {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    const send = setInterval(() => {
      const start = Date.now();
      ws.send(payloadData);
      ws.onmessage = (_) => {
        latency.add(Date.now() - start);
      };
    }, 10);

    const close = setTimeout(() => {
      clearInterval(send);
      ws.close();
    }, duration);

    ws.onclose = () => {
      clearTimeout(close);
    };
  };
}

export function handleSummary(data) {
  const result = {
    concurrent_users: data.metrics.vus.values.value,
    data_size: "1kb",
    latency_avg: Math.round(data.metrics.latency.values.avg * 100) / 100, // ms
    throughput: Math.round(data.metrics.ws_msgs_received.values.rate),
  };

  return {
    "./scripts/results/concurrent/summary.json": JSON.stringify(result),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
