import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100  },
    { duration: '5m', target: 100  },
    { duration: '2m', target: 200  },
    { duration: '5m', target: 200  },
    { duration: '2m', target: 300  },
    { duration: '5m', target: 300  },
    { duration: '5m', target: 0    }, // Recovery
  ],
  thresholds: {
    http_req_failed:   ['rate<0.10'],          // Up to 10% acceptable errors under stress
    http_req_duration: ['p(95)<5000'],         // 95% below 5s — /delay/1 already adds 1s baseline
  },
};

export default function () {
  const res = http.get('http://httpbin/delay/1'); // Simulates latency under stress
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.5);
}
