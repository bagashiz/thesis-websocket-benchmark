import { WebSocket } from "k6/experimental/websockets";
import { Trend } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

export const options = {
  vus: 100,
  iterations: 100,
};

const url = __ENV.WS_URL;
const data = open(__ENV.DATA_FILE);
const requests = 10_000 / options.vus;

const latency = new Trend("latency", true);

export default function () {
  const ws = new WebSocket(url);
  let counter = 0;

  ws.onopen = () => {
    const send = setInterval(() => {
      if (counter >= requests) {
        clearInterval(send);
        ws.close();
        return;
      }
      const start = Date.now();
      ws.send(data);
      ws.onmessage = (_) => {
        latency.add(Date.now() - start);
      };
      counter++;
    }, 0);

    ws.onclose = () => {
      clearTimeout(send);
    };
  };
}

export function handleSummary(data) {
  const result = {
    latency_avg: Math.round(data.metrics.latency.values.avg * 100) / 100, // ms
  };

  return {
    "./scripts/results/dataflow/summary.json": JSON.stringify(result),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
