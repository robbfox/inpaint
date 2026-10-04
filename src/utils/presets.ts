/**
 * Presets and procedural image generators for Qwen 2.1 Gradio Inpainting Studio
 */

export interface ExamplePreset {
  id: string;
  title: string;
  category: string;
  prompt: string;
  negativePrompt: string;
  steps: number;
  guidanceScale: number;
  maskBlur: number;
  sampler: string;
  seed: number;
  maskRect: { x: number; y: number; width: number; height: number; shape?: 'rect' | 'circle' };
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  renderInpaintTarget: (ctx: CanvasRenderingContext2D, maskRect: any, prompt: string) => void;
}

export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    id: 'cyberpunk-alley',
    title: 'Cyberpunk Alley',
    category: 'Sci-Fi / Night',
    prompt: 'A sleek golden robotic companion walking along the wet asphalt, glowing blue LED highlights, reflections in puddles, cinematic bokeh',
    negativePrompt: 'blurry, low quality, distorted, extra limbs, cartoon, drawing, artifacts',
    steps: 32,
    guidanceScale: 8.0,
    maskBlur: 10,
    sampler: 'DPM++ 2M Karras',
    seed: 489201,
    maskRect: { x: 0.35, y: 0.52, width: 0.3, height: 0.36, shape: 'circle' },
    render: (ctx, w, h) => {
      // Dark moody cyberpunk street background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0a18');
      skyGrad.addColorStop(0.5, '#151528');
      skyGrad.addColorStop(1, '#08080f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant buildings & neon glows
      ctx.fillStyle = '#111222';
      ctx.fillRect(w * 0.05, h * 0.15, w * 0.25, h * 0.55);
      ctx.fillRect(w * 0.7, h * 0.1, w * 0.25, h * 0.6);

      // Neon vertical signs
      const cyanGlow = ctx.createLinearGradient(w * 0.12, h * 0.2, w * 0.12, h * 0.45);
      cyanGlow.addColorStop(0, '#00ffff');
      cyanGlow.addColorStop(1, '#0055ff');
      ctx.fillStyle = cyanGlow;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 25;
      ctx.fillRect(w * 0.14, h * 0.25, w * 0.03, h * 0.2);

      const magentaGlow = ctx.createLinearGradient(w * 0.8, h * 0.18, w * 0.8, h * 0.45);
      magentaGlow.addColorStop(0, '#ff007f');
      magentaGlow.addColorStop(1, '#ffaa00');
      ctx.fillStyle = magentaGlow;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 30;
      ctx.fillRect(w * 0.82, h * 0.2, w * 0.035, h * 0.25);
      ctx.shadowBlur = 0; // reset

      // Wet reflective asphalt street
      const streetGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      streetGrad.addColorStop(0, '#101018');
      streetGrad.addColorStop(1, '#06060c');
      ctx.fillStyle = streetGrad;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Neon puddle reflections
      ctx.fillStyle = 'rgba(0, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.85, w * 0.18, h * 0.04, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 0, 128, 0.16)';
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.82, w * 0.2, h * 0.05, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric steam / fog
      ctx.fillStyle = 'rgba(180, 210, 255, 0.04)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.3 + i * 0.1), h * (0.6 - i * 0.03), w * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    renderInpaintTarget: (ctx, maskRect, _prompt) => {
      const cx = maskRect.x + maskRect.width / 2;
      const cy = maskRect.y + maskRect.height / 2;
      const rx = maskRect.width * 0.38;
      const ry = maskRect.height * 0.32;

      // Contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + ry * 0.9, rx * 1.1, ry * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden robotic quad-ped / companion body
      const goldGrad = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
      goldGrad.addColorStop(0, '#ffe082');
      goldGrad.addColorStop(0.3, '#ffb300');
      goldGrad.addColorStop(0.7, '#ff8f00');
      goldGrad.addColorStop(1, '#c47d00');

      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sleek head unit
      ctx.beginPath();
      ctx.ellipse(cx + rx * 0.65, cy - ry * 0.35, rx * 0.45, ry * 0.4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Glowing blue LED visor / sensor strip
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx + rx * 0.75, cy - ry * 0.35, rx * 0.2, -0.4, 0.4);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Articulated legs
      ctx.strokeStyle = '#e0a000';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      // Front legs
      ctx.beginPath();
      ctx.moveTo(cx + rx * 0.4, cy + ry * 0.2);
      ctx.lineTo(cx + rx * 0.6, cy + ry * 0.85);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.4, cy + ry * 0.2);
      ctx.lineTo(cx - rx * 0.55, cy + ry * 0.85);
      ctx.stroke();

      // Neon rim light reflecting on wet asphalt
      ctx.fillStyle = 'rgba(255, 180, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + ry * 0.95, rx * 0.8, ry * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'cozy-coffee',
    title: 'Cozy Coffee House',
    category: 'Still Life / Warm',
    prompt: 'A vintage analog mechanical brass camera sitting on the rustic oak table, glass lens reflection, warm afternoon sunbeam, sharp intricate dials',
    negativePrompt: 'blurry, plastic, modern digital, distorted, low resolution',
    steps: 30,
    guidanceScale: 7.5,
    maskBlur: 8,
    sampler: 'Euler a',
    seed: 712940,
    maskRect: { x: 0.38, y: 0.42, width: 0.32, height: 0.35, shape: 'rect' },
    render: (ctx, w, h) => {
      // Warm rustic interior background
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      wallGrad.addColorStop(0, '#2d1e18');
      wallGrad.addColorStop(1, '#422c22');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h * 0.55);

      // Window light beam
      ctx.fillStyle = 'rgba(255, 230, 180, 0.12)';
      ctx.beginPath();
      ctx.moveTo(w * 0.1, 0);
      ctx.lineTo(w * 0.45, 0);
      ctx.lineTo(w * 0.9, h * 0.55);
      ctx.lineTo(w * 0.3, h * 0.55);
      ctx.closePath();
      ctx.fill();

      // Coffee cup on side
      ctx.fillStyle = '#f8f4eb';
      ctx.beginPath();
      ctx.ellipse(w * 0.2, h * 0.65, w * 0.08, h * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2010';
      ctx.beginPath();
      ctx.ellipse(w * 0.2, h * 0.64, w * 0.07, h * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rustic oak tabletop
      const woodGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      woodGrad.addColorStop(0, '#5a3d28');
      woodGrad.addColorStop(0.3, '#734e32');
      woodGrad.addColorStop(1, '#3e2716');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(50, 30, 15, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(0, h * 0.58 + i * h * 0.045);
        ctx.bezierCurveTo(w * 0.3, h * 0.57 + i * h * 0.045, w * 0.7, h * 0.6 + i * h * 0.045, w, h * 0.58 + i * h * 0.045);
        ctx.stroke();
      }
    },
    renderInpaintTarget: (ctx, maskRect, _prompt) => {
      const cx = maskRect.x + maskRect.width / 2;
      const cy = maskRect.y + maskRect.height / 2;
      const bw = maskRect.width * 0.85;
      const bh = maskRect.height * 0.55;

      // Soft shadow
      ctx.fillStyle = 'rgba(30, 15, 5, 0.55)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + bh * 0.58, bw * 0.55, bh * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Camera Brass body
      const brassGrad = ctx.createLinearGradient(cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2);
      brassGrad.addColorStop(0, '#cda851');
      brassGrad.addColorStop(0.5, '#e5c158');
      brassGrad.addColorStop(1, '#8b6914');
      ctx.fillStyle = brassGrad;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
      ctx.fill();

      // Black textured leather grip center
      ctx.fillStyle = '#222222';
      ctx.fillRect(cx - bw * 0.45, cy - bh * 0.2, bw * 0.9, bh * 0.55);

      // Large Circular Glass Lens with brass ring
      ctx.fillStyle = '#b8860b';
      ctx.beginPath();
      ctx.arc(cx, cy + bh * 0.05, bh * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Dark optics glass
      const lensGrad = ctx.createRadialGradient(cx - bh * 0.1, cy - bh * 0.05, 2, cx, cy + bh * 0.05, bh * 0.38);
      lensGrad.addColorStop(0, '#102030');
      lensGrad.addColorStop(0.7, '#080d14');
      lensGrad.addColorStop(1, '#000000');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(cx, cy + bh * 0.05, bh * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Lens blue anti-reflective coating highlight
      ctx.strokeStyle = 'rgba(80, 180, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + bh * 0.05, bh * 0.3, -1.2, -0.2);
      ctx.stroke();

      // Top dials and viewfinder
      ctx.fillStyle = '#e5c158';
      ctx.fillRect(cx - bw * 0.35, cy - bh * 0.72, bw * 0.18, bh * 0.25); // shutter knob
      ctx.fillRect(cx + bw * 0.18, cy - bh * 0.68, bw * 0.15, bh * 0.2); // ISO dial
      ctx.fillRect(cx - bw * 0.05, cy - bh * 0.65, bw * 0.2, bh * 0.18); // rangefinder prism
    },
  },
  {
    id: 'scenic-lake',
    title: 'Alpine Mountain Lake',
    category: 'Nature / Landscape',
    prompt: 'A vibrant hot air balloon with rainbow patterned stripes floating in the morning sky, crisp alpine mountain reflection, misty sunlight',
    negativePrompt: 'airplane, birds, low quality, artifacts, blurred sky',
    steps: 28,
    guidanceScale: 7.0,
    maskBlur: 12,
    sampler: 'DPM++ 2M Karras',
    seed: 391827,
    maskRect: { x: 0.36, y: 0.12, width: 0.28, height: 0.38, shape: 'circle' },
    render: (ctx, w, h) => {
      // Crisp alpine sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      skyGrad.addColorStop(0, '#6898c8');
      skyGrad.addColorStop(0.5, '#a4c7e8');
      skyGrad.addColorStop(1, '#fde8cd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.55);

      // Distant rugged mountains
      ctx.fillStyle = '#4a5b6c';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48);
      ctx.lineTo(w * 0.18, h * 0.26);
      ctx.lineTo(w * 0.35, h * 0.42);
      ctx.lineTo(w * 0.58, h * 0.22);
      ctx.lineTo(w * 0.8, h * 0.38);
      ctx.lineTo(w, h * 0.28);
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(0, h * 0.55);
      ctx.closePath();
      ctx.fill();

      // Snow peaks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.26);
      ctx.lineTo(w * 0.24, h * 0.32);
      ctx.lineTo(w * 0.14, h * 0.34);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.22);
      ctx.lineTo(w * 0.65, h * 0.3);
      ctx.lineTo(w * 0.52, h * 0.32);
      ctx.closePath();
      ctx.fill();

      // Pine tree line
      ctx.fillStyle = '#22382a';
      ctx.fillRect(0, h * 0.48, w, h * 0.08);

      // Mirror lake
      const lakeGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      lakeGrad.addColorStop(0, '#355c70');
      lakeGrad.addColorStop(0.5, '#2b4d5e');
      lakeGrad.addColorStop(1, '#1b3440');
      ctx.fillStyle = lakeGrad;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      // Soft water ripples
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const y = h * 0.6 + i * (h * 0.03);
        ctx.beginPath();
        ctx.moveTo(w * (0.2 + (i % 3) * 0.1), y);
        ctx.lineTo(w * (0.6 + (i % 4) * 0.08), y);
        ctx.stroke();
      }
    },
    renderInpaintTarget: (ctx, maskRect, _prompt) => {
      const cx = maskRect.x + maskRect.width / 2;
      const cy = maskRect.y + maskRect.height * 0.42;
      const r = maskRect.width * 0.38;

      // Balloon teardrop envelope
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0, false);
      ctx.bezierCurveTo(cx + r, cy + r * 0.8, cx + r * 0.35, cy + r * 1.35, cx + r * 0.25, cy + r * 1.5);
      ctx.lineTo(cx - r * 0.25, cy + r * 1.5);
      ctx.bezierCurveTo(cx - r * 0.35, cy + r * 1.35, cx - r, cy + r * 0.8, cx - r, cy);
      ctx.closePath();
      ctx.clip();

      // Rainbow vertical stripes
      const colors = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
      const stripeW = (r * 2) / colors.length;
      for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(cx - r + i * stripeW, cy - r, stripeW, r * 2.6);
      }
      ctx.restore();

      // Ropes and wicker basket
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.2, cy + r * 1.5);
      ctx.lineTo(cx - r * 0.12, cy + r * 1.78);
      ctx.moveTo(cx + r * 0.2, cy + r * 1.5);
      ctx.lineTo(cx + r * 0.12, cy + r * 1.78);
      ctx.stroke();

      // Wicker basket
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(cx - r * 0.14, cy + r * 1.78, r * 0.28, r * 0.18);

      // Lake reflection of balloon
      ctx.fillStyle = 'rgba(230, 80, 50, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 3.8, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'astronaut-hud',
    title: 'Space Voyager Helmet',
    category: 'Sci-Fi / Character',
    prompt: 'A luminous cyan holographic HUD visor showing orbital star charts and telemetry readings, sharp glass reflections, deep cosmic nebula reflections',
    negativePrompt: 'cracked glass, dirty, blur, low quality, pixelated',
    steps: 35,
    guidanceScale: 8.5,
    maskBlur: 8,
    sampler: 'Euler a',
    seed: 820194,
    maskRect: { x: 0.32, y: 0.26, width: 0.36, height: 0.38, shape: 'circle' },
    render: (ctx, w, h) => {
      // Space background with stars
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, w, h);

      // Deep space nebula
      const neb = ctx.createRadialGradient(w * 0.8, h * 0.2, 10, w * 0.8, h * 0.2, w * 0.4);
      neb.addColorStop(0, 'rgba(150, 40, 200, 0.3)');
      neb.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);

      // Distant stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 73) % w;
        const sy = (i * 97) % (h * 0.5);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Astronaut suit shoulders & collar
      ctx.fillStyle = '#d0d4dc';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.88, w * 0.42, h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // White helmet shell outline
      ctx.fillStyle = '#e8ecf4';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, w * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Blank gold/dark visor placeholder before inpainting
      ctx.fillStyle = '#181b22';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
    },
    renderInpaintTarget: (ctx, maskRect, _prompt) => {
      const cx = maskRect.x + maskRect.width / 2;
      const cy = maskRect.y + maskRect.height / 2;
      const r = maskRect.width * 0.45;

      // Dark glossy curved visor
      const visorGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 10, cx, cy, r);
      visorGrad.addColorStop(0, '#0c2233');
      visorGrad.addColorStop(0.7, '#040b12');
      visorGrad.addColorStop(1, '#020508');
      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Cyan HUD graphics
      ctx.strokeStyle = '#00f6ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f6ff';
      ctx.shadowBlur = 12;

      // Reticle circle
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // HUD crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.7, cy);
      ctx.lineTo(cx - r * 0.5, cy);
      ctx.moveTo(cx + r * 0.5, cy);
      ctx.lineTo(cx + r * 0.7, cy);
      ctx.stroke();

      // Pitch ladder / artificial horizon
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - r * 0.3, cy - r * 0.2, r * 0.6, r * 0.1);
      ctx.strokeRect(cx - r * 0.2, cy + r * 0.15, r * 0.4, r * 0.08);

      // Visor curvature reflection sheen
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.85, -1.8, -0.8);
      ctx.stroke();
    },
  },
  {
    id: 'zen-garden',
    title: 'Japanese Zen Garden',
    category: 'Architecture / Serene',
    prompt: 'A traditional carved stone toro lantern with moss accents and a gentle warm interior candle flicker, raked gravel patterns',
    negativePrompt: 'modern, plastic, bright neon, cluttered, distorted',
    steps: 30,
    guidanceScale: 7.2,
    maskBlur: 8,
    sampler: 'UniPC',
    seed: 519284,
    maskRect: { x: 0.38, y: 0.38, width: 0.28, height: 0.46, shape: 'rect' },
    render: (ctx, w, h) => {
      // Bamboo fence backdrop
      ctx.fillStyle = '#8b7d5a';
      ctx.fillRect(0, 0, w, h * 0.45);
      ctx.strokeStyle = '#5a4d33';
      ctx.lineWidth = 3;
      for (let i = 0; i < 25; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (w / 24), 0);
        ctx.lineTo(i * (w / 24), h * 0.45);
        ctx.stroke();
      }

      // Maple branch top right
      ctx.fillStyle = '#b71c1c';
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.75 + (i % 5) * 25, h * 0.1 + Math.floor(i / 5) * 20, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Raked stone gravel ground
      ctx.fillStyle = '#cfd3d8';
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      // Concentric raked ripples
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      for (let r = 20; r < 240; r += 24) {
        ctx.beginPath();
        ctx.ellipse(w * 0.52, h * 0.75, r * 1.5, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    renderInpaintTarget: (ctx, maskRect, _prompt) => {
      const cx = maskRect.x + maskRect.width / 2;
      const cy = maskRect.y + maskRect.height / 2;
      const bw = maskRect.width * 0.65;
      const bh = maskRect.height * 0.85;

      // Ground shadow
      ctx.fillStyle = 'rgba(70, 75, 80, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + bh * 0.48, bw * 0.8, bh * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Granite stone texture
      ctx.fillStyle = '#6b7280';
      // Base pedestal
      ctx.fillRect(cx - bw * 0.35, cy + bh * 0.32, bw * 0.7, bh * 0.15);
      // Central pillar
      ctx.fillRect(cx - bw * 0.2, cy - bh * 0.1, bw * 0.4, bh * 0.45);

      // Light chamber with warm glow
      ctx.fillStyle = '#fff8e1';
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 20;
      ctx.fillRect(cx - bw * 0.3, cy - bh * 0.28, bw * 0.6, bh * 0.2);
      ctx.shadowBlur = 0;

      // Stone lattice window bars
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(cx - bw * 0.1, cy - bh * 0.28, bw * 0.2, bh * 0.2);

      // Flared pagoda stone roof
      ctx.beginPath();
      ctx.moveTo(cx, cy - bh * 0.52);
      ctx.lineTo(cx + bw * 0.55, cy - bh * 0.3);
      ctx.lineTo(cx - bw * 0.55, cy - bh * 0.3);
      ctx.closePath();
      ctx.fill();

      // Moss patch
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.ellipse(cx - bw * 0.15, cy - bh * 0.32, bw * 0.18, bh * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'scandinavian-loft',
    title: 'Scandinavian Living Space',
    category: 'Interior / Design',
    prompt: 'A lush potted fiddle-leaf fig tree in a modern white fluted ceramic planter, sunlight casting leafy shadow patterns on hardwood floor',
    negativePrompt: 'wilted, dying, fake plastic, dark, distorted',
    steps: 30,
    guidanceScale: 7.5,
    maskBlur: 8,
    sampler: 'DPM++ 2M Karras',
    seed: 639102,
    maskRect: { x: 0.35, y: 0.25, width: 0.34, height: 0.62, shape: 'rect' },
    render: (ctx, w, h) => {
      // Clean off-white wall
      ctx.fillStyle = '#f3f2ee';
      ctx.fillRect(0, 0, w, h * 0.65);

      // Large modern window frame on left
      ctx.fillStyle = '#e6e5e0';
      ctx.fillRect(0, 0, w * 0.22, h * 0.65);
      ctx.fillStyle = '#2b2a28';
      ctx.lineWidth = 4;
      ctx.strokeRect(w * 0.02, h * 0.05, w * 0.18, h * 0.55);

      // Minimalist sofa piece on right
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.roundRect(w * 0.72, h * 0.42, w * 0.28, h * 0.23, [12, 0, 0, 0]);
      ctx.fill();

      // Light oak herringbone flooring
      const floorGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      floorGrad.addColorStop(0, '#d6c4a8');
      floorGrad.addColorStop(1, '#bba689');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Planks
      ctx.strokeStyle = 'rgba(120, 95, 65, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, h * 0.68 + i * 22);
        ctx.lineTo(w, h * 0.68 + i * 22);
        ctx.stroke();
      }
    },
    renderInpaintTarget: (ctx, maskRect, _prompt) => {
      const cx = maskRect.x + maskRect.width / 2;
      const cy = maskRect.y + maskRect.height / 2;
      const pw = maskRect.width * 0.45;
      const ph = maskRect.height * 0.32;

      // Tree shadow on floor
      ctx.fillStyle = 'rgba(70, 50, 30, 0.28)';
      ctx.beginPath();
      ctx.ellipse(cx + pw * 0.2, cy + ph * 1.35, pw * 0.8, ph * 0.22, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Fluted white ceramic pot
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.roundRect(cx - pw / 2, cy + ph * 0.45, pw, ph * 0.85, [4, 4, 12, 12]);
      ctx.fill();

      // Pot fluting grooves
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * (pw * 0.12), cy + ph * 0.45);
        ctx.lineTo(cx + i * (pw * 0.12), cy + ph * 1.3);
        ctx.stroke();
      }

      // Wooden trunk
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + ph * 0.45);
      ctx.quadraticCurveTo(cx - pw * 0.15, cy - ph * 0.1, cx, cy - ph * 0.7);
      ctx.stroke();

      // Lush green leaves (Fiddle leaf fig)
      const leaves = [
        { x: cx - pw * 0.4, y: cy - ph * 0.5, r: pw * 0.35, rot: -0.4 },
        { x: cx + pw * 0.35, y: cy - ph * 0.4, r: pw * 0.38, rot: 0.3 },
        { x: cx - pw * 0.2, y: cy - ph * 0.85, r: pw * 0.42, rot: -0.2 },
        { x: cx + pw * 0.25, y: cy - ph * 0.8, r: pw * 0.36, rot: 0.2 },
        { x: cx, y: cy - ph * 1.15, r: pw * 0.45, rot: 0 },
      ];

      for (const l of leaves) {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.ellipse(0, 0, l.r, l.r * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leaf vein
        ctx.strokeStyle = '#66bb6a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, l.r * 1.3);
        ctx.lineTo(0, -l.r * 1.3);
        ctx.stroke();
        ctx.restore();
      }
    },
  },
];

/**
 * Render a preset image onto a newly created data URL
 */
export function generatePresetImage(preset: ExamplePreset, width = 768, height = 768): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  preset.render(ctx, width, height);
  return canvas.toDataURL('image/png');
}

