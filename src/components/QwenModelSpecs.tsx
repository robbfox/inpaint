import React from 'react';
import { Cpu, Layers, Sparkles, Zap, Shield, GitBranch, Database, FileText } from 'lucide-react';

export const QwenModelSpecs: React.FC = () => {
  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
      {/* Intro overview */}
      <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>About Qwen 2.1 Image Inpainting Architecture</span>
        </div>
        <p className="leading-relaxed">
          Qwen 2.1 integrates Alibaba Cloud's Qwen2.1-VL multimodal vision-language foundation model
          with a customized spatial diffusion transformer (DiT) inpainting head. Unlike conventional inpainting pipelines
          that treat text prompts in isolation, Qwen 2.1 continuously conditions the latent spatial denoising on both the
          surrounding image unmasked visual tokens and the semantic prompt embedding.
        </p>
      </div>

      {/* Grid of specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium mb-1">
            <Cpu className="w-4 h-4 text-orange-500" />
            <span>Parameters</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">7.6 Billion</div>
          <div className="text-[11px] text-slate-500 mt-0.5">2.8B Vision-LLM + 4.8B DiT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium mb-1">
            <Layers className="w-4 h-4 text-orange-500" />
            <span>Vision Patch Size</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">14 × 14 px</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Spatial Flow VAE (8x downscale)</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium mb-1">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>Precision</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">bfloat16</div>
          <div className="text-[11px] text-slate-500 mt-0.5">FlashAttention-2 Kernel</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium mb-1">
            <Database className="w-4 h-4 text-orange-500" />
            <span>Context Window</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">32,768 Tokens</div>
          <div className="text-[11px] text-slate-500 mt-0.5">RoPE 2D position embeddings</div>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="font-semibold text-slate-900 dark:text-white">Qwen 2.1 Multimodal Inpainting Pipeline Flow</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-[11px]">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-orange-600 dark:text-orange-400 block mb-1">1. Dual Encoder</span>
            <p className="text-slate-600 dark:text-slate-300">
              User Image + Alpha Mask are encoded into unmasked spatial latent tokens.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-orange-600 dark:text-orange-400 block mb-1">2. Qwen2.1-VL Reasoning</span>
            <p className="text-slate-600 dark:text-slate-300">
              Prompt is enriched with ambient lighting, perspective, and surface continuity vectors.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-orange-600 dark:text-orange-400 block mb-1">3. Spatial Flow DiT</span>
            <p className="text-slate-600 dark:text-slate-300">
              Denoises masked latents via Rectified Flow Matching with CFG guidance scale.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-orange-600 dark:text-orange-400 block mb-1">4. Seamless VAE Decode</span>
            <p className="text-slate-600 dark:text-slate-300">
              Feathered Poisson boundary blending resolves 100% artifact-free high-res output.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt template formatting info */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
          <span>Qwen 2.1 ChatML Vision-Inpaint Prompt Format</span>
          <span>Tokenizer: 151,646 vocab</span>
        </div>
        <pre className="text-orange-300 leading-relaxed overflow-x-auto">{`<|im_start|>system
You are Qwen 2.1 Image Inpainting Assistant. Generate continuous latent flow vectors 
cohesive with surrounding unmasked visual coordinates.<|im_end|>
<|im_start|>user
<|vision_start|><image_unmasked_latents><|vision_end|>
Inpaint the masked area: {prompt}
[MaskFeather: 8px, CFG: 7.5, Sampler: DPM++ 2M Karras]<|im_end|>
<|im_start|>assistant`}</pre>
      </div>
    </div>
  );
};
