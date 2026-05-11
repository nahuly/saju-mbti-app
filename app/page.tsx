"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MBTI_TYPES } from "../data/mbti";

export default function HomePage() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("0");
  const [mbti, setMbti] = useState("");
  const [error, setError] = useState("");

  const ready = useMemo(() => {
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    const h = parseInt(hour);
    return (
      mbti &&
      Number.isFinite(y) && y >= 1900 && y <= 2030 &&
      Number.isFinite(m) && m >= 1 && m <= 12 &&
      Number.isFinite(d) && d >= 1 && d <= 31 &&
      Number.isFinite(h) && h >= 0 && h <= 23
    );
  }, [year, month, day, hour, mbti]);

  function submit() {
    if (!ready) {
      setError("모든 항목을 정확히 입력해주세요.");
      return;
    }
    const params = new URLSearchParams({
      y: year,
      m: month,
      d: day,
      h: hour,
      min: minute || "0",
      mbti,
    });
    router.push(`/result?${params.toString()}`);
  }

  return (
    <div className="container">
      <h1 className="title">MBTI × 사주</h1>
      <p className="subtitle">두 갈래의 해석을 함께 풀어, 당신만의 색깔을 봅니다.</p>

      <div className="form-group">
        <label className="label">생년월일 (양력)</label>
        <div className="row-3">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="1995"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="6"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="15"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="label">태어난 시간 (24시간)</label>
        <div className="row">
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="시 (예: 14)"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          />
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="분 (예: 30, 모르면 0)"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="label">MBTI</label>
        <div className="mbti-grid">
          {MBTI_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`mbti-btn ${mbti === t ? "active" : ""}`}
              onClick={() => setMbti(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className="btn-primary"
        disabled={!ready}
        onClick={submit}
      >
        나의 색깔 보기
      </button>
    </div>
  );
}
