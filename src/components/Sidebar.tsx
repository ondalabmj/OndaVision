/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Info, Sparkles, Wand2, Plus, Trash, Image as ImageIcon } from "lucide-react";
import React from "react";
import { AppMode, AspectRatio, ASPECT_RATIOS } from "../types";
import { cn } from "../lib/utils";

interface SidebarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  prompt: string;
  onPromptChange: (val: string) => void;
  enhancedPrompt: string | null;
  isEnhancing: boolean;
  onEnhance: () => void;
  onGenerate: () => void;
  onCompose: () => void;
  isGenerating: boolean;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  composeImages: string[];
  onComposeImagesChange: (images: string[]) => void;
}

export function Sidebar({
  mode,
  onModeChange,
  aspectRatio,
  onAspectRatioChange,
  prompt,
  onPromptChange,
  enhancedPrompt,
  isEnhancing,
  onEnhance,
  onGenerate,
  onCompose,
  isGenerating,
  batchSize,
  onBatchSizeChange,
  composeImages,
  onComposeImagesChange,
}: SidebarProps) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onComposeImagesChange([...composeImages, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeComposeImage = (index: number) => {
    const updated = composeImages.filter((_, i) => i !== index);
    onComposeImagesChange(updated);
  };

  return (
    <aside className="w-[320px] border-r border-[#f3f4f6] dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shrink-0 z-10">
      {/* Mode Tabs */}
      <div className="flex border-b border-[#f3f4f6] dark:border-zinc-800">
        {(["generate", "edit", "compose"] as AppMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={cn(
              "flex-1 py-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
              mode === m
                ? "text-[#111827] dark:text-white border-[#111827] dark:border-white"
                : "text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {m === "generate" ? "생성" : m === "edit" ? "편집" : "합성"}
          </button>
        ))}
      </div>

      <div className="p-8 space-y-8">
        {/* Composition Source Images */}
        {mode === "compose" && (
          <section className="space-y-4">
            <h3 className="text-[11px] font-semibold text-[#9ca3af] dark:text-zinc-500 uppercase tracking-[0.05em]">합성할 이미지 ({composeImages.length}/8)</h3>
            <div className="grid grid-cols-4 gap-2">
              {composeImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square group">
                  <img src={img} className="w-full h-full object-cover rounded-md border border-zinc-100" />
                  {/* Number Badge */}
                  <div className="absolute top-1 left-1 w-5 h-5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm z-10 border border-white/20 dark:border-zinc-800">
                    {idx + 1}
                  </div>
                  <button
                    onClick={() => removeComposeImage(idx)}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <Plus className="w-3 h-3 rotate-45" />
                  </button>
                </div>
              ))}
              {composeImages.length < 8 && (
                <label className="aspect-square flex items-center justify-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-md cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                  <Plus className="w-5 h-5 text-zinc-300" />
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </section>
        )}

        {/* Prompt Input */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-[#9ca3af] dark:text-zinc-500 uppercase tracking-[0.05em]">
              {mode === "compose" ? "합성 프롬프트" : mode === "edit" ? "수정 프롬프트" : "이미지 프롬프트"}
            </h3>
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={mode === "compose" ? "이미지 번호(예: 1번, 2번)를 사용하여 어떻게 결합할지 명시해주세요." : mode === "edit" ? "이미지를 어떻게 수정할까요?" : "원하시는 이미지를 묘사해주세요..."}
              className="w-full h-[120px] p-4 bg-white dark:bg-zinc-900 border border-[#e5e7eb] dark:border-zinc-800 rounded-lg resize-none focus:border-[#111827] dark:focus:border-white transition-all outline-none text-[14px] text-[#111827] dark:text-zinc-200 leading-relaxed font-inherit"
            />
            {mode === "generate" && (
              <button
                onClick={onEnhance}
                disabled={isEnhancing || !prompt}
                className="absolute bottom-3 right-3 p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-[#111827] dark:hover:text-white disabled:opacity-50 transition-all flex items-center gap-2 group/btn"
              >
                <Sparkles className={cn("w-4 h-4 text-zinc-400 group-hover/btn:text-[#111827] dark:group-hover/btn:text-white", isEnhancing && "animate-pulse")} />
              </button>
            )}
          </div>

           {mode === "generate" && enhancedPrompt && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <Wand2 className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">프롬프트 향상됨</span>
              </div>
              <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed italic line-clamp-3">
                "{enhancedPrompt}"
              </p>
            </div>
          )}
        </section>

        {/* Aspect Ratio & Batch Size - for Generate mode only */}
        {mode === "generate" && (
          <>
            {/* Aspect Ratio */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold text-[#9ca3af] dark:text-zinc-500 uppercase tracking-[0.05em]">이미지 비율</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => onAspectRatioChange(ratio.label)}
                    className={cn(
                      "py-2 px-3 rounded-md border text-[13px] font-medium transition-all text-center",
                      aspectRatio === ratio.label
                        ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:text-[#111827] dark:border-white"
                        : "bg-white text-[#111827] border-[#e5e7eb] hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Settings */}
            <section>
               <h3 className="text-[11px] font-semibold text-[#9ca3af] dark:text-zinc-500 uppercase tracking-[0.05em] mb-3">생성 수</h3>
               <div className="grid grid-cols-4 gap-2">
                 {[1, 2, 3, 4].map((size) => (
                   <button
                     key={size}
                     onClick={() => onBatchSizeChange(size)}
                     className={cn(
                       "py-2 rounded-md border text-[13px] font-medium transition-all",
                       batchSize === size
                        ? "bg-[#111827] text-white border-[#111827] dark:bg-white dark:text-[#111827]"
                        : "bg-white text-[#111827] border-[#e5e7eb] hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                     )}
                   >
                     {size}
                   </button>
                 ))}
               </div>
            </section>
          </>
        )}
      </div>

      <div className="mt-auto p-8 border-t border-[#f3f4f6] dark:border-zinc-800">
        <button
          onClick={mode === "compose" ? onCompose : onGenerate}
          disabled={isGenerating || !prompt || (mode === "compose" && composeImages.length < 2)}
          className="w-full bg-[#111827] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#111827] font-bold py-[14px] rounded-lg flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[14px]"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-400 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
              <span>{mode === "generate" ? "생성 중..." : mode === "edit" ? "수정 중..." : "합성 중..."}</span>
            </>
          ) : (
            <>
              <span>{mode === "generate" ? "이미지 생성하기" : mode === "edit" ? "이미지 수정하기" : "이미지 합성하기"}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
