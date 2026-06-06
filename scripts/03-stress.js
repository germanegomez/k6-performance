import http from 'k6/http';
import { check, group, sleep } from 'k6';

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
    http_req_failed:   ['rate<0.10'],   // Up to 10% acceptable errors under stress
    http_req_duration: ['p(95)<5000'],  // 95% below 5s — /delay/1 adds 1s baseline
  },
};

export default function () {
  // Fast endpoint — measures raw throughput ceiling under stress
  group('GET /get', () => {
    const res = http.get('http://prism:8080/get');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  // Slow endpoint — reveals resource exhaustion (threads, connections) at high concurrency
  group('GET /delay/1', () => {
    const res = http.get('http://prism:8080/delay/1');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(0.5);
}
