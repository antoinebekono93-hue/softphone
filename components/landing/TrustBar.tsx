const pillars = [
  "Téléphonie Cloud B2B",
  "Buster Call Web & Mobile (PWA)",
  "Routage d'Appels Intelligent",
  "Agents Vocaux IA 24/7",
  "Chiffrement TLS / SRTP",
  "Intégrations CRM & Helpdesk",
  "Appels Internes App-to-App",
  "Analytiques et Transcripts"
];

export default function TrustBar() {
  return (
    <section className="landing-trust-bar landing-container border-y border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/20">
      <h2 className="text-center text-xs font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase mb-5">
        Architecture et capacités de la plateforme
      </h2>

      {/* Row - scrolling left */}
      <ul className="landing-pillars">
          {pillars.map((pillar) => (
            <li key={pillar} className="landing-pillar font-medium text-[var(--text-secondary)]">
              <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 rounded-full bg-cyan-400"></span>
              {pillar}
            </li>
          ))}
      </ul>
    </section>
  );
}
