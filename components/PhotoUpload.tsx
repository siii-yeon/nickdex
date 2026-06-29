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

  // ✨ 크레딧 제한 X + Vercel 프리패스 + 대기업 안정망 초정밀 AI 무제한 배경 제거 시스템
  async function handleRemoveBackground() {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    revokeUrl(cutoutPreview);
    setCutoutPreview(null);

    try {
      const