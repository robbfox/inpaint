import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Cpu, Activity, Clock } from 'lucide-react';

interface GradioProgressConsoleProps {
  isProcessing: boolean;
  progress: number; // 0 - 100
  currentStep: number;
  totalSteps: number;
  stepMessage?: string;
  logs: string[];
  telemetry?: {
    inferenceTimeMs?: number;
    stepsCompleted?: number;
    guidanceScale?: number;
    sampler?: string;
    seed?: number;
    vramUsed?: string;
    visionAnalysis?: string;
    model?: string;
  } | null;
}

export const GradioProgressConsole: React.FC<GradioProgressConsoleProps> = ({
  isProcessing,
  progress,
  currentStep,
  totalSteps,
  stepMessage,
  logs,
  telemetry,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-800 text-slate-300 overflow-hidden text-xs font-mono shadow-sm">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-semibold text-slate-200">Qwen 2.1 DiT Runtime</span>
          {isProcessing ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Inferencing
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Idle
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {telemetry?.inferenceTimeMs && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{(telemetry.inferenceTimeMs / 1000).toFixed(2)}s</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>14.2 GB VRAM</span>
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>{isOpen ? 'Hide Logs' : 'View Logs'}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Live Progress Bar when processing */}
      {isProcessing && (
        <div className="p-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-orange-400 font-medium">
              {stepMessage || `Denoising step ${currentStep}/${totalSteps}...`}
            </span>
            <span className="text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
            <span>Sampler: DPM++ 2M Karras (Qwen 2.1 Spatial DiT)</span>
            <span>it/s: ~16.8</span>
          </div>
        </div>
      )}

      {/* Expandable Console Logs */}
      {isOpen && (
        <div className="p-3 bg-slate-950/95 max-h-48 overflow-y-auto space-y-1 text-[11px] border-t border-slate-800/80">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic">No execution events yet. Draw a mask and click Generate.</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-slate-400 mr-2">[{new Date().toLocaleTimeString()}]</span>
                <span
                  className={
                    log.includes('Vision Context')
                      ? 'text-cyan-400'
                      : log.includes('Denoising')
                      ? 'text-orange-300'
                      : log.includes('complete') || log.includes('decoded')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }
                >
                  {log}
                </span>
              </div>
            ))
          )}

          {telemetry?.visionAnalysis && (
            <div className="p-2 mt-2 bg-cyan-950/40 rounded border border-cyan-800/40 text-cyan-200 text-[11px]">
              <span className="font-semibold block mb-0.5">🧠 Qwen 2.1 Multimodal Visual Context:</span>
              <p className="text-cyan-300/90">{telemetry.visionAnalysis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
