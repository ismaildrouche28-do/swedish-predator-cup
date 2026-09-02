import Link from "next/link";
import { SpcLogoMark } from "@/components/SpcLogo";

export const dynamic = "force-dynamic";

export default function RegelnPage() {
  return (
    <main className="min-h-screen bg-spc-greyLight">
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <img src="/login-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-14 pb-12 safe-pt">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white/85 text-[13px] font-semibold mb-5 hover:text-white transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Zurück
          </Link>
          <div className="flex justify-center mb-4">
            <SpcLogoMark className="max-w-[240px] drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)]" showSubtitle={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Der Wettkampf</h1>
          <p className="text-center text-white/85 text-[15px] mt-2 max-w-[52ch] mx-auto">
            Ein privater Angel-Cup im Herzen Schwedens. Punkte pro Fisch, klare Regeln, faire Chancen.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Zielarten */}
        <Card title="Zielarten" kicker="Was zählt">
          <div className="grid sm:grid-cols-3 gap-3">
            <Species name="Hecht" min="60 cm" factor="× 1.0" img="pike" />
            <Species name="Zander" min="50 cm" factor="× 1.3" img="zander" />
            <Species name="Barsch" name2="(Kaulbarsch)" min="25 cm" factor="× 2.0" img="perch" />
          </div>
          <p className="text-[13px] text-ink-3 mt-4">
            Fische unter Mindestmaß werden erfasst, aber nicht in die Wertung aufgenommen.
          </p>
        </Card>

        {/* Punkte */}
        <Card title="Punktesystem" kicker="Wie gerechnet wird">
          <ul className="text-[14px] text-ink space-y-2 leading-relaxed">
            <li><strong>Grundpunkte:</strong> Länge in cm × Art-Faktor. Ein 90 cm-Hecht = 90 Pkt, ein 60 cm-Zander = 78 Pkt, ein 30 cm-Barsch = 60 Pkt.</li>
            <li><strong>Topwater-Bonus:</strong> +10 Punkte, wenn der Fisch an einem Topwater-Köder gebissen hat. Einmal pro Wettkampf möglich.</li>
            <li><strong>Wertung:</strong> Maximal <strong>6 gewertete Fische</strong> insgesamt, davon höchstens <strong>4 pro Art</strong>. Es zählen automatisch die punktstärksten.</li>
          </ul>
        </Card>

        {/* Strafen */}
        <Card title="Strafen" kicker="Was gezogen wird">
          <ul className="text-[14px] text-ink space-y-2 leading-relaxed">
            <li><strong>Abriss / Verlust:</strong> −20 Punkte pro Vorfall.</li>
            <li><strong>Handling-Sperre:</strong> Nach jedem gemeldeten Fang gilt eine Sperre von 10 Minuten für den Fänger. In dieser Zeit dürfen keine neuen Fänge desselben Anglers gemeldet werden.</li>
          </ul>
        </Card>

        {/* Ablauf */}
        <Card title="Ablauf" kicker="Ein Wettkampftag">
          <ul className="text-[14px] text-ink space-y-2 leading-relaxed">
            <li><strong>Boote:</strong> Alle Teilnehmer sind auf mehrere Boote verteilt. Jedes Boot hat einen eigenen Call-Plan.</li>
            <li><strong>Calls:</strong> Feste Zeitfenster (z.B. Morning Call, Afternoon Call). Nur während eines Calls dürfen Fänge gewertet werden.</li>
            <li><strong>Fang melden:</strong> Über die App — Art wählen, Länge angeben, ggf. Topwater markieren, Foto anhängen. Der Fang erscheint sofort im Live-Ranking.</li>
            <li><strong>Live-Ranking:</strong> Wird bei jedem Fang automatisch aktualisiert.</li>
          </ul>
        </Card>

        {/* Faire Praxis */}
        <Card title="Fair Play" kicker="Selbstverständlich">
          <ul className="text-[14px] text-ink space-y-2 leading-relaxed">
            <li>Catch &amp; Release — jeder Fisch wird schonend zurückgesetzt.</li>
            <li>Länge wird ehrlich am Maßband gemessen. Foto als Beleg.</li>
            <li>Ein Fang wird sofort erfasst, nicht am Ende des Tages gesammelt.</li>
          </ul>
        </Card>

        {/* CTA */}
        <div className="pt-4">
          <Link href="/login/pin" className="block w-full text-center py-4 rounded-2xl font-bold text-[16px] bg-spc-dark text-white shadow-cs hover:bg-spc-mid transition">
            Anmelden und mitmachen
          </Link>
          <p className="text-center text-[11.5px] text-ink-3 mt-3 tracking-widest uppercase">Editio 2026</p>
        </div>
      </section>
    </main>
  );
}

function Card({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-cs-sm">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-spc-mid">{kicker}</div>
      <h2 className="text-[19px] sm:text-[21px] font-bold text-spc-dark mt-0.5 mb-3 tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Species({ name, name2, min, factor, img }: { name: string; name2?: string; min: string; factor: string; img: string }) {
  return (
    <div className="bg-spc-greyLight rounded-2xl p-4 text-center">
      <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white flex items-center justify-center overflow-hidden">
        <img src={`/fish/${img}.png`} alt="" className="w-full h-full object-contain" />
      </div>
      <div className="text-[15px] font-bold text-spc-dark">{name}</div>
      {name2 && <div className="text-[11px] text-ink-3 -mt-0.5">{name2}</div>}
      <div className="text-[12px] text-ink-3 mt-1.5">Mindestmaß</div>
      <div className="text-[15px] font-bold text-spc-dark num">{min}</div>
      <div className="text-[11px] text-spc-mid font-bold mt-1 num">Faktor {factor}</div>
    </div>
  );
}
