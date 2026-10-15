import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface ChatModalProps {
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const [role, setRole] = useState<'mechanic' | 'police' | 'rival'>('mechanic');
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      content:
        '嘿小子！我是老扳手麦考伊。欢迎来到后勤改装站！想了解怎么把机车提速到 260km/h，还是怎么用铁链在弯道一击把对手扫下公路？尽管问我！',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleRoleChange = (newRole: 'mechanic' | 'police' | 'rival') => {
    setRole(newRole);
    let greeting = '';
    if (newRole === 'mechanic') {
      greeting = '我是老扳手麦考伊。车况如何？发动机过热了还是悬挂松了？说吧，我给你换最好的零件！';
    } else if (newRole === 'police') {
      greeting = '这里是加州公路巡警奥利里警长！警告所有在1号公路上非法竞速的暴徒，立刻减速靠边停车接受扣押，否则我将亲自驾车撞停你！';
    } else {
      greeting = '（冷笑）我是毒蛇。怎么，新手，刚才被我的铁链甩倒在地还没摔够？想来下一局下注吗？';
    }

    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'model',
        content: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          role,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '通信中断');

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          content: data.reply || '（无线电杂音...）',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `【通讯故障】：${err.message || '无法连接到电台频道'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-300 tracking-wide font-mono flex items-center gap-2">
                暴走族地下电台联络站
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-sans font-bold">
                  Gemini Multi-turn Chat
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">多轮历史对话 · 战术技巧探讨 · 角色定制设定</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role & Model Switcher Toolbar */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-2xl">
          {/* Character Roles */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">联络对象:</span>
            {[
              { id: 'mechanic', label: '🔧 机械师麦考伊' },
              { id: 'police', label: '🚨 奥利里警长' },
              { id: 'rival', label: '🐍 毒蛇维珀' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoleChange(r.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  role === r.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Model Switcher */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[10px] font-bold uppercase">模型:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (综合任务)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (快速响应)</option>
              <option value="gemini-4-argon">gemini-4-argon (复杂深度策略)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 my-1">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : role === 'police'
                      ? 'bg-red-600 text-white'
                      : role === 'rival'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600/90 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[9px] text-slate-400 mt-1 text-right font-mono">{m.timestamp}</div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>正在调频接收无线电回复...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <div className="pt-2 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`向${role === 'mechanic' ? '老扳手麦考伊' : role === 'police' ? '奥利里警长' : '毒蛇'}发送无线电信息...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
          />

          <button
            disabled={loading || !input.trim()}
            onClick={handleSend}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95"
          >
            <span>发送</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
