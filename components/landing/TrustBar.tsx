const companies = [
  "Vinci", "Bouygues", "Eiffage", "Spie", "Colas", "TotalEnergies", "AXA",
  "BNP Paribas", "LVMH", "L'Oréal", "Sanofi", "Dassault", "Thales",
  "Capgemini", "Orange", "Engie", "Carrefour", "Decathlon", "Ubisoft",
  "Criteo", "Cdiscount", "Peugeot", "Renault", "Michelin", "Société Générale", "La Poste"
];

export default function TrustBar() {
  const firstHalf = companies.slice(0, 13);
  const secondHalf = companies.slice(13);

  return (
    <section className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/20 overflow-hidden">
      <p className="text-center text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase mb-8">
        Ils font confiance à notre technologie
      </p>

      {/* Row 1 - scrolling left */}
      <div className="relative w-full flex overflow-hidden mb-4">
        <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10"></div>
        <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10"></div>
        <div className="flex w-[200%] animate-marquee opacity-50 hover:opacity-100 transition-opacity duration-500">
          {[...firstHalf, ...firstHalf].map((name, i) => (
            <div key={i} className="flex-1 flex justify-center items-center text-xl font-bold font-serif italic mx-8 text-[var(--text-primary)] whitespace-nowrap">
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 - scrolling right */}
      <div className="relative w-full flex overflow-hidden">
        <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10"></div>
        <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10"></div>
        <div className="flex w-[200%] animate-marquee-reverse opacity-50 hover:opacity-100 transition-opacity duration-500">
          {[...secondHalf, ...secondHalf].map((name, i) => (
            <div key={i} className="flex-1 flex justify-center items-center text-xl font-bold font-serif italic mx-8 text-[var(--text-primary)] whitespace-nowrap">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
