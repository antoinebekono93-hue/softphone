"use client";

import { useState } from "react";
import { provisionLiveKitTenant, bridgeLiveKitTelephony } from "./actions";
import { Server, PhoneCall, Code, Terminal, CheckCircle, Loader2 } from "lucide-react";

export default function LiveKitClient({ phoneNumbers }: { phoneNumbers: any[] }) {
  const [activeStep, setActiveStep] = useState(1);
  
  const [provisionState, setProvisionState] = useState({ isLoading: false, success: false, error: "" });
  const [bridgeState, setBridgeState] = useState({ isLoading: false, success: false, error: "", data: null as any });

  const regions = [
    { id: "nyc1", name: "New York" },
    { id: "sfo3", name: "San Francisco" },
    { id: "atl1", name: "Atlanta" },
    { id: "syd1", name: "Sydney" }
  ];

  const handleProvision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProvisionState({ isLoading: true, success: false, error: "" });
    const fd = new FormData(e.currentTarget);
    const region = fd.get("region") as string;
    const name = fd.get("name") as string;
    const secret = fd.get("secret") as string;

    const res = await provisionLiveKitTenant(region, name, secret);
    if (res.error) {
      setProvisionState({ isLoading: false, success: false, error: res.error });
    } else {
      setProvisionState({ isLoading: false, success: true, error: "" });
      setActiveStep(2);
    }
  };

  const handleBridge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBridgeState({ isLoading: true, success: false, error: "", data: null });
    const fd = new FormData(e.currentTarget);
    const phoneNumberId = fd.get("phoneNumberId") as string;
    const region = fd.get("region") as string;

    const res = await bridgeLiveKitTelephony(phoneNumberId, region);
    if (res.error) {
      setBridgeState({ isLoading: false, success: false, error: res.error, data: null });
    } else {
      setBridgeState({ isLoading: false, success: true, error: "", data: res.data });
      setActiveStep(3);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
          <Server className="text-cyan-500" />
          LiveKit sur Telnyx
          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-medium tracking-wide">BÊTA</span>
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 max-w-3xl">
          Déployez vos agents d'IA vocale codés en Python directement sur l'infrastructure de Telnyx pour une latence ultra-faible (~2ms) et un routage SIP intégré sans frais tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: STEPS */}
        <div className="lg:col-span-4 space-y-2">
          {[
            { step: 1, title: "1. Provisionnement", icon: Server },
            { step: 2, title: "2. Pont Téléphonique", icon: PhoneCall },
            { step: 3, title: "3. Commandes CLI", icon: Terminal },
            { step: 4, title: "4. Code Agent", icon: Code }
          ].map((item) => (
            <div 
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                activeStep === item.step 
                  ? "bg-[var(--bg-surface-hover)] border-cyan-500/50 text-white" 
                  : "bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-gray-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.title}</span>
              {activeStep > item.step && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: CONTENT */}
        <div className="lg:col-span-8 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-xl">
          
          {/* STEP 1 */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-semibold text-white">Provisionner votre Tenant LiveKit</h2>
              <p className="text-sm text-[var(--text-secondary)]">Enregistrez votre projet sur la plateforme Telnyx LiveKit. Cette étape n'est à faire qu'une seule fois par région.</p>
              
              {provisionState.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-sm">
                  {provisionState.error}
                </div>
              )}
              {provisionState.success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Tenant provisionné avec succès !
                </div>
              )}

              <form onSubmit={handleProvision} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Région</label>
                  <select name="region" className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nom du Projet</label>
                  <input required name="name" type="text" placeholder="mon-projet" className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">API Secret LiveKit</label>
                  <input required name="secret" type="password" placeholder="Choisissez un secret sécurisé" className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <button disabled={provisionState.isLoading} type="submit" className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-medium text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                  {provisionState.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Provisionner
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-semibold text-white">Créer le Pont Téléphonique SIP</h2>
              <p className="text-sm text-[var(--text-secondary)]">Associez un numéro de téléphone Telnyx à un serveur SIP LiveKit régional. Nous créons la connexion FQDN et la lions automatiquement.</p>
              
              {bridgeState.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-sm">
                  {bridgeState.error}
                </div>
              )}
              {bridgeState.success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Pont configuré sur {bridgeState.data.sipEndpoint} !
                </div>
              )}

              <form onSubmit={handleBridge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Numéro de Téléphone</label>
                  <select name="phoneNumberId" className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {phoneNumbers.map(n => <option key={n.id} value={n.id}>{n.number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Région Cible</label>
                  <select name="region" className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                  </select>
                </div>
                
                <button disabled={bridgeState.isLoading} type="submit" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                  {bridgeState.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer le Pont
                </button>
              </form>
            </div>
          )}

          {/* STEP 3 */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-semibold text-white">Configurer LiveKit via CLI</h2>
              <p className="text-sm text-[var(--text-secondary)]">Exécutez ces commandes dans votre terminal pour autoriser le trafic entrant vers votre Trunk et configurer la règle de dispatch.</p>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-cyan-400 mb-2">1. INBOUND TRUNK</div>
                  <pre className="bg-[var(--bg-app)] p-4 rounded-xl text-sm font-mono text-gray-300 overflow-x-auto border border-[var(--border-subtle)]">
{`echo '{
  "trunk": {
    "name": "telnyx-inbound",
    "numbers": ["${bridgeState.data?.phoneNumber || "+1234567890"}"],
    "allowed_addresses": ["192.76.120.0/22"]
  }
}' | lk sip inbound create -`}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-mono text-cyan-400 mb-2">2. DISPATCH RULE</div>
                  <pre className="bg-[var(--bg-app)] p-4 rounded-xl text-sm font-mono text-gray-300 overflow-x-auto border border-[var(--border-subtle)]">
{`echo '{
  "dispatchRule": {
    "name": "route-to-agent",
    "trunkIds": [""],
    "rule": { "dispatchRuleIndividual": {} },
    "roomConfig": { "agents": [{ "agentName": "agent" }] }
  }
}' | lk sip dispatch create -`}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">Remplacez trunkIds par l'ID retourné à l'étape précédente.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-semibold text-white">Déployer l'Agent</h2>
              <p className="text-sm text-[var(--text-secondary)]">Sauvegardez ce code dans <code>agent.py</code>, ajoutez vos identifiants, et déployez sur les serveurs Telnyx !</p>
              
              <pre className="bg-[var(--bg-app)] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-[var(--border-subtle)] max-h-96">
{`import asyncio
from livekit.agents import Agent, AgentSession, JobContext, RoomInputOptions
from livekit.plugins import openai, silero, telnyx

class MyAgent(Agent):
    def __init__(self):
        super().__init__(instructions="Vous êtes un assistant vocal utile.")

    async def on_enter(self):
        self.session.generate_reply(
            instructions="Saluez l'appelant."
        )

async def entrypoint(ctx: JobContext):
    session = AgentSession(
        stt=telnyx.STT(
            transcription_engine="Deepgram",
            base_url="wss://api.telnyx.com/v2/speech-to-text/transcription",
        ),
        llm=openai.LLM.with_telnyx(model="zai-org/GLM-5.1-FP8"),
        tts=telnyx.TTS(voice="Telnyx.NaturalHD.astra", sample_rate=24000),
        vad=silero.VAD.load(),
    )

    await ctx.connect()
    await session.start(
        agent=MyAgent(),
        room=ctx.room,
        room_input_options=RoomInputOptions(),
    )

# Déploiement :
# lk agent deploy . --secrets TELNYX_API_KEY=$TELNYX_API_KEY
`}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
