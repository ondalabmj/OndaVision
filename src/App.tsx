/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { AppMode, AspectRatio, ImageHistory } from "./types";
import { enhancePrompt, generateImages, editImage, composeImages } from "./lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Trash2 } from "lucide-react";

export default function App() {
  const [mode, setMode] = useState<AppMode>("generate");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [negativePrompt, setNegativePrompt] = useState("");
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(1);
  const [history, setHistory] = useState<ImageHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Edit/Compose state
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [composeImagesList, setComposeImagesList] = useState<string[]>([]);

  // Load history from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem("ai_image_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (urls: string[], usedPrompt: string, enhanced: string | null) => {
    const newItems: ImageHistory[] = urls.map(url => ({
      id: Math.random().toString(36).substring(7),
      url,
      prompt: usedPrompt,
      enhancedPrompt: enhanced || undefined,
      aspectRatio,
      createdAt: Date.now(),
    }));
    
    const updated = [...newItems, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    sessionStorage.setItem("ai_image_history", JSON.stringify(updated));
  };

  const handleEnhance = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    try {
      const result = await enhancePrompt(prompt);
      setEnhancedPrompt(result.positive);
      setNegativePrompt(result.negative);
    } catch (error) {
      console.error(error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    const finalPrompt = enhancedPrompt || prompt;
    try {
      const urls = await generateImages({
        prompt: finalPrompt,
        negativePrompt,
        aspectRatio,
        count: batchSize,
      });
      setCurrentImages(urls);
      saveToHistory(urls, prompt, enhancedPrompt);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (image: string, mask: string, instruction: string) => {
    setIsEditing(true);
    try {
      const result = await editImage({
        imageBuffer: image,
        maskBuffer: mask,
        instruction,
      });
      setCurrentImages([result, ...currentImages.slice(1)]); // Replace main
      saveToHistory([result], instruction, null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleCompose = async () => {
    if (composeImagesList.length < 2 || !prompt) return;
    setIsComposing(true);
    try {
      const result = await composeImages({
        images: composeImagesList,
        instruction: prompt,
      });
      setCurrentImages([result]);
      saveToHistory([result], prompt, null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsComposing(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem("ai_image_history");
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Header onToggleHistory={() => setShowHistory(true)} />

      <main className="flex flex-1 overflow-hidden relative">
        <Sidebar
          mode={mode}
          onModeChange={(m) => {
            setMode(m);
            // Reset state if needed
            if (m === 'generate') {
              setComposeImagesList([]);
            }
          }}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          prompt={prompt}
          onPromptChange={(p) => {
            setPrompt(p);
            setEnhancedPrompt(null);
          }}
          enhancedPrompt={enhancedPrompt}
          isEnhancing={isEnhancing}
          onEnhance={handleEnhance}
          onGenerate={handleGenerate}
          onCompose={handleCompose}
          isGenerating={isGenerating || isComposing}
          batchSize={batchSize}
          onBatchSizeChange={setBatchSize}
          composeImages={composeImagesList}
          onComposeImagesChange={setComposeImagesList}
        />

        <PreviewCanvas
          mode={mode}
          images={currentImages}
          aspectRatio={aspectRatio}
          onEdit={handleEdit}
          isEditing={isEditing}
          sourceImage={sourceImage}
          onSourceImageChange={setSourceImage}
        />

        {/* History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[60]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-zinc-900 shadow-xl z-[70] flex flex-col border-l border-[#f3f4f6] dark:border-zinc-800"
              >
                <div className="p-8 border-b border-[#f3f4f6] dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#111827] dark:text-white" />
                    <h2 className="font-bold text-[18px] tracking-tight text-[#111827] dark:text-white uppercase">생성 기록</h2>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[#111827] transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
                  {history.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {history.map((item) => (
                        <div key={item.id} className="group relative">
                          <div
                            className="aspect-square rounded-lg overflow-hidden cursor-pointer border border-[#f3f4f6] dark:border-zinc-800 hover:border-[#111827] transition-all"
                            onClick={() => {
                              setCurrentImages([item.url]);
                              setShowHistory(false);
                            }}
                          >
                            <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-[11px] font-bold text-[#111827] dark:text-zinc-100 line-clamp-1 uppercase tracking-tight">{item.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-zinc-300" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#111827] dark:text-white uppercase">기록이 없습니다</p>
                        <p className="text-[12px] text-zinc-400 mt-1">아이디어를 시각화할 준비가 되셨나요?</p>
                      </div>
                    </div>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="p-8 border-t border-[#f3f4f6] dark:border-zinc-800">
                    <button
                      onClick={clearHistory}
                      className="w-full py-3 flex items-center justify-center gap-2 text-[#9ca3af] hover:text-red-500 transition-all font-semibold text-[12px] uppercase tracking-wider"
                    >
                      <Trash2 className="w-4 h-4" />
                      기록 삭제
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