/**
 * Generate the preset's pre-configured mask image as a data URL
 */
export function generatePresetMask(preset: ExamplePreset, width = 768, height = 768): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transparent background
  ctx.clearRect(0, 0, width, height);

  // Mask in pure white (standard inpainting mask)
  ctx.fillStyle = '#ffffff';

  const rx = preset.maskRect.x * width;
  const ry = preset.maskRect.y * height;
  const rw = preset.maskRect.width * width;
  const rh = preset.maskRect.height * height;

  if (preset.maskRect.shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 16);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generates an inpainting synthesis result image combining the base image,
 * blurred mask edge blending, and the generated target content.
 */
export function synthesizeInpaintedImage(
  baseImage: HTMLImageElement,
  maskImage: HTMLImageElement | null,
  preset: ExamplePreset | null,
  prompt: string,
  maskBlur: number = 8
): string {
  const width = baseImage.naturalWidth || 768;
  const height = baseImage.naturalHeight || 768;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw base image
  ctx.drawImage(baseImage, 0, 0, width, height);

  // 2. Render target inpainting content into a separate buffer
  const inpaintCanvas = document.createElement('canvas');
  inpaintCanvas.width = width;
  inpaintCanvas.height = height;
  const inpaintCtx = inpaintCanvas.getContext('2d')!;

  // Copy base image into inpaint buffer
  inpaintCtx.drawImage(baseImage, 0, 0, width, height);

  // If a preset renderer is available, execute it
  if (preset) {
    const rx = preset.maskRect.x * width;
    const ry = preset.maskRect.y * height;
    const rw = preset.maskRect.width * width;
    const rh = preset.maskRect.height * height;
    preset.renderInpaintTarget(inpaintCtx, { x: rx, y: ry, width: rw, height: rh }, prompt);
  } else {
    // Custom uploaded image inpaint: synthesize stylized content in masked bounds
    // We compute the bounding box of the mask
    inpaintCtx.save();
    inpaintCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    // create rich procedural contextual texture based on prompt
    const hash = Array.from(prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 37) % 360;

    const grad = inpaintCtx.createLinearGradient(width * 0.3, height * 0.3, width * 0.7, height * 0.7);
    grad.addColorStop(0, `hsl(${hue}, 70%, 55%)`);
    grad.addColorStop(0.5, `hsl(${(hue + 45) % 360}, 65%, 45%)`);
    grad.addColorStop(1, `hsl(${(hue + 90) % 360}, 80%, 30%)`);
    inpaintCtx.fillStyle = grad;

    // Draw stylized artistic subject
    inpaintCtx.beginPath();
    inpaintCtx.ellipse(width * 0.5, height * 0.5, width * 0.2, height * 0.18, 0, 0, Math.PI * 2);
    inpaintCtx.fill();

    inpaintCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    inpaintCtx.beginPath();
    inpaintCtx.ellipse(width * 0.48, height * 0.46, width * 0.12, height * 0.08, -0.2, 0, Math.PI * 2);
    inpaintCtx.fill();
    inpaintCtx.restore();
  }

  // 3. Mask blending: if mask is present, blend inpaintCanvas into ctx using blurred mask
  if (maskImage) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d')!;

    if (maskBlur > 0) {
      maskCtx.filter = `blur(${maskBlur}px)`;
    }
    maskCtx.drawImage(maskImage, 0, 0, width, height);
    maskCtx.filter = 'none';

    // Mask composite
    const maskedInpaintCanvas = document.createElement('canvas');
    maskedInpaintCanvas.width = width;
    maskedInpaintCanvas.height = height;
    const mCtx = maskedInpaintCanvas.getContext('2d')!;

    // Draw the inpaint result
    mCtx.drawImage(inpaintCanvas, 0, 0);
    // Use destination-in with blurred mask to keep only masked area
    mCtx.globalCompositeOperation = 'destination-in';
    mCtx.drawImage(maskCanvas, 0, 0);

    // Now composite masked inpaint onto base
    ctx.drawImage(maskedInpaintCanvas, 0, 0);
  } else {
    ctx.drawImage(inpaintCanvas, 0, 0);
  }

  return canvas.toDataURL('image/png');
}
