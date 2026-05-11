// 오행별 처방 데이터 + 직업 매칭
// 약한 오행을 보완하거나 강한 오행을 활용하는 일상적 처방.

import type { Element } from "../lib/saju";

export interface ElementProfile {
  name: string;          // 목/화/토/금/수
  symbol: string;        // 木 火 土 金 水
  emoji: string;         // 시각적 hint (이모지가 아니라 한자 사용)
  keyword: string;       // 핵심 키워드
  careers: string[];     // 오행과 잘 어울리는 직업군
  colors: string[];      // 어울리는 색
  direction: string;     // 방향
  foods: string[];       // 음식
  numbers: number[];     // 행운 숫자
  gems: string[];        // 보석/광물
  body: string[];        // 몸의 어느 부분
  vibes: string;         // 한 줄 분위기
}

export const ELEMENTS: Record<Element, ElementProfile> = {
  wood: {
    name: "목",
    symbol: "木",
    emoji: "🌲",
    keyword: "뻗어나가는 나무",
    careers: ["교육자", "기획자", "출판·콘텐츠", "환경·생태 분야", "한의사", "스타트업 파운더"],
    colors: ["청록", "초록", "민트"],
    direction: "동쪽",
    foods: ["시금치", "신맛 과일(매실·자두)", "녹차", "오이", "참나물"],
    numbers: [3, 8],
    gems: ["에메랄드", "옥", "말라카이트"],
    body: ["간", "담", "근육"],
    vibes: "위로 뻗어가는 성장과 시작의 기운",
  },
  fire: {
    name: "화",
    symbol: "火",
    emoji: "🔥",
    keyword: "타오르는 불꽃",
    careers: ["연예인·방송인", "강사·연사", "마케터", "이벤트 플래너", "셰프", "통역·언어 전문가"],
    colors: ["빨강", "주황", "핑크"],
    direction: "남쪽",
    foods: ["쓴맛 채소(쑥갓·근대)", "커피", "다크 초콜릿", "고추", "도라지"],
    numbers: [2, 7],
    gems: ["루비", "가넷", "산호"],
    body: ["심장", "혈관", "혀"],
    vibes: "사람을 끌어당기는 표현과 정열의 기운",
  },
  earth: {
    name: "토",
    symbol: "土",
    emoji: "⛰️",
    keyword: "넓고 깊은 대지",
    careers: ["부동산", "건축·토목", "금융·자산 관리", "농업·식품", "공무원", "회계사"],
    colors: ["황색", "베이지", "브라운"],
    direction: "중앙",
    foods: ["단맛 곡물(쌀·고구마)", "꿀", "대추", "호박", "감"],
    numbers: [5, 10],
    gems: ["호박(琥珀)", "타이거 아이", "황수정"],
    body: ["비장", "위장", "입"],
    vibes: "안정과 신뢰, 사람을 품는 그릇의 기운",
  },
  metal: {
    name: "금",
    symbol: "金",
    emoji: "⚔️",
    keyword: "벼린 쇠",
    careers: ["변호사", "외과 의사", "엔지니어", "금융 트레이더", "군인·경찰", "보석·주얼리 디자이너"],
    colors: ["흰색", "은색", "골드"],
    direction: "서쪽",
    foods: ["매운맛(생강·마늘·양파)", "흰살 생선", "도라지", "배", "무"],
    numbers: [4, 9],
    gems: ["다이아몬드", "백수정", "은"],
    body: ["폐", "대장", "피부"],
    vibes: "예리함과 정의, 자기 원칙의 기운",
  },
  water: {
    name: "수",
    symbol: "水",
    emoji: "🌊",
    keyword: "흐르는 큰 물",
    careers: ["연구자·학자", "작가", "철학자", "심리상담사", "해운·무역", "IT 개발자"],
    colors: ["검정", "남색", "딥블루"],
    direction: "북쪽",
    foods: ["짠맛 해산물(해조·조개)", "검정콩", "흑임자", "베리류", "굴"],
    numbers: [1, 6],
    gems: ["흑요석", "사파이어", "진주"],
    body: ["신장", "방광", "귀"],
    vibes: "지혜와 흐름, 깊이 들어가는 사유의 기운",
  },
};

// 오행 상생 관계 (생해주는 오행)
// 목생화 / 화생토 / 토생금 / 금생수 / 수생목
export const ELEMENT_GENERATES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

// 약한 오행 = elementCount 최소값. (0개면 보완 강조)
export function findWeakestElement(
  count: Record<Element, number>
): Element {
  const keys: Element[] = ["wood", "fire", "earth", "metal", "water"];
  return keys.reduce((min, k) => (count[k] < count[min] ? k : min), keys[0]);
}

// MBTI 직업 적성과 오행 직업군의 교집합 추천 (없으면 둘 다 보여줌)
export function recommendCareers(mbtiCareers: string[], elementCareers: string[]): {
  combined: string[];
  fromMbti: string[];
  fromElement: string[];
} {
  // MBTI 직업 5~6개 + 오행 직업 6개 중 중복 없이 섞어서 최대 8개
  const set = new Set<string>();
  for (const c of mbtiCareers) set.add(c);
  for (const c of elementCareers) set.add(c);
  return {
    combined: Array.from(set).slice(0, 8),
    fromMbti: mbtiCareers,
    fromElement: elementCareers,
  };
}
