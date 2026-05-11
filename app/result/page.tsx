"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  computeSaju,
  ELEMENT_KOR,
  ELEMENT_HAN,
  type Element,
  type Pillar,
  type SajuResult,
} from "../../lib/saju";
import { MBTI, MBTI_COMPAT } from "../../data/mbti";
import { MBTI_EXTRA } from "../../data/mbti-extra";
import { ILJU, getIljuCompat } from "../../data/ilju";
import { SIJI } from "../../data/siji";
import { ELEMENTS, findWeakestElement, recommendCareers } from "../../data/elements";

function elemClass(e: Element) {
  return `elem-${e}`;
}

function PaljaCell({ pos, pillar }: { pos: string; pillar: Pillar }) {
  return (
    <div className="palja-cell">
      <div className="palja-pos">{pos}</div>
      <div className={`palja-char ${elemClass(pillar.stemElement)}`}>
        {pillar.stem}
      </div>
      <div className="palja-han">{pillar.stemKor}</div>
      <div style={{ height: 8 }} />
      <div className={`palja-char ${elemClass(pillar.branchElement)}`}>
        {pillar.branch}
      </div>
      <div className="palja-han">{pillar.branchKor}</div>
    </div>
  );
}

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();

  const input = useMemo(() => {
    const y = parseInt(params.get("y") || "");
    const m = parseInt(params.get("m") || "");
    const d = parseInt(params.get("d") || "");
    const h = parseInt(params.get("h") || "");
    const min = parseInt(params.get("min") || "0");
    const mbti = (params.get("mbti") || "").toUpperCase();
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(h) || !mbti) {
      return null;
    }
    return { year: y, month: m, day: d, hour: h, minute: min, mbti };
  }, [params]);

  const saju: SajuResult | null = useMemo(() => {
    if (!input) return null;
    return computeSaju(input);
  }, [input]);

  const [aiText, setAiText] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiError, setAiError] = useState("");
  const startedRef = useRef(false);

  async function callAI() {
    if (!saju || !input) return;
    setAiText("");
    setAiError("");
    setAiStreaming(true);
    try {
      const iljuKey = saju.ilju;
      const iljuData = ILJU[iljuKey];
      const palja = `${saju.year.stem}${saju.year.branch} ${saju.month.stem}${saju.month.branch} ${saju.day.stem}${saju.day.branch} ${saju.hour.stem}${saju.hour.branch}`;
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mbti: input.mbti,
          palja,
          dayMaster: saju.dayMasterKor,
          dayMasterElement: ELEMENT_KOR[saju.dayMasterElement],
          strongElement: ELEMENT_KOR[saju.strongElement],
          iljuKor: saju.iljuKor,
          iljuKeywords: iljuData?.keywords || [],
        }),
      });

      if (!res.ok || !res.body) {
        const t = await res.text();
        throw new Error(t || "AI 호출 실패");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const parsed = JSON.parse(json);
            if (parsed.text) setAiText((p) => p + parsed.text);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.done) {
              setAiStreaming(false);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI 호출 실패");
    } finally {
      setAiStreaming(false);
    }
  }

  useEffect(() => {
    if (saju && input && !startedRef.current) {
      startedRef.current = true;
      callAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saju, input]);

  async function shareImage() {
    if (typeof window === "undefined") return;
    const html2canvas = (await import("html2canvas")).default;
    const node = document.getElementById("share-area");
    if (!node) return;
    const canvas = await html2canvas(node, {
      backgroundColor: "#0d0b14",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `mbti-saju-${input?.mbti}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (!input || !saju) {
    return (
      <div className="container">
        <p className="error">잘못된 접근입니다. 입력 페이지로 돌아가주세요.</p>
        <button className="btn-secondary" onClick={() => router.push("/")}>
          돌아가기
        </button>
      </div>
    );
  }

  const mbtiData = MBTI[input.mbti];
  const mbtiExtra = MBTI_EXTRA[input.mbti];
  const iljuData = ILJU[saju.ilju];
  const sijiData = SIJI[saju.hour.branch];
  const mbtiCompat = MBTI_COMPAT[input.mbti];
  const iljuCompat = getIljuCompat(saju.ilju);
  const dayElement = ELEMENTS[saju.dayMasterElement];
  const strongElement = ELEMENTS[saju.strongElement];
  const weakest = findWeakestElement(saju.elementCount);
  const weakElement = ELEMENTS[weakest];
  const careers = recommendCareers(mbtiExtra?.careers || [], dayElement?.careers || []);

  return (
    <div className="container">
      <div id="share-area">
        <div className="hero">
          <div className="hero-type">
            {input.mbti} · {saju.iljuKor}{saju.iljuKor === iljuData?.kor ? "" : ""} 일주
          </div>
          <div className="hero-name">
            {mbtiData?.name || input.mbti} × {iljuData?.keywords[0] || saju.iljuKor}
          </div>
          <div className="palja-grid">
            <PaljaCell pos="연주" pillar={saju.year} />
            <PaljaCell pos="월주" pillar={saju.month} />
            <PaljaCell pos="일주" pillar={saju.day} />
            <PaljaCell pos="시주" pillar={saju.hour} />
          </div>
          <p style={{ marginTop: "1.25rem", color: "var(--fg-dim)", fontSize: "0.85rem" }}>
            일간 {saju.dayMasterKor}({ELEMENT_KOR[saju.dayMasterElement]}) · 가장 강한 오행 {ELEMENT_KOR[saju.strongElement]}
          </p>
        </div>

        {/* 1. 당신의 본질 - 일주 */}
        <div className="section">
          <div className="section-label">1. 당신의 본질</div>
          <h2 className="section-title">
            {saju.iljuKor} 일주 — {iljuData?.keywords.join(" · ")}
          </h2>
          <div className="section-body">{iljuData?.body}</div>
        </div>

        {/* 2. 당신의 마음 - MBTI */}
        <div className="section">
          <div className="section-label">2. 당신의 마음</div>
          <h2 className="section-title">
            {input.mbti} — {mbtiData?.name}
          </h2>
          <div className="section-body">{mbtiData?.body}</div>
        </div>

        {/* 3. 당신의 시간 - 시주 */}
        <div className="section">
          <div className="section-label">3. 당신의 시간</div>
          <h2 className="section-title">
            {sijiData?.kor} ({sijiData?.timeRange})
          </h2>
          <div className="section-body">{sijiData?.body}</div>
        </div>

        {/* 4. AI 종합 해석 */}
        <div className="section">
          <div className="section-label">4. 당신만의 색깔</div>
          <h2 className="section-title">MBTI × 사주가 만나는 자리</h2>
          {aiError ? (
            <>
              <p className="error">{aiError}</p>
              <button
                className="btn-secondary"
                onClick={() => {
                  startedRef.current = false;
                  callAI();
                }}
              >
                다시 시도
              </button>
            </>
          ) : (
            <div className={`section-body ${aiStreaming ? "streaming" : ""}`}>
              {aiText || <span className="loading">당신의 종합 해석을 준비 중입니다...</span>}
            </div>
          )}
        </div>

        {/* 5. 당신의 무기 - 강점 */}
        <div className="section">
          <div className="section-label">5. 당신의 무기</div>
          <h2 className="section-title">사람들이 당신에게서 보는 것</h2>
          <div className="list-card accent-good">
            {mbtiExtra?.strengths.map((s, i) => (
              <div className="list-item" key={i}>
                <div className="list-num">{i + 1}</div>
                <div className="list-text">{s}</div>
              </div>
            ))}
            <div className="list-item">
              <div className="list-num">+</div>
              <div className="list-text">
                <span className={`element-badge ${saju.dayMasterElement}`}>
                  {dayElement.symbol} {dayElement.name}
                </span>
                일간 — {dayElement.vibes}.
              </div>
            </div>
          </div>
        </div>

        {/* 6. 당신의 그늘 - 약점 */}
        <div className="section">
          <div className="section-label">6. 당신의 그늘</div>
          <h2 className="section-title">조심하면 더 빛나는 자리</h2>
          <div className="list-card accent-bad">
            {mbtiExtra?.weaknesses.map((w, i) => (
              <div className="list-item bad" key={i}>
                <div className="list-num">{i + 1}</div>
                <div className="list-text">{w}</div>
              </div>
            ))}
            {saju.elementCount[saju.strongElement] >= 4 && (
              <div className="list-item bad">
                <div className="list-num">+</div>
                <div className="list-text">
                  <span className={`element-badge ${saju.strongElement}`}>
                    {strongElement.symbol} {strongElement.name}
                  </span>
                  기운이 많이 몰려 있어요. 한쪽으로 쏠리지 않도록 {ELEMENTS[weakest].name}({weakElement.symbol})의 기운을 일상에 더해보세요.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. 어울리는 일 */}
        <div className="section">
          <div className="section-label">7. 어울리는 일</div>
          <h2 className="section-title">
            {input.mbti} × <span className={`elem-${saju.dayMasterElement}`}>{dayElement.symbol}</span>이 만나는 직업
          </h2>
          <p style={{ color: "var(--fg-dim)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
            MBTI 기질과 일간 {dayElement.name}({dayElement.symbol})의 성향이 함께 빛나는 자리들이에요.
          </p>
          <div className="chips">
            {careers.fromMbti.map((c) => (
              <span className="chip chip-accent" key={`m-${c}`}>{c}</span>
            ))}
            {careers.fromElement.filter((c) => !careers.fromMbti.includes(c)).map((c) => (
              <span className="chip" key={`e-${c}`}>{c}</span>
            ))}
          </div>
          <p style={{ color: "var(--fg-dim)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            ※ 진한 색 = MBTI 적성, 일반 = 일간 오행 적성
          </p>
        </div>

        {/* 8. 당신의 사랑법 */}
        <div className="section">
          <div className="section-label">8. 당신의 사랑법</div>
          <h2 className="section-title">사랑할 때 당신은</h2>
          <div className="love-card">{mbtiExtra?.loveStyle}</div>
        </div>

        {/* 9. 인연의 결 */}
        <div className="section">
          <div className="section-label">9. 인연의 결</div>
          <h2 className="section-title">잘 맞는 사람, 조심할 사람</h2>
          <div className="compat-grid">
            <div className="compat-card good">
              <div className="compat-title">MBTI · 잘 맞는</div>
              <div className="compat-items">{mbtiCompat?.good.join(" · ")}</div>
            </div>
            <div className="compat-card bad">
              <div className="compat-title">MBTI · 조심할</div>
              <div className="compat-items">{mbtiCompat?.careful.join(" · ")}</div>
            </div>
            <div className="compat-card good">
              <div className="compat-title">일주 · 합(合)</div>
              <div className="compat-items">
                {iljuCompat.good.map((i) => ILJU[i]?.kor).join(" · ")}
              </div>
            </div>
            <div className="compat-card bad">
              <div className="compat-title">일주 · 충(沖)</div>
              <div className="compat-items">
                {iljuCompat.conflict.map((i) => ILJU[i]?.kor).join(" · ")}
              </div>
            </div>
          </div>
        </div>

        {/* 10. 오늘의 처방 */}
        <div className="section">
          <div className="section-label">10. 오늘의 처방</div>
          <h2 className="section-title">
            {weakElement.name}({weakElement.symbol})의 기운으로 균형 잡기
          </h2>
          <div className="prescription-card">
            <p style={{ margin: 0, color: "var(--fg-dim)", fontSize: "0.95rem" }}>
              당신의 사주에서 가장 부족한 오행은{" "}
              <span className={`element-badge ${weakest}`}>
                {weakElement.symbol} {weakElement.name}
              </span>
              이에요. <strong style={{ color: "var(--fg)" }}>{weakElement.vibes}</strong>을 일상에 더해보세요.
            </p>
            <div className="prescription-grid">
              <div className="prescription-row">
                <span className="prescription-key">어울리는 색</span>
                <span className="prescription-val">{weakElement.colors.join(", ")}</span>
              </div>
              <div className="prescription-row">
                <span className="prescription-key">좋은 방향</span>
                <span className="prescription-val">{weakElement.direction}</span>
              </div>
              <div className="prescription-row">
                <span className="prescription-key">음식</span>
                <span className="prescription-val">{weakElement.foods.slice(0, 3).join(", ")}</span>
              </div>
              <div className="prescription-row">
                <span className="prescription-key">행운 숫자</span>
                <span className="prescription-val">{weakElement.numbers.join(", ")}</span>
              </div>
              <div className="prescription-row">
                <span className="prescription-key">어울리는 보석</span>
                <span className="prescription-val">{weakElement.gems.join(", ")}</span>
              </div>
              <div className="prescription-row">
                <span className="prescription-key">몸의 자리</span>
                <span className="prescription-val">{weakElement.body.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. 액션 */}
      <div className="actions">
        <button className="btn-primary" style={{ width: "auto", flex: 1 }} onClick={shareImage}>
          결과 이미지 저장
        </button>
        <button className="btn-secondary" onClick={() => router.push("/")}>
          다시 하기
        </button>
      </div>

      <p style={{ marginTop: "2rem", color: "var(--fg-dim)", fontSize: "0.8rem", textAlign: "center" }}>
        ※ 사주 계산은 입춘 기준 연주와 절기 근사 월주를 사용한 단순화 버전입니다.<br />
        실제 명리학의 절입시 기준 계산과 ±1일 차이가 있을 수 있어요.
      </p>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="container"><p className="loading">불러오는 중...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
