import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight, ZoomIn } from 'lucide-react';

interface ImageComparisonSliderProps {
  originalSrc: string;
  inpaintedSrc: string;
  aspectRatio?: string;
  originalLabel?: string;
  inpaintedLabel?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalSrc,
  inpaintedSrc,
  originalLabel = 'Original',
  inpaintedLabel = 'Qwen 2.1 Inpainted',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full aspect-square max-h-[540px] bg-slate-950 rounded-xl overflow-hidden select-none border border-slate-300 dark:border-slate-800 shadow-inner cursor-ew-resize group"
    >
      {/* 1. Underlying: Inpainted image (Right side) */}
      <img
        src={inpaintedSrc}
        alt="Inpainted"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* 2. Top layer: Original image, clipped to slider position */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={originalSrc}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain max-w-none pointer-events-none"
          style={{ width: containerRef.current?.clientWidth || '100%' }}
        />
      </div>

      {/* Divider line & handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.7)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Circular grip */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-black/20 transition-transform group-hover:scale-110">
          <ChevronsLeftRight className="w-4 h-4" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/70 backdrop-blur-md border border-slate-700 text-white text-[11px] font-mono pointer-events-none">
        {originalLabel}
      </div>

      <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-orange-950/75 backdrop-blur-md border border-orange-700/80 text-orange-200 text-[11px] font-mono pointer-events-none">
        {inpaintedLabel}
      </div>

      {/* Instruction indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-slate-300 text-[10px] pointer-events-none flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <ChevronsLeftRight className="w-3 h-3 text-orange-400" />
        <span>Drag to compare original vs Qwen 2.1 inpaint</span>
      </div>
    </div>
  );
};
