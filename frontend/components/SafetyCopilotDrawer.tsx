"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";

interface SafetyCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CopilotMessage {
  sender: "user" | "copilot";
  text: string;
  supporting_data?: any[];
  suggestion?: string;
  time: string;
}

const SAMPLE_QUERIES = [
  "Which sites should I investigate first?",
  "Which control barrier is deteriorating fastest?",
  "Show strongest evidence for critical patterns",
  "What open preventive actions are pending?",
];

export function SafetyCopilotDrawer({ isOpen, onClose }: SafetyCopilotDrawerProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      sender: "copilot",
      text: "Hello! I am your Grounded Safety Copilot. I analyze actual field telemetry, emerging precursor clusters, and barrier health across operations. How can I assist your safety investigation today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSend(promptText?: string) {
    const textToSend = promptText || query;
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await api.copilotQuery(textToSend);
      const botMsg: CopilotMessage = {
        sender: "copilot",
        text: res.answer,
        supporting_data: res.supporting_data,
        suggestion: res.actionable_suggestion,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: CopilotMessage = {
        sender: "copilot",
        text: "Could not retrieve telemetry at this moment. Ensure the backend server is running.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Grounded Safety Copilot</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                  Zero Hallucination
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Strictly answers from active safety observations &amp; barrier telemetry</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-slate-900 text-white rounded-tr-xs"
                    : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-xs"
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />

                {/* Supporting Data Cards */}
                {m.supporting_data && m.supporting_data.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Supporting Telemetry Evidence
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {m.supporting_data.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] flex justify-between">
                          <span className="font-semibold text-slate-800">{item.site || item.barrier_name || item.title}</span>
                          <span className="text-slate-500 font-bold">
                            {item.avg_sif_score ? `SIF ${item.avg_sif_score}` : item.health_score ? `Health ${item.health_score}/100` : item.status || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Suggestion */}
                {m.suggestion && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                    💡 <b>Recommended Next Step:</b> {m.suggestion}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
              <span>Querying database telemetry and pattern graphs...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
            {SAMPLE_QUERIES.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 mt-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about precursor patterns, failing barriers, or sites..."
              className="flex-1 text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-primary bg-slate-50"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
