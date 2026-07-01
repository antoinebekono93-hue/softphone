"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Send, Cpu, ChevronDown, ChevronRight, Settings, Loader2, Code } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning_content?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

const AVAILABLE_MODELS = [
  { id: "zai-org/GLM-5.1-FP8", name: "GLM-5.1 (Reasoning & Tools)", description: "Modèle de raisonnement avec appels de fonction" },
  { id: "moonshotai/Kimi-K2.6", name: "Kimi-K2.6 (1.0T, 256K)", description: "IA très haut niveau (pensée désactivée)" },
  { id: "MiniMaxAI/MiniMax-M3-MXFP8", name: "MiniMax-M3", description: "Le plus économique" }
];

const AVAILABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Obtenir la météo actuelle pour une ville donnée.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "La ville, par exemple Paris, France" }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_crm_contact",
      description: "Rechercher un contact dans le CRM.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Le nom du contact à rechercher" }
        },
        required: ["name"]
      }
    }
  }
];

export default function PlaygroundClient() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "Vous êtes un assistant IA utile, spécialisé dans la démonstration des capacités d'inférence de Telnyx (Raisonnement, Appels de Fonctions)." }
  ]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [enableTools, setEnableTools] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const simulateToolExecution = (toolCall: any) => {
    const args = JSON.parse(toolCall.function.arguments || "{}");
    if (toolCall.function.name === "get_current_weather") {
      return `Météo simulée pour ${args.location} : 22°C, Ensoleillé`;
    }
    if (toolCall.function.name === "search_crm_contact") {
      return `Contact simulé trouvé : ${args.name} (Email: ${args.name.toLowerCase().replace(' ', '.')}@example.com, Téléphone: +33 6 12 34 56 78)`;
    }
    return "Outil inconnu.";
  };

  const parseSSEMessage = (line: string) => {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      try {
        return JSON.parse(line.slice(6));
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    
    await streamCompletion(newMessages);
  };

  const streamCompletion = async (chatMessages: Message[]) => {
    setIsGenerating(true);

    try {
      // Append an empty assistant message to hold the streaming response
      setMessages(prev => [...prev, { role: "assistant", content: "", reasoning_content: "", tool_calls: [] }]);
      
      const res = await fetch("/api/telnyx/inference/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          model: selectedModel,
          tools: enableTools ? AVAILABLE_TOOLS : undefined
        })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let currentContent = "";
      let currentReasoning = "";
      let currentToolCalls: any[] = [];

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            const data = parseSSEMessage(line);
            if (data && data.choices && data.choices[0]) {
              const delta = data.choices[0].delta;
              
              if (delta.reasoning_content) {
                currentReasoning += delta.reasoning_content;
              }
              if (delta.content) {
                currentContent += delta.content;
              }
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.id) {
                    currentToolCalls[tc.index] = {
                      id: tc.id,
                      type: tc.type,
                      function: { name: tc.function?.name || "", arguments: tc.function?.arguments || "" }
                    };
                  } else if (tc.function?.arguments) {
                    if (currentToolCalls[tc.index]) {
                      currentToolCalls[tc.index].function.arguments += tc.function.arguments;
                    }
                  }
                }
              }

              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                lastMsg.content = currentContent;
                lastMsg.reasoning_content = currentReasoning;
                lastMsg.tool_calls = currentToolCalls.length > 0 ? currentToolCalls : undefined;
                return updated;
              });
            }
          }
        }
      }

      // Check if we need to execute tools
      if (currentToolCalls.length > 0) {
        let toolResultMessages: Message[] = [];
        
        for (const tc of currentToolCalls) {
          const result = simulateToolExecution(tc);
          toolResultMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: result
          });
        }
        
        // Add tool results to context
        const nextMessages = [...chatMessages, { role: "assistant", content: currentContent, tool_calls: currentToolCalls }, ...toolResultMessages] as Message[];
        setMessages(prev => [...prev, ...toolResultMessages]);
        
        // Call LLM again with tool results
        await streamCompletion(nextMessages);
      } else {
        setIsGenerating(false);
      }
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-in fade-in duration-500">
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
            <Terminal className="text-violet-500 w-8 h-8" />
            Playground IA (Inférence)
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">
            Testez les modèles hébergés sur l'infrastructure GPU de Telnyx. 
            Expérimentez le Raisonnement (Chain of Thought) et les Appels de Fonctions (Tool Calling).
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl p-6 flex flex-col gap-8 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4 uppercase tracking-wider text-gray-400">
              <Cpu className="w-4 h-4" /> Modèle
            </h2>
            <div className="space-y-3">
              {AVAILABLE_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedModel === m.id ? 'bg-violet-500/10 border-violet-500/50' : 'bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-gray-500'}`}
                >
                  <div className={`text-sm font-medium ${selectedModel === m.id ? 'text-violet-400' : 'text-white'}`}>{m.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4 uppercase tracking-wider text-gray-400">
              <Settings className="w-4 h-4" /> Capacités
            </h2>
            
            <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] cursor-pointer hover:border-gray-500 transition-colors">
              <div>
                <div className="text-sm font-medium text-white">Appels d'Outils (Tools)</div>
                <div className="text-xs text-gray-500 mt-1">Fournir des fonctions virtuelles au LLM (Météo, CRM)</div>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-violet-500" 
                checked={enableTools}
                onChange={e => setEnableTools(e.target.checked)}
              />
            </label>

            {enableTools && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Outils simulés injectés :</div>
                {AVAILABLE_TOOLS.map(t => (
                  <div key={t.function.name} className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-800 text-xs text-gray-300 flex items-center gap-2">
                    <Code className="w-3 h-3 text-cyan-500" />
                    {t.function.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl flex flex-col overflow-hidden">
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.filter(m => m.role !== "system").map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Reasoning Block */}
                {msg.reasoning_content && (
                  <div className="mb-2 max-w-[85%] bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center gap-2 px-4 py-2 cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-300 bg-gray-900">
                        <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                        Processus de Raisonnement (Chain of Thought)
                      </summary>
                      <div className="px-4 py-3 text-sm text-gray-400 italic border-t border-gray-800 whitespace-pre-wrap">
                        {msg.reasoning_content}
                      </div>
                    </details>
                  </div>
                )}

                {/* Main Content */}
                {msg.role === "tool" ? (
                  <div className="max-w-[85%] bg-cyan-900/20 border border-cyan-800/50 text-cyan-200 px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-mono">
                    <div className="text-xs font-bold text-cyan-500 mb-1">🛠 Résultat Outil : {msg.name}</div>
                    {msg.content}
                  </div>
                ) : (msg.content || msg.tool_calls) && (
                  <div className={`max-w-[85%] px-5 py-3.5 text-sm ${
                    msg.role === "user" 
                      ? "bg-violet-600 text-white rounded-2xl rounded-tr-sm" 
                      : "bg-[var(--bg-app)] border border-[var(--border-subtle)] text-gray-200 rounded-2xl rounded-tl-sm"
                  }`}>
                    {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                    
                    {msg.tool_calls && msg.tool_calls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.tool_calls.map((tc, idx) => (
                          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs font-mono text-cyan-400">
                            <div className="font-bold flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Appel de la fonction: {tc.function.name}
                            </div>
                            <div className="text-gray-500 mt-1">{tc.function.arguments}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isGenerating && messages[messages.length - 1]?.role !== "assistant" && messages[messages.length - 1]?.role !== "tool" && (
              <div className="flex items-start">
                <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm p-4">
                  <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-[var(--bg-app)] border-t border-[var(--border-subtle)]">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isGenerating ? "L'IA réfléchit..." : "Discutez avec le modèle ou demandez la météo..."}
                disabled={isGenerating}
                className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500 pr-14 disabled:opacity-50 transition-colors"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
