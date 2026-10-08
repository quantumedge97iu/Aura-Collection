// Phase 2 HTTP load test. Phase 1 has no API, so this file is not a result.
// Point BASE at the future catalog route and run: k6 run tests/k6-catalog.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 100 },
        { duration: "30s", target: 500 },
        { duration: "30s", target: 1000 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const base = __ENV.BASE || "http://127.0.0.1:3001";

export default function browse() {
  const list = http.get(`${base}/shop`);
  check(list, { "shop page responds": (res) => res.status === 200 });
  sleep(1);
}
