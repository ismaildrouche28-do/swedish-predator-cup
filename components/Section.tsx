export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="bg-cs-section rounded-3xl p-4 sm:p-5 mb-4">
      {title && <h2 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight mb-4">{title}</h2>}
      {children}
    </section>
  );
}
