import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

interface Body {
  mbti: string;
  palja: string;       // 예: "甲子 丙寅 庚午 壬辰"
  dayMaster: string;   // 일간 한글 (예: "경")
  dayMasterElement: string; // 일간 오행 한글
  strongElement: string;
  iljuKor: string;     // 일주 한글
  iljuKeywords: string[];
}

function buildPrompt(b: Body): string {
  return `당신은 명리학과 MBTI를 모두 깊이 이해하는 해석가입니다.
다음 사람의 종합 해석을 한국어로 600자 내외로 써주세요.

[MBTI] ${b.mbti}
[사주팔자] ${b.palja}
[일주] ${b.iljuKor} (${b.iljuKeywords.join(", ")})
[일간] ${b.dayMaster} (${b.dayMasterElement})
[가장 강한 오행] ${b.strongElement}

다음 톤으로 써주세요:
- 따뜻하고 통찰력 있게
- 단정짓지 말고 가능성을 열어두는 어조
- "당신은..."으로 시작
- 부정적 운명론 금지, 강점 중심으로
- MBTI와 사주가 어떻게 상호작용하는지 한 문단 포함
- 너무 추상적이지 않게, 구체적인 장면 한두 개 섞기
- 마크다운 기호(#, *, -) 쓰지 말고 평문으로
`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY가 설정되지 않았어요. .env.local 파일을 확인해주세요." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "잘못된 요청입니다." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: buildPrompt(body) }],
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI 호출 실패";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
