"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

interface CardData {
  id: string;
  nickname: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  date: string;
  image?: string; 
}

const RARITY_COLORS: Record<CardData["rarity"], string> = {
  Common: "#f3f4f6",
  Rare: "#dbeafe",
  Epic: "#ede9fe",
  Legendary: "#fef3c7",
};

export default function PhotoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cutoutPreview, setCutoutPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [cardHistory, setCardHistory] = useState<CardData[]>([]);

  function revokeUrl(url: string | null) {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("my_card_history");
    if (saved) {
      try { setCardHistory(JSON.parse(saved)); } catch (e) {}
    }
    return () => {
      revokeUrl(preview);
      revokeUrl(cutoutPreview);
    };
  }, [preview, cutoutPreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    revokeUrl(preview);
    revokeUrl(cutoutPreview);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setCutoutPreview(null);
    setCard(null);
    setError(null);
  }

  function handleReset() {
    revokeUrl(preview);
    revokeUrl(cutoutPreview);
    setSelectedFile(null);
    setPreview(null);
    setCutoutPreview(null);
    setCard(null);
    setError(null);
    setIsLoading(false);
    setIsGenerating(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  // 배경 제거(누끼) API 요청
  async function handleRemoveBackground() {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    revokeUrl(cutoutPreview);
    setCutoutPreview(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "배경 제거에 실패했습니다.");
      }

      const blob = await response.blob();
      setCutoutPreview(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "배경 제거 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  // AI 카드 및 별명 생성 API 요청
  async function handleGenerateCard() {
    if (!selectedFile || !cutoutPreview) return;
    setIsGenerating(true);
    setError(null);

    try {
      // 🛠️ 도감 방으로 이동할 때 사진이 깨지지 않도록, 누끼Blob 주소를 진짜 이미지 데이터(base64)로 영구 보존 처리!
      const blobResponse = await fetch(cutoutPreview);
      const blobData = await blobResponse.blob();
      
      const saveReader = new FileReader();
      saveReader.onloadend = async () => {
        const permanentImageData = saveReader.result as string; // 평생 안 깨지는 진짜 이미지 데이터 확보

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(",")[1];

            const res = await fetch("/api/generate-card", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: base64 }),
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error ?? "별명 생성에 실패했습니다.");
            }

            const data = await res.json();
            const random = Math.random() * 100;
            let finalRarity: "Common" | "Rare" | "Epic" | "Legendary" = "Common";

            if (random < 1) finalRarity = "Legendary";
            else if (random < 7) finalRarity = "Epic";
            else if (random < 27) finalRarity = "Rare";

            const now = new Date();
            const formattedDate = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, "0")}. ${String(now.getDate()).padStart(2, "0")}. ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const newCard: CardData = {
              id: String(Date.now()),
              nickname: data.nickname,
              description: data.description,
              rarity: finalRarity, 
              date: formattedDate,
              image: permanentImageData // 🛠️ 가방 안에서도 평생 살아남는 진짜 이미지 데이터 주입!
            };

            setCard(newCard);
            const updatedHistory = [newCard, ...cardHistory];
            setCardHistory(updatedHistory);
            localStorage.setItem("my_card_history", JSON.stringify(updatedHistory));

          } catch (err) {
            setError(err instanceof Error ? err.message : "별명 생성 중 오류가 발생했습니다.");
          } finally {
            setIsGenerating(false);
          }
        };
        reader.readAsDataURL(selectedFile);
      };
      saveReader.readAsDataURL(blobData);

    } catch (err) {
      setError("카드 생성 과정에서 오류가 발생했습니다.");
      setIsGenerating(false);
    }
  }

  function handleSaveCardImage() {
    if (!cutoutPreview || !card) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = RARITY_COLORS[card.rarity];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.src = cutoutPreview;
    
    img.onload = () => {
      let imgWidth = img.width;
      let imgHeight = img.height;
      const ratio = Math.min(500 / imgWidth, 450 / imgHeight);
      imgWidth *= ratio;
      imgHeight *= ratio;

      ctx.drawImage(img, (canvas.width - imgWidth) / 2, 100 + (450 - imgHeight) / 2, imgWidth, imgHeight);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillRect(0, 620, canvas.width, 180);
      ctx.fillStyle = "#18181b";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`⭐ ${card.rarity}`, 30, 55);
      ctx.fillStyle = "#09090b";
      ctx.font = "bold 42px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(card.nickname, canvas.width / 2, 690);
      ctx.fillStyle = "#4b5563";
      ctx.font = "600 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`"${card.description}"`, canvas.width / 2, 745);

      const finalImage = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = finalImage;
      link.download = `${card.nickname}_도감카드.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4 max-w-md mx-auto pb-10">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />

      {!preview ? (
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-6 py-10 transition-all hover:border-violet-400 hover:bg-violet-50 active:scale-[0.98] sm:py-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-xl">📷</span>
          <span className="text-base font-bold text-violet-700">사진 선택하기</span>
          <span className="text-xs text-zinc-400">JPG, PNG, WEBP · 최대 10MB</span>
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <div className="w-full space-y-1.5">
            <p className="text-xs font-semibold text-zinc-500">원본 미리보기</p>
            <div className="relative w-full overflow-hidden rounded-xl border border-violet-100 bg-zinc-50 shadow-inner">
              <img src={preview} alt="미리보기" className="mx-auto max-h-52 w-full object-contain sm:max-h-64" />
            </div>
          </div>

          {!cutoutPreview && (
            <button type="button" onClick={handleRemoveBackground} disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-violet-700 disabled:opacity-60 active:scale-[0.98]">
              {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />배경 제거 중...</> : "배경 제거하기"}
            </button>
          )}

          {error && <p className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">{error}</p>}

          {cutoutPreview && (
            <div className="w-full space-y-4">
              <button type="button" onClick={handleGenerateCard} disabled={isGenerating} className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3.5 font-bold text-white shadow-md transition-colors hover:bg-fuchsia-700 disabled:opacity-60 active:scale-[0.98]">
                {isGenerating ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />AI가 별명 짓는 중...</> : "✨ 별명 생성하기"}
              </button>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500">도감 카드</p>
                <div className="relative mx-auto w-full max-w-[320px] aspect-[3/4] overflow-hidden rounded-2xl border-[5px] border-zinc-800 shadow-2xl" style={{ backgroundColor: RARITY_COLORS[card?.rarity ?? "Common"] }}>
                  {card && <div className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-black text-white z-10">⭐ {card.rarity}</div>}
                  <div className="absolute inset-x-0 top-10 bottom-24 flex items-center justify-center p-4">
                    <img src={cutoutPreview} alt="누끼" className="max-h-full max-w-full object-contain" />
                  </div>
                  {card && (
                    <div className="absolute bottom-0 left-0 right-0 text-center pb-4 pt-3 bg-white/75 backdrop-blur-md border-t border-zinc-200/50">
                      <h2 className="text-xl font-black text-zinc-900">{card.nickname}</h2>
                      <p className="mt-0.5 text-[11px] font-bold text-zinc-500 px-3 truncate">"{card.description}"</p>
                    </div>
                  )}
                </div>
              </div>

              {card && <button type="button" onClick={handleSaveCardImage} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-800 py-3.5 text-sm font-bold text-white shadow hover:bg-zinc-900">💾 카드 전체 이미지로 저장하기</button>}
            </div>
          )}

          <div className="flex w-full gap-2 pt-2 border-t border-zinc-100">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isLoading || isGenerating} className="flex-1 rounded-xl bg-violet-50 py-3 text-xs font-bold text-violet-700 disabled:opacity-50">다른 사진</button>
            <button type="button" onClick={handleReset} disabled={isLoading || isGenerating} className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold text-zinc-500 disabled:opacity-50">초기화</button>
          </div>
        </div>
      )}

      {/* 🎒 나의 카드 도감 가방 전용 독립형 버튼 링크 */}
      <div className="w-full mt-6 pt-6 border-t-2 border-dashed border-zinc-200">
        <Link
          href="/history"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-sm font-black text-white shadow-md transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]"
        >
          🎒 나의 별명도감 열기 ({cardHistory.length}장) ➡️
        </Link>
      </div>
    </div>
  );
}