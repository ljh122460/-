import React, { useState } from 'react';
import { X, Sparkles, Image, Loader2, Download, Check } from 'lucide-react';

interface AiStudioModalProps {
  onClose: () => void;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('90年代复古暴力摩托，黑色皮衣车手挥舞铁链在落日加州公路上极速飞驰，公路反光与电影级质感');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    '90年代复古暴力摩托，黑色皮衣车手挥舞铁链在落日加州公路上极速飞驰',
    '赛博朋克霓虹重机车，双排气管喷射蓝色氮气火焰，雨夜都市沥青反光',
    '加州公路巡警拦截重型摩托，红蓝爆闪警灯，防暴头盔与威严警徽',
    '废土末日柴油朋克重机车，生锈装甲，尖刺挡泥板与骷髅涂装',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageSize,
          aspectRatio: '16:9',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '图片生成失败');

      if (data.imageUrl) {
        setGeneratedImg(data.imageUrl);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-violet-500/50 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-950/80 border border-violet-500/40 rounded-xl text-violet-400">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-lg font-black text-violet-300 tracking-wide font-mono flex items-center gap-2">
                AI 重机车工坊与车手海报
                <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full font-sans font-bold">
                  gemini-3-pro-image-preview
                </span>
              </h3>
              <p className="text-xs text-slate-400">生成超高清定制机车概念图 · 支持 1K / 2K / 4K 分辨率设定</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resolution Affordance (1K, 2K, 4K) */}
        <div className="my-4 p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-slate-300">
              输出画质分辨率 (IMAGE RESOLUTION):
            </span>
          </div>

          {/* Size Selector Buttons */}
          <div className="flex items-center gap-2">
            {(['1K', '2K', '4K'] as const).map((size) => {
              const active = imageSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setImageSize(size)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 ring-2 ring-violet-400/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{size}</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    {size === '1K' ? '高清' : size === '2K' ? '超清' : '极清'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt presets */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            推荐概念主题 (CONCEPT PRESETS)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p)}
                className="p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 rounded-xl text-left text-xs text-slate-300 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input & Action */}
        <div className="flex flex-col gap-2 mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            机车外观与场景描述词
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition resize-none"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            disabled={loading || !prompt.trim()}
            onClick={handleGenerate}
            className="w-full py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在以 {imageSize} 画质生成机车海报...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>生成专属 {imageSize} 重机车画作</span>
              </>
            )}
          </button>
        </div>

        {/* Result Preview */}
        {generatedImg && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-bold text-slate-200">已生成海报 · {imageSize} 分辨率</span>
              <a
                href={generatedImg}
                download="road_rash_superbike.png"
                className="px-2.5 py-1 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 rounded-lg flex items-center gap-1 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载原图</span>
              </a>
            </div>
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              <img
                src={generatedImg}
                alt="AI Generated Road Rash Bike"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
