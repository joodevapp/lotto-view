import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const URL = 'https://www.dhlottery.co.kr/common.do?method=main';

async function crawl() {
  const res = await axios.get(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const $ = cheerio.load(res.data);

  const balls = $('.swiper-slide-active .result-ball')
    .map((_, el) => $(el).text().trim())
    .get();

  if (balls.length < 7) {
    console.log('아직 결과 미발표');
    return;
  }

  const numbers = balls.slice(0, 6).map(Number);
  const bonus = Number(balls[6]);

  const roundText = $('.swiper-slide-active .result-txt span').text();
  const round = Number(roundText);

  const result = {
    latestRound: round,
    numbers,
    bonus,
    updatedAt: new Date().toISOString()
  };

  let prev = null;
  if (fs.existsSync('lotto.json')) {
    prev = JSON.parse(fs.readFileSync('lotto.json', 'utf8'));
  }

  if (prev && prev.latestRound === result.latestRound) {
    console.log('이미 최신 회차');
    return;
  }

  fs.writeFileSync('lotto.json', JSON.stringify(result, null, 2));
  console.log('lotto.json 업데이트 완료');
}

crawl();
