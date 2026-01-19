// crawler.js
import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 페이지는 그냥 한 번 열어주기만 하면 됨 (쿠키/컨텍스트 확보용)
  await page.goto('https://www.dhlottery.co.kr/lt645/result', {
    waitUntil: 'domcontentloaded'
  });

  // 🔥 브라우저 컨텍스트에서 API를 직접 호출
  const lottoData = await page.evaluate(async () => {
    const res = await fetch(
      'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=1207',
      {
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      }
    );
    return await res.json();
  });

  await browser.close();

  if (!lottoData || lottoData.returnValue !== 'success') {
    throw new Error('당첨 JSON 가져오기 실패');
  }

  const result = {
    drwNo: lottoData.drwNo,
    numbers: [
      lottoData.drwtNo1,
      lottoData.drwtNo2,
      lottoData.drwtNo3,
      lottoData.drwtNo4,
      lottoData.drwtNo5,
      lottoData.drwtNo6
    ],
    bonus: lottoData.bnusNo,
    date: lottoData.drwNoDate,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync('lotto.json', JSON.stringify(result, null, 2));
  console.log('lotto.json 생성/갱신 완료');
})();
