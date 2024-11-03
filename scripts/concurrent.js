import { WebSocket } from "k6/experimental/websockets";
import { Trend } from "k6/metrics";

export const options = {
  vus: __ENV.TOTAL_CLIENT,
  duration: "1m",
};

const url = __ENV.WS_URL;
const data = open(__ENV.DATA_FILE);
const duration = 60000; // 60s

const latency = new Trend("latency", true);

export default function () {
  const ws = new WebSocket(url);
  let start;

  ws.onopen = () => {
    const send = setInterval(() => {
      start = Date.now();
      ws.send(data);
    }, 1);

    ws.onmessage = (_) => {
      latency.add(Date.now() - start);
    };

    const close = setTimeout(() => {
      clearInterval(send);
      ws.close();
    }, duration);

    ws.onclose = () => {
      clearTimeout(close);
    };
  };
}
