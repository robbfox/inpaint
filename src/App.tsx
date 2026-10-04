/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Play,
  Download,
  Share2,
  Copy,
  Check,
  Code2,
  Moon,
  Sun,
  Layers,
  Info,
  Terminal,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Split,
  Image as ImageIcon,
  Wand2,
  HelpCircle,
} from 'lucide-react';
import { GradioCanvas } from './components/GradioCanvas';
import { ImageComparisonSlider } from './components/ImageComparisonSlider';
import { GradioProgressConsole } from './components/GradioProgressConsole';
import { GradioApiModal } from './components/GradioApiModal';
import { QwenModelSpecs } from './components/QwenModelSpecs';
import {
  EXAMPLE_PRESETS,
  ExamplePreset,
  generatePresetImage,
  generatePresetMask,
  synthesizeInpaintedImage,
} from './utils/presets';

interface GenerationHistoryItem {
  id: string;
  timestamp: string;
  imageSrc: string;
  originalSrc: string;
  maskSrc: string;
  prompt: string;
  steps: number;
  guidanceScale: number;
  seed: number;
}

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Canvas Image & Mask State
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  const [currentMaskSrc, setCurrentMaskSrc] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<ExamplePreset | null>(null);

  // Output State
  const [inpaintedResultSrc, setInpaintedResultSrc] = useState<string | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'result' | 'slider' | 'mask' | 'metadata'>('result');

  // Parameters
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>(
    'blurry, distorted, low quality, artifacts, bad anatomy, bad texture, oversaturated, deformed'
  );
  const [steps, setSteps] = useState<number>(30);
  const [guidanceScale, setGuidanceScale] = useState<number>(7.5);
  const [maskBlur, setMaskBlur] = useState<number>(8);
  const [fillMode, setFillMode] = useState<string>('original');
  const [seed, setSeed] = useState<number>(489201);
  const [isRandomSeed, setIsRandomSeed] = useState<boolean>(false);
  const [sampler, setSampler] = useState<string>('DPM++ 2M Karras');
  const [qwenGuidanceWeight, setQwenGuidanceWeight] = useState<number>(0.85);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Processing & Telemetry State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepMessage, setStepMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isExpandingPrompt, setIsExpandingPrompt] = useState<boolean>(false);

  // Modals & History
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [activeBottomTab, setActiveBottomTab] = useState<'examples' | 'specs' | 'history'>('examples');

  // Initialize theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load first example on mount
  useEffect(() => {
    const firstExample = EXAMPLE_PRESETS[0];
    loadExample(firstExample);
  }, []);

  const loadExample = (preset: ExamplePreset) => {
    setActivePreset(preset);
    const imgData = generatePresetImage(preset);
    const maskData = generatePresetMask(preset);
    setCurrentImageSrc(imgData);
    setCurrentMaskSrc(maskData);
    setPrompt(preset.prompt);
    setNegativePrompt(preset.negativePrompt);
    setSteps(preset.steps);
    setGuidanceScale(preset.guidanceScale);
    setMaskBlur(preset.maskBlur);
    setSampler(preset.sampler);
    setSeed(preset.seed);
    setIsRandomSeed(false);
  };

  // Enhance prompt with Qwen 2.1 via API
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsExpandingPrompt(true);
    try {
      const res = await fetch('/api/expand-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, inpaintGoal: 'photorealistic detail' }),
      });
      const data = await res.json();
      if (data.expandedPrompt) {
        setPrompt(data.expandedPrompt);
        setLogs((prev) => [
          ...prev,
          `[Qwen-2.1] Prompt expansion applied: "${data.expandedPrompt.slice(0, 45)}..."`,
        ]);
      }
    } catch (err) {
      console.warn('Prompt expansion error:', err);
    } finally {
      setIsExpandingPrompt(false);
    }
  };

  // Execute Inpainting
  const handleInpaint = async () => {
    if (!currentImageSrc) {
      alert('Please load or upload an image first.');
      return;
    }
    if (!prompt.trim()) {
      alert('Please enter an inpainting prompt.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setCurrentStep(1);
    setStepMessage('Qwen 2.1 vision encoder tokenizing unmasked image patches...');

    const actualSeed = isRandomSeed ? Math.floor(Math.random() * 10000000) : seed;
    if (isRandomSeed) setSeed(actualSeed);

    const initialLogs = [
      `[Qwen-2.1] Pipeline initialized on device cuda:0 (A100-SXM4-80GB).`,
      `[Qwen-2.1] Mask loaded with feather blur radius: ${maskBlur}px.`,
      `[Qwen-2.1] Spatial cross-attention conditioning prompt: "${prompt.slice(0, 50)}..."`,
      `[Qwen-2.1] Sampler: ${sampler}, CFG Scale: ${guidanceScale}, Steps: ${steps}, Seed: ${actualSeed}`,
    ];
    setLogs(initialLogs);

    try {
      // Step-by-step progress simulation matching diffusion denoising steps
      const totalSteps = steps;
      const stepDuration = Math.max(30, Math.min(100, 2400 / totalSteps));

      for (let s = 1; s <= totalSteps; s++) {
        await new Promise((r) => setTimeout(r, stepDuration));
        const pct = 10 + Math.round((s / totalSteps) * 80);
        setProgress(pct);
        setCurrentStep(s);
        setStepMessage(`Denoising latent flow step ${s}/${totalSteps} (it/s: ~17.2)...`);

        if (s === Math.round(totalSteps * 0.3)) {
          setLogs((prev) => [...prev, `[Qwen-2.1] Latent step ${s}: High-level geometry & illumination locked.`]);
        } else if (s === Math.round(totalSteps * 0.7)) {
          setLogs((prev) => [...prev, `[Qwen-2.1] Latent step ${s}: Fine micro-textures & specular highlights blended.`]);
        }
      }

      setProgress(94);
      setStepMessage('Decoding latents via Spatial Flow VAE & Poisson edge feathering...');

      // Call backend for vision telemetry & server logging
      const serverResp = await fetch('/api/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentImageSrc,
          mask: currentMaskSrc,
          prompt,
          negativePrompt,
          steps,
          guidanceScale,
          maskBlur,
          fillMode,
          seed: actualSeed,
          sampler,
          qwenGuidanceWeight,
        }),
      });

      const serverData = await serverResp.json();
      if (serverData.logLines) {
        setLogs((prev) => [...prev, ...serverData.logLines]);
      }
      if (serverData.telemetry) {
        setTelemetry(serverData.telemetry);
      }

      // Generate composite high-resolution inpainted canvas
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.onload = () => {
        if (currentMaskSrc) {
          const maskImg = new Image();
          maskImg.crossOrigin = 'anonymous';
          maskImg.onload = () => {
            const synthesizedUrl = synthesizeInpaintedImage(
              baseImg,
              maskImg,
              activePreset,
              prompt,
              maskBlur
            );
            setInpaintedResultSrc(synthesizedUrl);
            setProgress(100);
            setIsProcessing(false);
            setStepMessage('Inpainting complete!');

            // Record into history
            const historyEntry: GenerationHistoryItem = {
              id: `qwen_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              imageSrc: synthesizedUrl,
              originalSrc: currentImageSrc,
              maskSrc: currentMaskSrc,
              prompt,
              steps,
              guidanceScale,
              seed: actualSeed,
            };
            setHistory((prev) => [historyEntry, ...prev.slice(0, 19)]);
          };
          maskImg.src = currentMaskSrc;
        } else {
          const synthesizedUrl = synthesizeInpaintedImage(
            baseImg,
            null,
            activePreset,
            prompt,
            maskBlur
          );
          setInpaintedResultSrc(synthesizedUrl);
          setProgress(100);
          setIsProcessing(false);
          setStepMessage('Inpainting complete!');
        }
      };
      baseImg.src = currentImageSrc;
    } catch (err: any) {
      console.error('Inpainting execution error:', err);
      setIsProcessing(false);
      setLogs((prev) => [...prev, `[ERROR] Inpainting failed: ${err.message}`]);
    }
  };

  // Re-use inpainted result as new canvas input for iterative multi-turn inpainting
  const handleSendToCanvas = () => {
    if (inpaintedResultSrc) {
      setCurrentImageSrc(inpaintedResultSrc);
      setCurrentMaskSrc(null);
      setActivePreset(null);
      setCopiedNotification('Result loaded into canvas as new base image!');
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  // Download image
  const handleDownload = () => {
    if (!inpaintedResultSrc) return;
    const a = document.createElement('a');
    a.href = inpaintedResultSrc;
    a.download = `qwen2.1-inpaint-${Date.now()}.png`;
    a.click();
  };

  // Copy to clipboard
  const handleCopyImage = async () => {
    if (!inpaintedResultSrc) return;
    try {
      const res = await fetch(inpaintedResultSrc);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopiedNotification('Image copied to clipboard!');
      setTimeout(() => setCopiedNotification(null), 2500);
    } catch (err) {
      console.warn('Clipboard copy not supported directly for blob:', err);
      setCopiedNotification('Use download button to save image.');
      setTimeout(() => setCopiedNotification(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* 1. Gradio / Hugging Face Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand & Space Title */}
          <div className="flex items-center gap-3">
            {/* Gradio Orange Blocks Logo */}
            <div className="flex items-center gap-1.5" title="Gradio Space">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                gr
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white tracking-tight">gradio</span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">/</span>

            {/* Model Name */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Qwen / Qwen2.1-Image-Inpainting
              </span>
              <span className="text-xs text-slate-500 hidden md:inline">· 7.6B DiT</span>
            </div>

            {/* Hardware badge with live green pulse */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Running on ⚡ A100 GPU</span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="View Gradio Python/REST API client code"
            >
              <Code2 className="w-3.5 h-3.5 text-orange-500" />
              <span>Use via API</span>
            </button>

            <button
              onClick={() => {
                setCopiedNotification('Space cloned to workspace session');
                setTimeout(() => setCopiedNotification(null), 2000);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplicate Space</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {copiedNotification && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg shadow-lg animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Markdown Intro Header (Gradio style gr.Markdown) */}
        <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Qwen 2.1 Multimodal Image Inpainting Studio</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              v2.1.0-DiT
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Draw a mask over the area you want to replace, edit, or extend. Qwen 2.1 conditions the spatial flow diffusion
            transformer with unmasked visual context tokens and multimodal reasoning for seamless, photorealistic inpainting.
          </p>
        </div>

        {/* Gradio Two-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Input & Controls */}
          <div className="space-y-4">
            {/* Input Card Container */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Input Image & Mask Editor
                  </span>
                </div>
                {activePreset && (
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Preset: {activePreset.title}
                  </span>
                )}
              </div>

              {/* Interactive Mask Canvas */}
              <GradioCanvas
                imageSrc={currentImageSrc}
                maskDataUrl={currentMaskSrc}
                onImageChange={(dataUrl) => {
                  setCurrentImageSrc(dataUrl);
                  setCurrentMaskSrc(null);
                  setActivePreset(null);
                }}
                onMaskChange={(maskUrl) => setCurrentMaskSrc(maskUrl)}
                isProcessing={isProcessing}
              />

              {/* Textbox: Prompt */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Prompt</span>
                    <span className="text-orange-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isExpandingPrompt || !prompt.trim()}
                    className="flex items-center gap-1 text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 disabled:opacity-40 transition-colors"
                    title="Expand prompt with photorealistic Qwen 2.1 conditioning tokens"
                  >
                    <Wand2 className={`w-3 h-3 ${isExpandingPrompt ? 'animate-spin' : ''}`} />
                    <span>{isExpandingPrompt ? 'Enhancing...' : 'Enhance with Qwen 2.1'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate in the masked area..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none leading-relaxed transition-all"
                />
              </div>

              {/* Textbox: Negative Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Negative Prompt
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Artifacts, low quality, distortion, extra objects..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* Primary Gradio Orange Button */}
                <button
                  type="button"
                  onClick={handleInpaint}
                  disabled={isProcessing || !currentImageSrc}
                  className="sm:col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Qwen 2.1... ({Math.round(progress)}%)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Generate (Inpaint)</span>
                    </>
                  )}
                </button>

                {/* Clear Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMaskSrc(null);
                    setInpaintedResultSrc(null);
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Mask</span>
                </button>
              </div>

              {/* Collapsible Accordion: gr.Accordion("Advanced Parameters") */}
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 dark:text-slate-300 py-1 hover:text-orange-500 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                    <span>Advanced Diffusion Parameters</span>
                  </div>
                  {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-3.5 animate-in fade-in duration-150 text-xs">
                    {/* Guidance Scale (CFG) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Guidance Scale (CFG)</span>
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{guidanceScale.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="18.0"
                        step="0.5"
                        value={guidanceScale}
                        onChange={(e) => setGuidanceScale(Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Denoising Steps */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Sampling Steps</span>
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{steps}</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="1"
                        value={steps}
                        onChange={(e) => setSteps(Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Mask Blur (Feathering) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Mask Blur (Feather Edge)</span>
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{maskBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        step="2"
                        value={maskBlur}
                        onChange={(e) => setMaskBlur(Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Sampler & Qwen Guidance Weight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-400 block">Sampler</label>
                        <select
                          value={sampler}
                          onChange={(e) => setSampler(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200"
                        >
                          <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
                          <option value="Euler a">Euler Ancestral</option>
                          <option value="UniPC">UniPC (Fast)</option>
                          <option value="DDIM">DDIM</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-400 block">Qwen Vision Guidance</label>
                        <select
                          value={qwenGuidanceWeight}
                          onChange={(e) => setQwenGuidanceWeight(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200"
                        >
                          <option value="0.95">Ultra Strong (0.95)</option>
                          <option value="0.85">Balanced (0.85 - Default)</option>
                          <option value="0.70">Creative Latitude (0.70)</option>
                          <option value="0.50">Low Constraint (0.50)</option>
                        </select>
                      </div>
                    </div>

                    {/* Seed */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-400">Seed:</span>
                        <input
                          type="number"
                          value={seed}
                          disabled={isRandomSeed}
                          onChange={(e) => setSeed(Number(e.target.value))}
                          className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded text-xs font-mono disabled:opacity-40"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={isRandomSeed}
                          onChange={(e) => setIsRandomSeed(e.target.checked)}
                          className="rounded text-orange-500 focus:ring-orange-500"
                        />
                        <span>Randomize Seed</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Output Gallery & Before-After Slider */}
          <div className="space-y-4">
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Output Tab Selector */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveOutputTab('result')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                      activeOutputTab === 'result'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Inpainted Result</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOutputTab('slider')}
                    disabled={!inpaintedResultSrc}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeOutputTab === 'slider'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Split className="w-3.5 h-3.5 text-orange-500" />
                    <span>Before / After Slider</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOutputTab('mask')}
                    disabled={!currentMaskSrc}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeOutputTab === 'mask'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                    <span>Mask</span>
                  </button>
                </div>

                {inpaintedResultSrc && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyImage}
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy result to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Download full resolution image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Output Display Container */}
              <div className="relative w-full aspect-square max-h-[540px] bg-slate-950 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner flex items-center justify-center">
                {activeOutputTab === 'result' && (
                  inpaintedResultSrc ? (
                    <img
                      src={inpaintedResultSrc}
                      alt="Qwen 2.1 Inpainted Result"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 border border-slate-800">
                        <Sparkles className="w-6 h-6 text-orange-400/80" />
                      </div>
                      <p className="font-medium text-slate-300">Ready for Inpainting</p>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Draw a mask on the canvas, customize the prompt, and click Generate to see Qwen 2.1 results here.
                      </p>
                    </div>
                  )
                )}

                {activeOutputTab === 'slider' && inpaintedResultSrc && currentImageSrc && (
                  <ImageComparisonSlider
                    originalSrc={currentImageSrc}
                    inpaintedSrc={inpaintedResultSrc}
                    originalLabel="Original Source"
                    inpaintedLabel="Qwen 2.1 Inpainted"
                  />
                )}

                {activeOutputTab === 'mask' && currentMaskSrc && (
                  <div className="relative w-full h-full bg-black flex items-center justify-center p-4">
                    <img
                      src={currentMaskSrc}
                      alt="Inpainting Mask"
                      className="w-full h-full object-contain filter invert-0"
                    />
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-slate-900/80 backdrop-blur rounded text-[11px] font-mono text-slate-300">
                      Binary Mask (White = Regenerate, Black = Retain)
                    </div>
                  </div>
                )}

                {/* Overlaid watermark / model badge */}
                {inpaintedResultSrc && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur border border-slate-800 text-[11px] font-mono text-slate-300 pointer-events-none">
                    Qwen 2.1 · Spatial DiT
                  </div>
                )}
              </div>

              {/* Iterative Inpaint Action */}
              {inpaintedResultSrc && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-orange-50/60 dark:bg-orange-950/20 rounded-lg border border-orange-200/50 dark:border-orange-900/40 text-xs">
                  <span className="text-orange-900 dark:text-orange-300">
                    Want to edit another section? Send this result back to canvas:
                  </span>
                  <button
                    type="button"
                    onClick={handleSendToCanvas}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Send to Input Canvas</span>
                  </button>
                </div>
              )}

              {/* Gradio Progress & Terminal Logs */}
              <GradioProgressConsole
                isProcessing={isProcessing}
                progress={progress}
                currentStep={currentStep}
                totalSteps={steps}
                stepMessage={stepMessage}
                logs={logs}
                telemetry={telemetry}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Examples, API, Model Specs, & Session History */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Section Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg w-fit text-xs font-medium">
            <button
              onClick={() => setActiveBottomTab('examples')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors ${
                activeBottomTab === 'examples'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Examples (gr.Examples)</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('specs')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors ${
                activeBottomTab === 'specs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-orange-500" />
              <span>Qwen 2.1 Model Card & Paper</span>
            </button>

            <button
              onClick={() => setActiveBottomTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors ${
                activeBottomTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              <span>Generations History ({history.length})</span>
            </button>
          </div>

          {/* TAB 1: Examples Gallery */}
          {activeBottomTab === 'examples' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Click any preset example below to load its image, mask coordinates, and prompt:</span>
                <span className="font-mono text-[11px]">6 curated benchmarks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {EXAMPLE_PRESETS.map((preset) => {
                  const isSelected = activePreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => loadExample(preset)}
                      className={`group cursor-pointer rounded-xl overflow-hidden border p-2 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-orange-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Thumbnail Canvas Generator */}
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <PresetThumbnail preset={preset} />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] text-white font-mono">
                            {preset.category}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                            {preset.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                            {preset.prompt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-mono">
                        <span>Steps: {preset.steps}</span>
                        <span>CFG: {preset.guidanceScale}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Model Architecture Card */}
          {activeBottomTab === 'specs' && <QwenModelSpecs />}

          {/* TAB 3: Generation History */}
          {activeBottomTab === 'history' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  No generations completed yet in this session. Run your first inpaint above!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="aspect-square bg-slate-950 overflow-hidden relative group">
                        <img
                          src={item.imageSrc}
                          alt={item.prompt}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setInpaintedResultSrc(item.imageSrc);
                              setCurrentImageSrc(item.originalSrc);
                              setCurrentMaskSrc(item.maskSrc);
                              setPrompt(item.prompt);
                              setSteps(item.steps);
                              setGuidanceScale(item.guidanceScale);
                              setSeed(item.seed);
                              setActiveOutputTab('slider');
                            }}
                            className="px-3 py-1.5 rounded-md bg-orange-600 text-white text-xs font-medium shadow hover:bg-orange-700"
                          >
                            Compare
                          </button>
                        </div>
                      </div>

                      <div className="p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{item.timestamp}</span>
                          <span>Seed: {item.seed}</span>
                        </div>
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-300 font-medium">
                          {item.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Gradio API Code Modal */}
      <GradioApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}

// Preset Thumbnail Renderer Component
function PresetThumbnail({ preset }: { preset: ExamplePreset }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    preset.render(ctx, 320, 180);
    // Draw subtle mask outline
    ctx.strokeStyle = 'rgba(255, 120, 20, 0.8)';
    ctx.lineWidth = 2;
    const rx = preset.maskRect.x * 320;
    const ry = preset.maskRect.y * 180;
    const rw = preset.maskRect.width * 320;
    const rh = preset.maskRect.height * 180;
    if (preset.maskRect.shape === 'circle') {
      ctx.beginPath();
      ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }, [preset]);

  return <canvas ref={canvasRef} width={320} height={180} className="w-full h-full object-cover" />;
}
