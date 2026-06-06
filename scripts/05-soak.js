import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m',  target: 50 }, // Warm up
    { duration: '2h',  target: 50 }, // Soak — 2 hours of sustained load
    { duration: '5m',  target: 0  }, // Cool down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],                 // Sustained load must not generate errors
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],  // /delay/1 adds 1s baseline; detects gradual degradation
  },
};

export default function () {
  // Delayed read — 1s floor makes gradual latency creep visible in Grafana over time
  group('GET /delay/1', () => {
    const res = http.get('http://prism:8080/delay/1');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  // Write operation — detects memory leaks and connection pool exhaustion on POST paths
  group('POST /post', () => {
    const payload = JSON.stringify({ userId: 1, test: 'soak' });
    const params  = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post('http://prism:8080/post', payload, params);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(0.5);
}
