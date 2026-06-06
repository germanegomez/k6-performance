import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m',  target: 10  }, // Normal baseline
    { duration: '30s', target: 500 }, // Brutal spike
    { duration: '1m',  target: 500 }, // Hold the spike
    { duration: '30s', target: 10  }, // Back to normal
    { duration: '2m',  target: 10  }, // Recovery check
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.10'],  // Spikes can generate temporary errors
    http_req_duration: ['p(95)<2000'], // Expect fast recovery after the spike
  },
};

export default function () {
  // Ultra-lightweight endpoint — maximises throughput at 500 VUs
  group('GET /status/200', () => {
    const res = http.get('http://prism:8080/status/200');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  // Content endpoint — validates the system still serves real responses under spike
  group('GET /get', () => {
    const res = http.get('http://prism:8080/get');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(0.3);
}
