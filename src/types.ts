/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type AppMode = "generate" | "edit" | "compose";

export interface ImageHistory {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  aspectRatio: AspectRatio;
  createdAt: number;
}

export const ASPECT_RATIOS: { label: AspectRatio; width: number; height: number; icon: string }[] = [
  { label: "1:1", width: 1024, height: 1024, icon: "■" },
  { label: "16:9", width: 1344, height: 768, icon: "▭" },
  { label: "9:16", width: 768, height: 1344, icon: "▯" },
  { label: "4:3", width: 1152, height: 896, icon: "▢" },
  { label: "3:4", width: 896, height: 1152, icon: "▱" },
];
