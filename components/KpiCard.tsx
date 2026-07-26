export function KpiCard({ label, value, unit, accent, success, danger }: {
  label: string; value: string | number; unit?: string;
  accent?: boolean; success?: boolean; danger?: boolean;
}) {
  const tone = accent ? "text-spc-mid" : success ? "text-success" : danger ? "text-danger" : "text-ink";
  return (
    <div className="bg-white rounded-2xl p-4 shadow-cs-sm">
      <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-1.5">{label}</div>
      <div className={`text-[28px] font-bold num leading-none ${tone}`}>{value}</div>
      {unit && <div className="text-[11.5px] text-ink-3 mt-1.5">{unit}</div>}
    </div>
  );
}
