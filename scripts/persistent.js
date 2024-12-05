import { WebSocket } from "k6/experimental/websockets";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

export const options = {
  vus: 50,
  iterations: 50,
};

const url = __ENV.WS_URL;
const payloadData = open("../data/1kb.html");
const requests = 10000 / options.vus;

export default function () {
  const ws = new WebSocket(url);
  let counter = 0;

  ws.onopen = () => {
    const send = setInterval(() => {
      ws.send(payloadData);
    }, 10);

    ws.onmessage = (_) => {
      counter++;
      if (counter == requests) {
        clearInterval(send);
        ws.close();
      }
    };
  };
}

export function handleSummary(data) {
  const result = {
    concurrent_users: data.metrics.vus.values.value,
    data_size: "1kb",
    throughput: Math.round(data.metrics.ws_msgs_received.values.rate),
  };

  return {
    "./scripts/results/persistent/summary.json": JSON.stringify(result),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
