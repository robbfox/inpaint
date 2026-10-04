import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Sparkles,
  Layers,
} from 'lucide-react';

interface GradioCanvasProps {
  imageSrc: string | null;
  maskDataUrl: string | null;
  onImageChange: (dataUrl: string) => void;
  onMaskChange: (maskUrl: string | null) => void;
  isProcessing?: boolean;
}

export const GradioCanvas: React.FC<GradioCanvasProps> = ({
  imageSrc,
  maskDataUrl,
  onImageChange,
  onMaskChange,
  isProcessing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Brush settings
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(36);
  const [maskViewMode, setMaskViewMode] = useState<'overlay' | 'binary' | 'hidden'>('overlay');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Undo / Redo history for mask strokes
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Dimensions
  const [canvasDim, setCanvasDim] = useState<{ width: number; height: number }>({ width: 768, height: 768 });

  // Save current mask state to history
  const pushHistory = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, imgData].slice(-15); // keep last 15
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 14));

    // Export mask to parent
    onMaskChange(maskCanvas.toDataURL('image/png'));
  }, [historyIndex, onMaskChange]);

  // Load and render base image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 768;
      const h = img.naturalHeight || 768;
      setCanvasDim({ width: w, height: h });

      const baseCanvas = baseCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const cursorCanvas = cursorCanvasRef.current;

      if (baseCanvas && maskCanvas && cursorCanvas) {
        baseCanvas.width = w;
        baseCanvas.height = h;
        maskCanvas.width = w;
        maskCanvas.height = h;
        cursorCanvas.width = w;
        cursorCanvas.height = h;

        const baseCtx = baseCanvas.getContext('2d');
        if (baseCtx) {
          baseCtx.clearRect(0, 0, w, h);
          baseCtx.drawImage(img, 0, 0, w, h);
        }

        // If external mask data is supplied (e.g. from preset), render it
        if (maskDataUrl) {
          const mImg = new Image();
          mImg.crossOrigin = 'anonymous';
          mImg.onload = () => {
            const mCtx = maskCanvas.getContext('2d');
            if (mCtx) {
              mCtx.clearRect(0, 0, w, h);
              mCtx.drawImage(mImg, 0, 0, w, h);
              const initialData = mCtx.getImageData(0, 0, w, h);
              setHistory([initialData]);
              setHistoryIndex(0);
            }
          };
          mImg.src = maskDataUrl;
        } else {
          // fresh empty mask
          const mCtx = maskCanvas.getContext('2d');
          if (mCtx) {
            mCtx.clearRect(0, 0, w, h);
            const emptyData = mCtx.getImageData(0, 0, w, h);
            setHistory([emptyData]);
            setHistoryIndex(0);
          }
        }
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // When external maskDataUrl changes independently (e.g. preset selection)
  useEffect(() => {
    if (!maskDataUrl || !maskCanvasRef.current) return;
    const mImg = new Image();
    mImg.crossOrigin = 'anonymous';
    mImg.onload = () => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        mCtx.drawImage(mImg, 0, 0, maskCanvas.width, maskCanvas.height);
        const data = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        setHistory([data]);
        setHistoryIndex(0);
      }
    };
    mImg.src = maskDataUrl;
  }, [maskDataUrl]);

  // Undo / Redo actions
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(history[nextIndex], 0, 0);
          setHistoryIndex(nextIndex);
          onMaskChange(maskCanvas.toDataURL('image/png'));
        }
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(history[nextIndex], 0, 0);
          setHistoryIndex(nextIndex);
          onMaskChange(maskCanvas.toDataURL('image/png'));
        }
      }
    }
  };

  const handleClearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      const ctx = maskCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        pushHistory();
      }
    }
  };

  const handleInvertMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      // Invert: if alpha > 0, make transparent, else make white solid
      if (alpha > 20) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    pushHistory();
  };

  const handleAutoCenterMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const w = maskCanvas.width;
    const h = maskCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, w * 0.22, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    pushHistory();
  };

  // Canvas drawing coordinate calculations
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawBrushCursor = (x: number, y: number) => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas) return;
    const ctx = cursorCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    ctx.strokeStyle = tool === 'brush' ? 'rgba(234, 88, 12, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    ctx.fillStyle = tool === 'brush' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(239, 68, 68, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isProcessing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPoint(pt);

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    drawBrushCursor(pt.x, pt.y);

    if (!isDrawing || !lastPoint || isProcessing) return;

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    setLastPoint(pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      pushHistory();
    }
  };

  const handlePointerLeave = () => {
    const cursorCanvas = cursorCanvasRef.current;
    if (cursorCanvas) {
      const ctx = cursorCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    }
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        onImageChange(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Gradio Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/70 text-xs">
        {/* Tool selectors */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool('brush')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              tool === 'brush'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Brush (Paint Mask)"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Brush</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              tool === 'eraser'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Eraser (Erase Mask)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 dark:text-slate-400 font-mono">Size:</span>
          <input
            type="range"
            min="6"
            max="110"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 sm:w-28 accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <span className="font-mono text-slate-800 dark:text-slate-200 w-7 text-right">{brushSize}px</span>

          {/* Quick preset buttons */}
          <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-slate-200 dark:border-slate-700 pl-1.5">
            {[15, 35, 65].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBrushSize(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  brushSize === s
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Mask Actions & View Modes */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo stroke"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo stroke"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={handleAutoCenterMask}
            className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-400 text-[11px] font-medium transition-colors"
            title="Select Center Subject"
          >
            Auto Subject
          </button>

          <button
            type="button"
            onClick={handleInvertMask}
            className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-400 text-[11px] font-medium transition-colors"
            title="Invert mask area"
          >
            Invert
          </button>

          <button
            type="button"
            onClick={handleClearMask}
            className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Clear all mask"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Mask view mode */}
          <button
            type="button"
            onClick={() => {
              if (maskViewMode === 'overlay') setMaskViewMode('binary');
              else if (maskViewMode === 'binary') setMaskViewMode('hidden');
              else setMaskViewMode('overlay');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-orange-500 text-[11px] font-medium"
            title="Toggle mask visual overlay (Tint / B&W / Hide)"
          >
            {maskViewMode === 'hidden' ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-orange-500" />}
            <span className="capitalize">{maskViewMode}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square max-h-[540px] bg-slate-950 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner flex items-center justify-center select-none"
      >
        {/* Layer 1: Base image canvas */}
        <canvas
          ref={baseCanvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Layer 2: Mask Canvas */}
        <canvas
          ref={maskCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className={`absolute inset-0 w-full h-full object-contain cursor-crosshair touch-none ${
            maskViewMode === 'overlay'
              ? 'opacity-65 mix-blend-screen [filter:hue-rotate(330deg)_saturate(5)]'
              : maskViewMode === 'binary'
              ? 'opacity-95'
              : 'opacity-0 pointer-events-none'
          }`}
          style={
            maskViewMode === 'overlay'
              ? { filter: 'drop-shadow(0 0 4px rgba(255, 100, 20, 0.8))' }
              : undefined
          }
        />

        {/* Layer 3: Interactive brush cursor follower */}
        <canvas
          ref={cursorCanvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Empty state prompt */}
        {!imageSrc && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-slate-400">
            <Upload className="w-10 h-10 mb-2 text-orange-400" />
            <p className="font-medium text-slate-200">No Image Loaded</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Select an example below or upload your own image to begin inpainting with Qwen 2.1
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow transition-all"
            >
              Upload Image
            </button>
          </div>
        )}

        {/* In-canvas quick overlay controls */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300">
          <span>{canvasDim.width} × {canvasDim.height}px</span>
          <span className="text-slate-600">·</span>
          <span className="text-orange-400 font-mono">Qwen 2.1 DiT</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Canvas footer upload & reset */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom Image</span>
          </button>
          <span>Draw on the image to define masked inpaint area</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Canvas Ready</span>
        </div>
      </div>
    </div>
  );
};
