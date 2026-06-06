import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],  // < 1% errors
    http_req_duration: ['p(95)<500'],  // 95% below 500ms
  },
};

export default function () {
  group('GET /get', () => {
    const res = http.get('http://prism:8080/get');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  group('GET /headers', () => {
    const res = http.get('http://prism:8080/headers');
    check(res, { 'status is 200': (r) => r.status === 200 });
  });

  sleep(1);
}
