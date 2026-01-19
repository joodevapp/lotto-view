// crawler.js
import { chromium } from 'playwright';
import fs from 'fs';

const ROUND = 1207;
const API = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${ROUND}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  });

  // 🔴 핵심: page.evaluate(fetch) 말고, context.request 사용
  const res = await context.request.get(API, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.dhlottery.co.kr/',
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  const text = await res.text(); // 먼저 text로 받는다
  await browser.close();

  // HTML이면 여기서 바로 걸러낸다
  if (text.trim().startsWith('<')) {
    throw new Error('API가 HTML로 응답(차단). 이 경로는 환경상 불가.');
  }

  const data = JSON.parse(text);
  if (!data || data.returnValue !== 'success') {
    throw new Error('유효한 JSON 아님');
  }

  const out = {
    drwNo: data.drwNo,
    numbers: [
      data.drwtNo1, data.drwtNo2, data.drwtNo3,
      data.drwtNo4, data.drwtNo5, data.drwtNo6
    ],
    bonus: data.bnusNo,
    date: data.drwNoDate,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync('lotto.json', JSON.stringify(out, null, 2));
  console.log('lotto.json 생성 완료');
})();
