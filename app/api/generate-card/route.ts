import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
사진 속 주인공 사물을 분석해서 아래 JSON만 반환해.

{
  "nickname": "",
  "description": "",
  "rarity": ""
}

규칙:
- 한국어
- 병맛스럽고 재치있는 이름
- 별명은 15자 이하
- description은 30자 이하
- rarity는 Common, Rare, Epic, Legendary 중 하나
- JSON 외에는 아무것도 출력하지 마.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: image,
        },
      },
    ]);

    const text = result.response.text();

    const json = JSON.parse(
      text.replace(/```json|```/g, "").trim()
    );

    return NextResponse.json(json);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "별명 생성 실패" },
      { status: 500 }
    );
  }
}