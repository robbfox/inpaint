import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, ExternalLink } from 'lucide-react';

interface GradioApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GradioApiModal: React.FC<GradioApiModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'python' | 'curl' | 'js'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonCode = `from gradio_client import Client, handle_file

# Initialize Qwen 2.1 Gradio Inpainting client
client = Client("Qwen/Qwen2.1-Image-Inpaint")

result = client.predict(
    image=handle_file("path/to/input.png"),
    mask=handle_file("path/to/mask.png"),
    prompt="A glowing cyan holographic HUD visor with telemetry reflections",
    negative_prompt="blurry, distorted, artifacts, bad anatomy",
    num_inference_steps=30,
    guidance_scale=7.5,
    mask_blur=8,
    seed=42,
    api_name="/inpaint"
)

print("Inpainted output image saved to:", result)
`;

  const curlCode = `curl -X POST "https://qwen-qwen2-1-image-inpaint.hf.space/gradio_api/call/inpaint" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": [
      {"path": "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"},
      "A futuristic flying cyber transport hovercraft",
      "blurry, low quality",
      30,
      7.5,
      42
    ]
  }'
`;

  const jsCode = `import { Client } from "@gradio/client";

const client = await Client.connect("Qwen/Qwen2.1-Image-Inpaint");
const result = await client.predict("/inpaint", { 
  image: imageFileBlob,
  prompt: "A vintage brass analog camera sitting on the oak table",
  steps: 30,
  guidance_scale: 7.5
});

console.log("Inpainted image URL:", result.data);
`;

  const currentCode = activeTab === 'python' ? pythonCode : activeTab === 'curl' ? curlCode : jsCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-base">Gradio Client API Documentation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use this Gradio Space as a REST API or invoke it directly from Python, cURL, or JavaScript
            with the official <code className="text-orange-500 font-mono">gradio_client</code> library.
          </p>

          {/* Language selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('python')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'python'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Python (gradio_client)
              </button>
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'curl'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                cURL (Bash)
              </button>
              <button
                onClick={() => setActiveTab('js')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'js'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                JavaScript SDK
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code display */}
          <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
            <pre className="leading-relaxed">{currentCode}</pre>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Model Endpoint: /gradio_api/call/inpaint</span>
            <span className="font-mono">Payload: multipart/form-data</span>
          </div>
        </div>
      </div>
    </div>
  );
};
