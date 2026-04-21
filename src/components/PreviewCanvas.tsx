/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Edit3, Trash2, X, Plus, Image as ImageIcon } from "lucide-react";
import React from "react";
import { AppMode, AspectRatio } from "../types";
import { cn } from "../lib/utils";
import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";

interface PreviewCanvasProps {
  mode: AppMode;
  images: string[];
  aspectRatio: AspectRatio;
  onEdit: (image: string, mask: string, instruction: string) => void;
  isEditing: boolean;
  sourceImage: string | null;
  onSourceImageChange: (image: string | null) => void;
}

export function PreviewCanvas({
  mode,
  images,
  aspectRatio,
  onEdit,
  isEditing,
  sourceImage,
  onSourceImageChange,
}: PreviewCanvasProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(images.length > 0 ? 0 : null);
  const [maskMode, setMaskMode] = useState(false);
  const [maskPrompt, setMaskPrompt] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (images.length > 0) {
      setSelectedIndex(0);
    }
  }, [images]);

  // When switching to edit mode, if we have a generated image, use it as source
  useEffect(() => {
    if (mode === "edit" && images.length > 0 && !sourceImage) {
      onSourceImageChange(images[0]);
    }
  }, [mode, images, sourceImage]);

  const selectedImage = mode === "edit" ? sourceImage : (selectedIndex !== null ? images[selectedIndex] : null);

  const handleDownload = (imgUrl: string) => {
    const link = document.createElement("a");
    link.href = imgUrl;
    link.download = `ai-image-${Date.now()}.png`;
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onSourceImageChange(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    if (!maskMode) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath(); // Reset path
    }
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || !maskMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Visible on UI
    ctx.globalCompositeOperation = "source-over";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const resetMask = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const applyEdit = async () => {
    if (!selectedImage || !canvasRef.current) return;
    
    // Create black/white mask
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.fillStyle = "black";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvasRef.current, 0, 0);
    
    const maskData = tempCanvas.toDataURL("image/png");
    onEdit(selectedImage, maskData, maskPrompt);
    setMaskMode(false);
    setMaskPrompt("");
    resetMask();
  };

  if (!selectedImage && (mode === "generate" || mode === "edit")) {
    return (
      <div className="flex-1 bg-[#fafafa] dark:bg-zinc-900 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {mode === "edit" ? "수정할 이미지 업로드" : "창작 시작하기"}
            </h2>
            <p className="text-zinc-500 mt-2 text-sm">
              {mode === "edit"
                ? "수정하고 싶은 이미지를 드래그하거나 클릭하여 업로드하세요."
                : "왼쪽 패널에 아이디어를 입력하고 생성 버튼을 눌러보세요."}
            </p>
            {mode === "edit" && (
              <label className="mt-6 inline-flex items-center px-6 py-3 bg-[#111827] text-white rounded-lg cursor-pointer hover:bg-black transition-all text-sm font-bold">
                이미지 선택
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for compose mode results
  if (mode === 'compose' && images.length === 0) {
    return (
      <div className="flex-1 bg-[#fafafa] dark:bg-zinc-900 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center">
            <Plus className="w-10 h-10 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">이미지 합성하기</h2>
            <p className="text-zinc-500 mt-2 text-sm">왼쪽 패널에 합성할 이미지들을 추가하고 프롬프트를 입력하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  const getAspectClasses = () => {
    if (mode === "edit" || mode === "compose") return "aspect-square";
    switch (aspectRatio) {
      case "16:9": return "aspect-video";
      case "9:16": return "aspect-[9/16] h-[70vh]";
      case "4:3": return "aspect-[4/3]";
      case "3:4": return "aspect-[3/4] h-[70vh]";
      default: return "aspect-square";
    }
  };

  return (
    <div className="flex-1 bg-[#fafafa] dark:bg-zinc-900 flex flex-col items-center justify-center p-4 sm:p-10 overflow-y-auto">
      <div className="relative group max-w-full w-full flex flex-col items-center">
        <div className={cn(
          "bg-white dark:bg-black rounded-xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] relative transition-all duration-500 border border-[#f3f4f6] dark:border-zinc-800 w-full max-w-[640px]",
          getAspectClasses(),
          "h-auto max-h-[70vh]"
        )}>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}

          {maskMode && (
            <canvas
              ref={canvasRef}
              width={1024}
              height={1024}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair z-20"
            />
          )}

          {/* Controls Overlay */}
          {!maskMode && selectedImage && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
              <button
                onClick={() => handleDownload(selectedImage)}
                className="p-3 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black rounded-lg shadow-sm text-[#111827] dark:text-white transition-all backdrop-blur-md"
              >
                <Download className="w-5 h-5" />
              </button>
              {(mode === "generate" || mode === "edit") && (
                <button
                  onClick={() => setMaskMode(true)}
                  className={cn(
                    "p-3 rounded-lg shadow-sm transition-all backdrop-blur-md",
                    maskMode
                      ? "bg-[#111827] text-white"
                      : "bg-white/90 dark:bg-black/90 text-[#111827] dark:text-white hover:bg-white"
                  )}
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {selectedImage && images.includes(selectedImage) && (
          <div className="mt-4 w-full max-w-[640px] px-6 py-4 flex justify-between items-center bg-white dark:bg-zinc-900 border border-[#f3f4f6] dark:border-zinc-800 rounded-xl">
             <div className="text-[13px] text-[#6b7280]">
               Gemini 2.5 Flash로 생성됨
             </div>
             <div className="flex gap-2">
               <span className="px-2 py-1 bg-[#f3f4f6] dark:bg-zinc-800 rounded-[4px] text-[10px] font-bold text-[#4b5563] uppercase leading-none flex items-center">PNG</span>
               <span className="px-2 py-1 bg-[#f3f4f6] dark:bg-zinc-800 rounded-[4px] text-[10px] font-bold text-[#4b5563] uppercase leading-none flex items-center">1K</span>
             </div>
          </div>
        )}

        {/* Batch Thumbnails */}
        {mode === 'generate' && images.length > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                  selectedIndex === idx ? "border-[#111827] dark:border-white scale-105 shadow-md" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Batch ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inpainting Toolbar */}
      {maskMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl shadow-2xl flex flex-col gap-4 w-[500px] z-50 animate-in slide-in-from-bottom-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-500" />
              부분 수정 모드
            </h4>
            <div className="flex gap-2">
              <button onClick={resetMask} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setMaskMode(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
              수정을 원하는 영역을 이미지 위에 칠한 뒤, 아래에 수정 지술을 입력하세요.
            </div>
            <input
              type="text"
              value={maskPrompt}
              onChange={(e) => setMaskPrompt(e.target.value)}
              placeholder="선택한 영역에 무엇을 채울까요?"
              className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
               onClick={applyEdit}
               disabled={isEditing || !maskPrompt}
               className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold py-3 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isEditing ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-900 animate-spin rounded-full" /> : "변경 사항 적용"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
