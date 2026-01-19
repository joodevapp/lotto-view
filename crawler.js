// crawler.js
import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let lottoData = null;

  // 네트워크 응답에서 실제 JSON을 가로챈다
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('getLottoNumber')) {
      try {
        const json = await response.json();
        if (json && json.returnValue === 'success') {
          lottoData = {
            drwNo: json.drwNo,
            numbers: [
              json.drwtNo1,
              json.drwtNo2,
              json.drwtNo3,
              json.drwtNo4,
              json.drwtNo5,
              json.drwtNo6
            ],
            bonus: json.bnusNo,
            date: json.drwNoDate,
            updatedAt: new Date().toISOString()
          };
        }
      } catch (_) {}
    }
  });

  // 페이지 렌더 (JS 실행되도록)
  await page.goto('https://www.dhlottery.co.kr/lt645/result', {
    waitUntil: 'networkidle'
  });

  await browser.close();

  if (!lottoData) {
    throw new Error('당첨 JSON 캡처 실패');
  }

  fs.writeFileSync('lotto.json', JSON.stringify(lottoData, null, 2));
  console.log('lotto.json 갱신 완료');
})();
