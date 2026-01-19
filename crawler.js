import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const URL = 'https://www.dhlottery.co.kr/common.do?method=main';

async function crawl() {
  // 1. 페이지 요청
  const res = await axios.get(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const $ = cheerio.load(res.data);

  let latestSlide = null;
  let latestRound = null;

  // 2. 모든 슬라이드 순회
  $('.swiper-slide').each((_, slide) => {
    const balls = $(slide).find('.result-ball');

    // 당첨번호 6 + 보너스 1 = 총 7개 있는 슬라이드만 유효
    if (balls.length === 7) {
      latestSlide = slide;

      const roundText = $(slide).find('.result-txt span').text().trim();
      const round = Number(roundText);

      if (!Number.isNaN(round)) {
        latestRound = round;
      }
    }
  });

  // 3. 아직 결과가 하나도 없는 경우
  if (!latestSlide || !latestRound) {
    console.log('아직 결과 미발표');
    return;
  }

  // 4. 번호 추출
  const ballTexts = $(latestSlide)
    .find('.result-ball')
    .map((_, el) => $(el).text().trim())
    .get();

  if (ballTexts.length !== 7) {
    console.log('결과 파싱 실패');
    return;
  }

  const numbers = ballTexts.slice(0, 6).map(Number);
  const bonus = Number(ballTexts[6]);

  // 5. 결과 JSON 생성
  const result = {
    latestRound,
    numbers,
    bonus,
    updatedAt: new Date().toISOString()
  };

  // 6. 중복 업데이트 방지
  if (fs.existsSync('lotto.json')) {
    const prev = JSON.parse(fs.readFileSync('lotto.json', 'utf8'));
    if (prev.latestRound === result.latestRound) {
      console.log('이미 최신 회차');
      return;
    }
  }

  // 7. 파일 저장
  fs.writeFileSync('lotto.json', JSON.stringify(result, null, 2));
  console.log('lotto.json 업데이트 완료');
}

// 실행
crawl().catch(err => {
  console.error('크롤링 오류:', err);
  process.exit(1);
});
