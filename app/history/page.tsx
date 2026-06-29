"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CardData {
  id: string;
  nickname: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  date: string;
  image?: string;
}

const RARITY_COLORS = {
  Common: "#f3f4f6",
  Rare: "#dbeafe",
  Epic: "#ede9fe",
  Legendary: "#fef3c7",
};

export default function HistoryPage() {
  const [cardHistory, setCardHistory] = useState<CardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("my_card_history");
    if (saved) {
      try { setCardHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("이 카드를 도감에서 정말 삭제할까요?")) return;
    const filtered = cardHistory.filter(item => item.id !== id);
    setCardHistory(filtered);
    localStorage.setItem("my_card_history", JSON.stringify(filtered));
    if (selectedCard?.id === id) setSelectedCard(null);
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 max-w-4xl mx-auto py-10 min-h-screen bg-zinc-50">
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-black text-zinc-800 flex items-center gap-2">
          🎒 나의 별명도감 가방
        </h1>
        <Link href="/" className="px-4 py-2 text-xs font-bold text-violet-700 bg-violet-100 rounded-xl hover:bg-violet-200 transition-colors">
          🏠 메인으로 돌아가기
        </Link>
      </div>

      {cardHistory.length === 0 ? (
        <div className="w-full py-20 text-center text-zinc-400 font-bold bg-white rounded-2xl border border-zinc-200 shadow-sm">
          아직 수집한 카드가 없습니다. 메인 페이지에서 첫 카드를 만들어보세요!
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2">
            <p className="text-xs font-bold text-zinc-400 mb-1">보유 카드 목록 ({cardHistory.length}장)</p>
            {cardHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCard(item)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all bg-white hover:translate-x-1 shadow-sm ${selectedCard?.id === item.id ? 'border-zinc-800 ring-2 ring-zinc-800/20' : 'border-zinc-200'}`}
                style={{ borderLeft: `6px solid ${RARITY_COLORS[item.rarity]}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-zinc-900 truncate">{item.nickname}</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{item.rarity}</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">⏱️ {item.date}</span>
                </div>
                <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1 text-xs text-zinc-300 hover:text-red-500">❌</button>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 flex flex-col items-center justify-center bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[450px]">
            {selectedCard ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative w-full max-w-[280px] aspect-[3/4] overflow-hidden rounded-2xl border-[5px] border-zinc-800 shadow-xl" style={{ backgroundColor: RARITY_COLORS[selectedCard.rarity] }}>
                  <div className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-black text-white z-10">⭐ {selectedCard.rarity}</div>
                  <div className="absolute inset-x-0 top-10 bottom-24 flex items-center justify-center p-4">
                    {selectedCard.image && <img src={selectedCard.image} alt="도감사진" className="max-h-full max-w-full object-contain" />}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 text-center pb-4 pt-3 bg-white/75 backdrop-blur-md border-t border-zinc-200/50">
                    <h2 className="text-lg font-black text-zinc-900">{selectedCard.nickname}</h2>
                    <p className="mt-0.5 text-[10px] font-bold text-zinc-500 px-3 truncate">"{selectedCard.description}"</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-zinc-400">발급 일시: {selectedCard.date}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-zinc-400 text-center">목록에서 카드를 선택해주세요! ✨</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}