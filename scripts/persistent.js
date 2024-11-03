import { WebSocket } from "k6/experimental/websockets";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

export const options = {
  vus: 100,
  iterations: 100,
};

const url = __ENV.WS_URL;
const data = open(__ENV.DATA_FILE);
const requests = 10_000 / options.vus;

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
      ws.send(data);
      counter++;
    }, 1);
  };
}

export function handleSummary(data) {
  const result = {
    throughput: Math.round(data.metrics.ws_msgs_received.values.rate),
  };

  return {
    "./scripts/results/persistent/summary.json": JSON.stringify(result),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
