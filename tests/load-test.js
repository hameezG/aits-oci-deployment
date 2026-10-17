import http from 'k6/http';
import { sleep } from 'k6';

// Set TARGET_URL to a frontend you own or have permission to test.
const TARGET_URL = __ENV.TARGET_URL;
if (!TARGET_URL || !/^https?:\/\//.test(TARGET_URL)) {
  throw new Error('Set TARGET_URL to a full http(s) URL before running.');
}

export let options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  http.get(TARGET_URL);
  sleep(1);
}
