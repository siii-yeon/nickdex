import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "REMOVE_BG_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!image || !(image instanceof Blob)) {
    return NextResponse.json(
      { error: "이미지 파일이 필요합니다." },
      { status: 400 },
    );
  }

  const removeBgFormData = new FormData();
  removeBgFormData.append("image_file", image);
  removeBgFormData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: removeBgFormData,
  });

  if (!response.ok) {
    let message = "배경 제거에 실패했습니다.";

    try {
      const errorBody = await response.json();
      if (typeof errorBody.errors?.[0]?.title === "string") {
        message = errorBody.errors[0].title;
      }
    } catch {
      // ignore JSON parse errors
    }

    return NextResponse.json({ error: message }, { status: response.status });
  }

  const pngBuffer = await response.arrayBuffer();

  return new NextResponse(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
