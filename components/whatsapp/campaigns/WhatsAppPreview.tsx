"use client";

interface WhatsAppPreviewProps {
  text: string;
}

export default function WhatsAppPreview({ text }: WhatsAppPreviewProps) {
  // Format the text to handle WhatsApp bold (*text*)
  const formattedText = text.split('\n').map((line, i) => {
    // Very basic markdown parsing for preview
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={j} className="font-bold">{part.slice(1, -1)}</strong>;
          }
          return part;
        })}
        <br />
      </span>
    );
  });

  return (
    <div className="relative w-[320px] h-[650px] bg-black rounded-[40px] border-[8px] border-gray-900 shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
      {/* Phone Notch/Island */}
      <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
        <div className="w-24 h-5 bg-gray-900 rounded-b-xl"></div>
      </div>

      {/* WhatsApp Header */}
      <div className="bg-[#075E54] text-white px-4 pt-10 pb-3 flex items-center gap-3 z-10 shadow-md">
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
          A
        </div>
        <div>
          <div className="font-semibold text-sm">Antigravity Promo</div>
          <div className="text-[10px] text-white/70">Compte professionnel</div>
        </div>
      </div>

      {/* Chat Background */}
      <div 
        className="flex-1 p-4 overflow-y-auto bg-[#E5DDD5] relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        <div className="flex flex-col gap-2">
          {/* Incoming Message Bubble */}
          <div className="bg-white text-black p-2 rounded-lg rounded-tl-none shadow-sm text-sm max-w-[85%] self-start relative">
            <div className="mb-1 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-[#111B21]">
              {formattedText}
            </div>
            <div className="text-right text-[10px] text-gray-500 mt-1">
              10:42
            </div>
            
            {/* Action Button */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button className="w-full text-center text-[#00A884] font-semibold text-sm py-1 flex justify-center items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Profiter de l'offre
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input area (mock) */}
      <div className="bg-[#F0F2F5] p-2 flex gap-2 items-center">
        <div className="bg-white flex-1 rounded-full px-4 py-2 text-gray-400 text-sm flex items-center justify-between">
          Message
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-10 10v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4a8 8 0 0 1 15.5-2"></path></svg>
        </div>
      </div>
    </div>
  );
}
