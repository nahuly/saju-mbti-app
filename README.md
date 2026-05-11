# MBTI × 사주 — 당신만의 색깔

MBTI와 사주팔자를 함께 풀어 "당신만의 색깔"을 보여주는 인터랙티브 해석 앱.

정적 텍스트(MBTI / 일주 / 시주 해석)는 페이지 로드와 동시에 보이고,
"종합 해석" 섹션만 Claude API로 스트리밍 호출 — 페이지 체감 속도와 "나만을 위한 글" 만족감을 동시에 잡는 하이브리드 구성.

---

## 빠르게 실행하기

### 1. API 키 준비

`.env.local.example`을 복사해서 `.env.local`로 만들고 키를 채워주세요.

```bash
cp .env.local.example .env.local
```

`.env.local`을 열어서 `sk-ant-...` 자리에 본인 Anthropic API 키를 붙여넣으면 끝.
키는 [console.anthropic.com](https://console.anthropic.com) 에서 발급받을 수 있어요.

> 기본 모델은 `claude-haiku-4-5-20251001` (저렴함).
> 더 좋은 품질을 원하면 `.env.local`에서 `ANTHROPIC_MODEL=claude-sonnet-4-6` 으로 바꿔도 돼요.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기.

---

## 폴더 구조

```
app/
  page.tsx               # 입력 폼 (생년월일/시간/MBTI)
  result/page.tsx        # 결과 페이지 (히어로 + 5개 섹션)
  api/synthesize/route.ts # Claude SSE 스트리밍 엔드포인트
  layout.tsx
  globals.css
lib/
  saju.ts                # 사주팔자 계산 (연주/월주/일주/시주)
data/
  mbti.ts                # MBTI 16유형 해석 + 궁합
  ilju.ts                # 60갑자 일주 해석 + 합/충
  siji.ts                # 12지지 시지 해석
```

---

## 사주 계산 정확도 주의

MVP라서 계산을 단순화한 부분이 있어요. 정확도 90% 수준입니다.

| 항목 | 방식 | 한계 |
|------|------|------|
| 연주 | 입춘(2/4) 고정 기준 | 실제 입춘은 ±1일 변동 |
| 월주 | 절입일 평균값 사용 | 절기 경계 ±1일 오차 |
| 일주 | 1900-01-31 갑진일 기준 절대일 환산 | 정확 |
| 시주 | 시두법 + 30분 단위 처리 | 야자시(23~24시) 단순 처리 |

운영 단계로 가려면 절기력(KASI 천문력) 데이터를 lookup 테이블로 넣는 게 정공법.

---

## AI 종합 해석 캐싱

지금은 매번 호출. 사용자 늘면 다음 단계:

1. `lib/saju.ts`에서 `mbti + palja`를 키로 해시
2. SQLite 또는 Vercel KV에 결과 저장
3. 같은 입력 들어오면 캐시 응답

사주팔자 조합 수가 유한해서 캐시 적중률이 시간 지날수록 올라가요.

---

## 배포

가장 간단한 무료 경로: **Vercel**.

```bash
npx vercel
```

CLI 안내에 따라 로그인 → 프로젝트 생성 → `ANTHROPIC_API_KEY` 환경 변수 추가하면 끝.

---

## 카피 다듬을 자리

`data/` 안의 텍스트는 1차 초안이에요. 카피 라운드로 다듬을 자리:

- `data/mbti.ts` — 16유형 각 1000자 (현재 800자 내외)
- `data/ilju.ts` — 60갑자 각 800자 (현재 300자 내외)
- `data/siji.ts` — 12지지 각 400자 (목표 도달)

분량이 많아 보여도 한 항목씩 보강하면 1~2주 안에 마무리 가능한 분량입니다.
