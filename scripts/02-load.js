import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0  },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  },
};

export default function () {
  group('GET /get', () => {
    const res = http.get('http://prism:8080/get');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('POST /post', () => {
    const payload = JSON.stringify({ userId: 1, action: 'load-test' });
    const params  = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post('http://prism:8080/post', payload, params);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('GET /anything', () => {
    const res = http.get('http://prism:8080/anything');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(1);
}
