export const dynamic = "force-dynamic";

export default function RegelwerkPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Regelwerk</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Regelwerk SPC</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">
          Verbindliche Grundlage für den Swedish Predator Cup.
        </p>
      </section>

      {/* 1. Ziel */}
      <Section number="1." title="Ziel des Wettkampfs">
        <P>
          Der Swedish Predator Cup (SPC) ist ein Angelwettkampf, bei dem die Teilnehmer innerhalb eines festgelegten Zeitraums versuchen, durch den Fang von Raubfischen möglichst viele Wertungspunkte zu erzielen.
        </P>
        <P>
          Die Wertung erfolgt ausschließlich auf Grundlage der im Wettkampf gültigen Regeln. Maßgeblich sind dabei die Fischart, die Länge des gefangenen Fisches sowie die jeweils festgelegten Wertungsfaktoren, Bonus- und Strafregelungen.
        </P>
      </Section>

      {/* 2. Teilnehmer */}
      <Section number="2." title="Teilnehmer">
        <P>Am Wettkampf können bis zu sechs Teilnehmer teilnehmen.</P>
        <P>Zu Beginn eines Wettkampfs werden sämtliche Teilnehmer festgelegt.</P>
      </Section>

      {/* 3. Spielmodus */}
      <Section number="3." title="Spielmodus">
        <P>
          Die Teilnehmer verteilen sich auf zwei Boote. Während des Wettkampfs erhält jeder Teilnehmer zuvor festgelegte Zeitfenster, sogenannte Calls.
        </P>

        <SubHeading>3.1 CALLS</SubHeading>
        <P>
          Ein Call ist das persönliche Zeitfenster eines Teilnehmers, in dem ausschließlich dieser Teilnehmer die Bootsführung bestimmt. Dazu gehören insbesondere:
        </P>
        <UL>
          <li>die Wahl des Angelbereichs,</li>
          <li>die Schleppstrecke,</li>
          <li>die Wassertiefe, über der geschleppt wird.</li>
        </UL>
        <P>
          Die individuelle Angeltechnik jedes Teilnehmers bleibt davon unberührt. Jeder Teilnehmer entscheidet jederzeit selbst über seine Ausrüstung, Köderwahl und Art der Köderführung.
        </P>
        <P>
          Die Calls sind immer an eine Person gebunden und laufen auf beiden Booten parallel.
        </P>

        <Callout label="Beispiel">
          <div>Boot A: Mathias – Morning Call</div>
          <div>Boot B: Jens – Morning Call</div>
        </Callout>

        <P>
          Nach Ablauf eines Calls geht das Recht zur Bootsführung auf den nächsten Teilnehmer des jeweiligen Boots über. Die Reihenfolge sowie die Dauer der Calls werden vor Wettkampfbeginn festgelegt.
        </P>
      </Section>

      {/* 4. Zeiten */}
      <Section number="4." title="Zeiten (Wertung / Calls)">
        <P>
          Der Wettkampf beginnt mit dem offiziellen Angelstart. Ab diesem Zeitpunkt dürfen Fische für den Wettkampf gefangen werden.
        </P>
        <P>
          Der Wettkampf kann durch eine Mittagspause unterbrochen werden. Mit Beginn der Mittagspause beginnt die Wettkampfunterbrechung (<strong>Timeout</strong>). Ab diesem Zeitpunkt darf kein weiterer Köder ausgeworfen werden.
        </P>
        <P>
          Eine Ausnahme gilt für Fische, die sich bereits vor Beginn des Timeouts im Drill befanden. Wird ein solcher Fisch erst während des Timeouts gelandet, darf er dennoch in die Wertung aufgenommen werden.
        </P>
        <P>
          Nach Ende der Mittagspause wird der Wettkampf fortgesetzt. Der Wettkampf endet mit dem offiziellen Angelende.
        </P>
        <P>
          Auch am Wettkampfende gilt ein Timeout. Nach diesem Zeitpunkt darf kein weiterer Köder ausgeworfen werden. Fische, die sich bereits vor dem Timeout im Drill befanden und erst danach gelandet werden, dürfen ebenfalls noch gewertet werden.
        </P>

        <SubHeading>4.1 Calls</SubHeading>
        <UL>
          <li><strong>Morning Call</strong> → Zeitraum vom Angelstart bis zur Mittagspause.</li>
          <li><strong>Late Call</strong> → Zeitraum von der Mittagspause bis zum Angelende.</li>
          <li><strong>Mid Call</strong> → Der <em>Mid Call</em> kommt ausschließlich bei einer Bootsbesatzung mit drei Teilnehmern zum Einsatz. Sein Zeitraum wird vor Beginn des Wettkampfs festgelegt.</li>
        </UL>
      </Section>

      {/* 5. Wertungssystem */}
      <Section number="5." title="Wertungssystem / Slot-Logik">
        <UL>
          <li>Jeder wertungsfähige Fisch wird unmittelbar nach dem Fang vermessen.</li>
          <li>Die gemessene Länge wird entsprechend der Fischart mit dem jeweiligen Wertungsfaktor multipliziert.</li>
          <li>Die so errechneten Punkte werden zum Gesamtergebnis des Teilnehmers addiert.</li>
        </UL>

        <SubHeading>5.1 Logik</SubHeading>
        <P>Es können maximal sechs Fische in die Gesamtwertung eines Teilnehmers eingebracht werden.</P>
        <P>Die sechs Wertungsplätze werden über ein Slot-System gebildet.</P>

        <MiniHeading>Feste Slots</MiniHeading>
        <P>Drei Slots sind jeweils fest einer Fischart zugeordnet:</P>
        <UL>
          <li>Hecht-Slot</li>
          <li>Zander-Slot</li>
          <li>Barsch-Slot</li>
        </UL>

        <MiniHeading>Freie Slots</MiniHeading>
        <P>Drei weitere Slots sind frei und können jeweils für einen Hecht, Zander oder Barsch verwendet werden:</P>
        <UL>
          <li>Freier Slot – Hecht, Zander oder Barsch</li>
          <li>Freier Slot – Hecht, Zander oder Barsch</li>
          <li>Freier Slot – Hecht, Zander oder Barsch</li>
        </UL>

        <MiniHeading>Konsequenz für die Wertung</MiniHeading>
        <P>Dadurch können maximal vier Fische derselben Art gewertet werden:</P>
        <UL>
          <li>1 Fisch dieser Art im jeweiligen festen „Arten-Slot"</li>
          <li>plus maximal 3 weitere Fische dieser Art in den „freien Slots".</li>
        </UL>

        <Callout label="Beispiel">
          <P>Ein Teilnehmer kann maximal vier Hechte, vier Zander oder vier Barsche in die Wertung bringen.</P>
          <P>Wer fünf oder sechs Fische in die Gesamtwertung bringen möchte, muss daher entsprechend auch Fische der anderen Wertungsfischarten gefangen haben.</P>
        </Callout>

        <SubHeading>5.2 Full Card</SubHeading>
        <P>Eine <em>Full Card</em> mit sechs gewerteten Fischen ist nur möglich, wenn alle drei Wertungsfischarten vertreten sind.</P>

        <SubHeading>5.3 Reihenfolge der Slot-Besetzung</SubHeading>
        <P>Die zeitliche Reihenfolge der Fänge spielt für die Slot-Zuordnung keine Rolle.</P>
      </Section>

      {/* 6. Wertungsfähiger Fang */}
      <Section number="6." title="Wertungsfähiger Fang">
        <SubHeading>6.1 Wertungsfähigkeit</SubHeading>
        <P>Ein Fisch gilt nur dann als wertungsfähig, wenn</P>
        <UL>
          <li>das für seine Art festgelegte Mindestmaß erreicht wird,</li>
          <li>der Fisch ordnungsgemäß vermessen wurde,</li>
          <li>der Fang nach der respektvollen und sachgerechten Versorgung des Fisches unmittelbar im Wertungssystem erfasst wird.</li>
        </UL>
        <P>Als Fang im Sinne des Swedish Predator Cup gelten ausschließlich regulär vermessene Fische.</P>

        <SubHeading>6.2 Fischarten, Mindestmaße und Wertungsfaktoren</SubHeading>
        <div className="mt-3 rounded-2xl overflow-hidden border border-black/[0.06]">
          <table className="w-full text-[14px]">
            <thead className="bg-spc-lighter/60">
              <tr>
                <th className="text-left px-3 py-2 font-bold text-spc-dark">Fischart</th>
                <th className="text-left px-3 py-2 font-bold text-spc-dark">Mindestmaß</th>
                <th className="text-left px-3 py-2 font-bold text-spc-dark">Faktor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-black/[0.06]">
                <td className="px-3 py-2 font-semibold">Barsch</td>
                <td className="px-3 py-2 num">25 cm</td>
                <td className="px-3 py-2 num">× 2,0</td>
              </tr>
              <tr className="border-t border-black/[0.06] bg-spc-greyLight/50">
                <td className="px-3 py-2 font-semibold">Zander</td>
                <td className="px-3 py-2 num">50 cm</td>
                <td className="px-3 py-2 num">× 1,3</td>
              </tr>
              <tr className="border-t border-black/[0.06]">
                <td className="px-3 py-2 font-semibold">Hecht</td>
                <td className="px-3 py-2 num">60 cm</td>
                <td className="px-3 py-2 num">× 1,0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 7. Bonuspunkte */}
      <Section number="7." title="Bonuspunkte">
        <SubHeading>7.1 Topwater (TW)</SubHeading>
        <P>
          Für den Fang eines Barschs, Zanders oder Hechts an der Wasseroberfläche erhält der Teilnehmer <strong>10 Bonuspunkte</strong>, sofern der Fisch das jeweilige Mindestmaß erreicht.
        </P>

        <SubHeading>7.2 Anzahl Boni</SubHeading>
        <P>Der Topwater-Bonus wird nur einmalig gewährt.</P>
      </Section>

      {/* 8. Strafpunkte */}
      <Section number="8." title="Strafpunkte (!)">
        <SubHeading>8.1. Abriss</SubHeading>
        <P>Ein Abriss wird mit <strong>20 Strafpunkten</strong> bewertet.</P>

        <SubHeading>8.2. Falsches Handling</SubHeading>
        <P>
          Falsches Handling führt zu einer <strong>10-minütigen Angelsperre</strong>. Die Einhaltung dieser Regel erfolgt im Sinne des sportlichen Fair Play durch die Teilnehmer selbst.
        </P>
      </Section>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-cs-sm mb-3">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[13px] font-bold text-spc-mid num tabular-nums">{number}</span>
        <h2 className="text-[19px] sm:text-[21px] font-bold text-spc-dark tracking-tight">{title}</h2>
      </div>
      <div className="space-y-2.5 text-[14.5px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[15px] font-bold text-spc-dark mt-4 mb-1">{children}</h3>;
}

function MiniHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[13.5px] font-bold text-spc-dark mt-3 mb-1">{children}</h4>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14.5px] leading-relaxed text-ink">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-spc-mid">
      {children}
    </ul>
  );
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-spc-lighter/50 border-l-4 border-spc-mid rounded-r-xl px-4 py-3 my-3">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-spc-mid mb-1">{label}</div>
      <div className="text-[14px] text-ink leading-relaxed">{children}</div>
    </div>
  );
}
