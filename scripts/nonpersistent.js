import { WebSocket } from "k6/experimental/websockets";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

export const options = {
  vus: 100,
  iterations: 10_000,
};

const url = __ENV.WS_URL;
const payloadData = open("../data/1kb.html");

export default function () {
  const ws = new WebSocket(url);
  ws.onopen = () => {
    ws.send(payloadData);
  };
  ws.onmessage = (_) => {
    ws.close();
  };
}

export function handleSummary(data) {
  const result = {
    concurrent_users: data.metrics.vus.values.value,
    data_size: "1kb",
    throughput: Math.round(data.metrics.ws_msgs_received.values.rate),
  };

  return {
    "./scripts/results/nonpersistent/summary.json": JSON.stringify(result),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
