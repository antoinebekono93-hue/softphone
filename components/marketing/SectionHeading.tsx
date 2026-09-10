export default function SectionHeading({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--text-secondary)] text-lg font-medium max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
}