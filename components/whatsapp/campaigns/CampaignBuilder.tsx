"use client";

import { useState } from "react";
import WhatsAppPreview from "./WhatsAppPreview";

interface CampaignBuilderProps {
  onCancel: () => void;
}

export default function CampaignBuilder({ onCancel }: CampaignBuilderProps) {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("Bonjour {{name}},\n\nProfitez de -20% sur toute la boutique avec le code PROMO20 aujourd'hui seulement !\n\nCliquez sur le bouton ci-dessous pour en profiter.");
  const [audience, setAudience] = useState("all");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleMagicAi = () => {
    setIsAiLoading(true);
    // Simulate AI generation
    setTimeout(() => {
      setMessage("👋 Salut {{name}} ! On a une surprise pour vous 🎁\n\nBénéficiez d'une réduction exclusive de -20% valable uniquement aujourd'hui avec le code *PROMO20*.\n\nNe laissez pas passer cette chance, cliquez ci-dessous pour l'activer 👇");
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Nouvelle Campagne</h1>
            <p className="text-sm text-gray-500 font-medium">Diffusion Broadcast</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-400'}`}>1</div>
          <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-400'}`}>2</div>
          <div className={`w-8 h-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 3 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-400'}`}>3</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-8 min-h-0">
        
        {/* Left Column: Form Settings */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 shadow-sm rounded-2xl p-6 overflow-y-auto">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">1. Audience</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nom de la campagne</label>
                  <input type="text" placeholder="Ex: Promo Black Friday" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Segment ciblé</label>
                  <select 
                    value={audience} 
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none shadow-sm font-medium"
                  >
                    <option value="all">Tous les contacts (1,245 contacts)</option>
                    <option value="active">Clients actifs (890 contacts)</option>
                    <option value="inactive">Inactifs &gt; 30 jours (355 contacts)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">2. Contenu du Message</h2>
                <button 
                  onClick={handleMagicAi}
                  disabled={isAiLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-bold hover:shadow-sm hover:border-purple-300 transition-all"
                >
                  {isAiLoading ? (
                    <span className="animate-pulse">Génération...</span>
                  ) : (
                    <>
                      <span className="text-lg leading-none">✨</span>
                      Améliorer avec l'IA
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex-1 flex flex-col relative group">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Tapez votre message ici..."
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="p-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm rounded-lg text-gray-500 font-bold transition-colors" title="Ajouter une variable">
                    {'{ }'}
                  </button>
                  <button className="p-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm rounded-lg text-gray-500 transition-colors" title="Ajouter une image">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Bouton d'action (Optionnel)</label>
                <div className="flex gap-2">
                  <input type="text" value="Profiter de l'offre" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" readOnly />
                  <button className="px-4 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors">Éditer</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">3. Planification</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button className="flex flex-col items-start p-4 bg-blue-50 border border-blue-200 rounded-xl text-left">
                  <span className="text-blue-700 font-bold mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Envoi immédiat
                  </span>
                  <span className="text-xs text-gray-500 font-medium">La campagne sera envoyée dès maintenant.</span>
                </button>
                <button className="flex flex-col items-start p-4 bg-white border border-gray-200 hover:border-gray-300 shadow-sm rounded-xl text-left transition-colors">
                  <span className="text-gray-900 font-bold mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Programmer
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Choisir une date et heure précise.</span>
                </button>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-purple-800 font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Smart Send (IA)
                  </h4>
                  <div className="w-8 h-4 bg-purple-500 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                  </div>
                </div>
                <p className="text-xs text-purple-900/70 font-medium">
                  Activé. Nous enverrons le message au moment où chaque client est le plus susceptible d'ouvrir WhatsApp d'après son historique.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-auto pt-6 flex justify-between">
            {step > 1 ? (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm"
              >
                Retour
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-md"
              >
                Continuer
              </button>
            ) : (
              <button 
                onClick={() => {
                  alert("Campagne lancée avec succès !");
                  onCancel();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-2"
              >
                Lancer la campagne
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Live Preview */}
        <div className="w-[360px] flex-shrink-0 flex items-center justify-center">
          <WhatsAppPreview text={message} />
        </div>
      </div>
    </div>
  );
}
