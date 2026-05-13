import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m',  target: 50 }, // Warm up
    { duration: '2h',  target: 50 }, // Soak — 2 hours of sustained load
    { duration: '5m',  target: 0  }, // Cool down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],                    // Sustained load must not generate errors
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],     // /delay/1 adds 1s baseline; detects gradual degradation
  },
};

export default function () {
  const res = http.get('http://httpbin:8080/delay/1'); // Sustained latency helps surface memory leaks
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.5);
}
