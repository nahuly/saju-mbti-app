// 사주팔자 계산 모듈
// 주의: 정확한 명리학은 절기(節氣) 기반 계산이 필요하나, MVP에선 단순화된 규칙 사용.
// - 연주: 입춘(2/4) 기준
// - 월주: 절입일 대신 양력 월 시작 기준 (오차 ±15일 발생 가능)
// - 일주: 1900-01-31(갑진일) 기준 절대일 환산
// - 시주: 일간에 따른 시두법(時頭法) 적용

export const HEAVENLY_STEMS = [
  "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
] as const;
export const STEMS_KOR = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

export const EARTHLY_BRANCHES = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
] as const;
export const BRANCHES_KOR = [
  "자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해",
];

// 천간 오행
export const STEM_ELEMENT: Record<string, Element> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

// 지지 오행
export const BRANCH_ELEMENT: Record<string, Element> = {
  寅: "wood", 卯: "wood",
  巳: "fire", 午: "fire",
  辰: "earth", 戌: "earth", 丑: "earth", 未: "earth",
  申: "metal", 酉: "metal",
  亥: "water", 子: "water",
};

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export const ELEMENT_KOR: Record<Element, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

export const ELEMENT_HAN: Record<Element, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

// 음양: 천간 인덱스 짝수=양, 홀수=음
export function stemPolarity(stem: string): "yang" | "yin" {
  const i = HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]);
  return i % 2 === 0 ? "yang" : "yin";
}

// 60갑자 인덱스 (0~59) → 천간/지지
export function sexagenaryToStemBranch(idx: number): { stem: string; branch: string } {
  const i = ((idx % 60) + 60) % 60;
  return {
    stem: HEAVENLY_STEMS[i % 10],
    branch: EARTHLY_BRANCHES[i % 12],
  };
}

export interface SajuInput {
  year: number;     // 양력
  month: number;    // 1-12
  day: number;      // 1-31
  hour: number;     // 0-23
  minute: number;   // 0-59
}

export interface Pillar {
  stem: string;
  branch: string;
  stemKor: string;
  branchKor: string;
  stemElement: Element;
  branchElement: Element;
}

export interface SajuResult {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  dayMaster: string;          // 일간 (예: "庚")
  dayMasterKor: string;
  dayMasterElement: Element;
  dayMasterPolarity: "yang" | "yin";
  ilju: string;               // 일주 (예: "庚午")
  iljuKor: string;
  elementCount: Record<Element, number>;
  strongElement: Element;
}

function makePillar(stem: string, branch: string): Pillar {
  return {
    stem,
    branch,
    stemKor: STEMS_KOR[HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number])],
    branchKor:
      BRANCHES_KOR[
        EARTHLY_BRANCHES.indexOf(branch as (typeof EARTHLY_BRANCHES)[number])
      ],
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
  };
}

// 입춘 근사: 매년 2/4 00:00 (실제로는 2/3~5 사이 변동)
function isBeforeIpchun(month: number, day: number): boolean {
  if (month < 2) return true;
  if (month === 2 && day < 4) return true;
  return false;
}

// 연주: 갑자년은 서기 4년. (4년 = 갑자, 5년 = 을축, ...)
function yearPillar(year: number, month: number, day: number): Pillar {
  const adjusted = isBeforeIpchun(month, day) ? year - 1 : year;
  const idx = ((adjusted - 4) % 60 + 60) % 60;
  const { stem, branch } = sexagenaryToStemBranch(idx);
  return makePillar(stem, branch);
}

// 월건표: 연간(年干) → 정월(寅月)의 월간
// (甲己 → 丙, 乙庚 → 戊, 丙辛 → 庚, 丁壬 → 壬, 戊癸 → 甲)
const MONTH_HEAD_STEM: Record<string, number> = {
  甲: 2, 己: 2, // 丙
  乙: 4, 庚: 4, // 戊
  丙: 6, 辛: 6, // 庚
  丁: 8, 壬: 8, // 壬
  戊: 0, 癸: 0, // 甲
};

// 절입일 근사: 각 월의 절기 시작일 (양력 기준, 평균)
const SOLAR_TERM_START_DAY = [
  6,  // 1월 6일 - 소한 (子月 → 丑月로의 경계가 아니라 실은 다른 체계지만 단순화)
  4,  // 2월 4일 - 입춘 (寅月 시작)
  6,  // 3월 6일 - 경칩 (卯月)
  5,  // 4월 5일 - 청명 (辰月)
  6,  // 5월 6일 - 입하 (巳月)
  6,  // 6월 6일 - 망종 (午月)
  7,  // 7월 7일 - 소서 (未月)
  8,  // 8월 8일 - 입추 (申月)
  8,  // 9월 8일 - 백로 (酉月)
  8,  // 10월 8일 - 한로 (戌月)
  7,  // 11월 7일 - 입동 (亥月)
  7,  // 12월 7일 - 대설 (子月)
];

