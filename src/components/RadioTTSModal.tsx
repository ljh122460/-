import React, { useState, useRef } from 'react';
import { X, Radio, Volume2, Loader2, Play, Sparkles } from 'lucide-react';

interface RadioTTSModalProps {
  onClose: () => void;
}

export const RadioTTSModal: React.FC<RadioTTSModalProps> = ({ onClose }) => {
  const [text, setText] = useState('');
  const [speaker, setSpeaker] = useState('Puck');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const presets = [
    {
      title: '🚓 警用对讲机追捕调度',
      text: '指挥中心呼叫4号巡逻巡警！前方发现红色重机车正在以两百公里时速危险超车并挥动武器，立刻前往围堵！',
      speaker: 'Fenrir',
      style: 'Tough highway patrol police dispatch',
    },
    {
      title: '🎙️ 赛道现场激情解说',
      text: '不可思议的连续侧踢！一记凶狠的摆尾直接把毒蛇轰出了赛道护栏！全场暴走族陷入沸腾！',
      speaker: 'Puck',
      style: 'High-octane arcade race announcer',
    },
    {
      title: '🐍 对手毒蛇的无线电嘲弄',
      text: '小菜鸟，你的油门是坏了吗？下个弯道我会亲手用铁链把你连人带车拉下公路！',
      speaker: 'Zephyr',
      style: 'Ruthless outlaw biker trash talk',
    },
    {
      title: '🔧 老扳手麦考伊技术联络',
      text: '听着小子，入弯前提早收油，等车身倾斜再猛压油门！氮气留到大直道再喷！',
      speaker: 'Charon',
      style: 'Gruff veteran mechanic radio advice',
    },
  ];

  const handleGenerateAndPlay = async (customPrompt?: string, customSpeaker?: string, customStyle?: string) => {
    const promptText = customPrompt || text;
    const voice = customSpeaker || speaker;
    if (!promptText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptText,
          speaker: voice,
          style: customStyle || 'High-octane arcade race announcer',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TTS 请求失败');

      if (data.audio) {
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audioRef.current = audio;

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          setError('音频播放失败');
        };

        await audio.play();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '语音合成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-cyan-300 tracking-wide font-mono flex items-center gap-2">
                战术无线电 & 语音播报
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full font-sans font-bold">
                  gemini-3.8-flash-tts
                </span>
              </h3>
              <p className="text-xs text-slate-400">赛道解说 · 警车追捕警告 · 对手挑衅无线电</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Equalizer Visualizer during playback */}
        <div className="my-4 p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className={`w-5 h-5 ${isPlaying ? 'text-cyan-400 animate-bounce' : 'text-slate-600'}`} />
            <span className="text-xs font-bold text-slate-300">
              {isPlaying ? '正在播放机车无线电语音...' : loading ? 'Gemini 3.8 Flash TTS 正在合成语音...' : '就绪'}
            </span>
          </div>

          {isPlaying && (
            <div className="flex items-end gap-1 h-5">
              {[40, 80, 60, 100, 70, 90, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preset Channels */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            快速预设电台频道 (PRESET CHANNELS)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => {
                  setText(p.text);
                  setSpeaker(p.speaker);
                  handleGenerateAndPlay(p.text, p.speaker, p.style);
                }}
                className="p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition flex flex-col justify-between group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                  <span>{p.title}</span>
                  <Play className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              自定义无线电播报内容
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>声线:</span>
              <select
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
              >
                <option value="Puck">Puck (热血解说)</option>
                <option value="Fenrir">Fenrir (冷峻交警)</option>
                <option value="Zephyr">Zephyr (狂傲暴徒)</option>
                <option value="Charon">Charon (硬汉老扳手)</option>
                <option value="Kore">Kore (技术调度员)</option>
              </select>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入想要广播的垃圾话、挑衅或警号警告..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition resize-none"
          />

          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

          <button
            disabled={loading || !text.trim()}
            onClick={() => handleGenerateAndPlay()}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-1 active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>生成并广播当前语音 (TTS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