// 양력 월/일 → 명리학상 월지(寅=1월 ... 丑=12월) 인덱스 (0~11, 寅이 0)
function sajuMonthIndex(month: number, day: number): number {
  // 양력 월 m을 명리 월지로 변환
  // m=2 이상이고 절입일 지나면 m-1번째 절기 시작 (寅=0, ...)
  const m = month;
  const termStart = SOLAR_TERM_START_DAY[m - 1];
  let monthIdx: number;
  if (day >= termStart) {
    // 양력 m월에서 m-1번째 명리월
    monthIdx = m - 2;
  } else {
    monthIdx = m - 3;
  }
  return ((monthIdx % 12) + 12) % 12;
}

function monthPillar(yearStem: string, month: number, day: number): Pillar {
  const monthIdx = sajuMonthIndex(month, day);
  const headStem = MONTH_HEAD_STEM[yearStem];
  const stemIdx = (headStem + monthIdx) % 10;
  const branchIdx = (monthIdx + 2) % 12; // 寅이 인덱스 2
  return makePillar(HEAVENLY_STEMS[stemIdx], EARTHLY_BRANCHES[branchIdx]);
}

// 1900-01-31 = 갑진일 (60갑자 인덱스 40)
// Date 객체로 절대일 차이 계산
function dayPillar(year: number, month: number, day: number): Pillar {
  const target = Date.UTC(year, month - 1, day);
  const base = Date.UTC(1900, 0, 31);
  const diffDays = Math.floor((target - base) / 86400000);
  const idx = ((40 + diffDays) % 60 + 60) % 60;
  const { stem, branch } = sexagenaryToStemBranch(idx);
  return makePillar(stem, branch);
}

// 시지 인덱스: 23:00~01:00 = 子(0), 01~03 = 丑(1) ...
function hourBranchIndex(hour: number, minute: number): number {
  const totalMin = hour * 60 + minute;
  // 23:00 이후는 다음 날 子시
  if (totalMin >= 23 * 60) return 0;
  return Math.floor((totalMin + 60) / 120) % 12;
}

// 시두법: 일간에 따라 子시의 천간 결정
// 甲己日: 甲子 / 乙庚: 丙子 / 丙辛: 戊子 / 丁壬: 庚子 / 戊癸: 壬子
const HOUR_HEAD_STEM: Record<string, number> = {
  甲: 0, 己: 0,
  乙: 2, 庚: 2,
  丙: 4, 辛: 4,
  丁: 6, 壬: 6,
  戊: 8, 癸: 8,
};

function hourPillar(dayStem: string, hour: number, minute: number): Pillar {
  const branchIdx = hourBranchIndex(hour, minute);
  const headStem = HOUR_HEAD_STEM[dayStem];
  const stemIdx = (headStem + branchIdx) % 10;
  return makePillar(HEAVENLY_STEMS[stemIdx], EARTHLY_BRANCHES[branchIdx]);
}

export function computeSaju(input: SajuInput): SajuResult {
  const { year, month, day, hour, minute } = input;

  // 일주 계산은 23시 이후엔 다음날로 넘어감 (子시 야자시 처리는 단순화)
  let dayPillarObj = dayPillar(year, month, day);

  const yearP = yearPillar(year, month, day);
  const monthP = monthPillar(yearP.stem, month, day);
  const hourP = hourPillar(dayPillarObj.stem, hour, minute);

  // 오행 카운트 (천간 4 + 지지 4 = 8글자)
  const elementCount: Record<Element, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  for (const p of [yearP, monthP, dayPillarObj, hourP]) {
    elementCount[p.stemElement]++;
    elementCount[p.branchElement]++;
  }

  // 강한 오행 (최다)
  const strongElement = (Object.keys(elementCount) as Element[]).reduce(
    (max, k) => (elementCount[k] > elementCount[max] ? k : max),
    "wood" as Element
  );

  return {
    year: yearP,
    month: monthP,
    day: dayPillarObj,
    hour: hourP,
    dayMaster: dayPillarObj.stem,
    dayMasterKor: dayPillarObj.stemKor,
    dayMasterElement: dayPillarObj.stemElement,
    dayMasterPolarity: stemPolarity(dayPillarObj.stem),
    ilju: dayPillarObj.stem + dayPillarObj.branch,
    iljuKor: dayPillarObj.stemKor + dayPillarObj.branchKor,
    elementCount,
    strongElement,
  };
}
