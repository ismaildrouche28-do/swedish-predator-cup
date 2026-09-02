import { requireAdmin } from "@/lib/auth";
import { getPrepCompetition, getActiveCompetition, getCompetitionFull } from "@/lib/queries";
import { CreateForm, ParticipantPicker, RemoveButton, StartButton, FinishButton, GenerateCallsButton } from "./SetupForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  requireAdmin();
  const active = await getActiveCompetition();
  const prep = active ? null : await getPrepCompetition();
  const comp = active ?? prep;

  if (!comp) return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Kein Wettkampf</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Los geht's</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">Es läuft aktuell kein SPC. Leg jetzt einen neuen an — Teilnehmer, Boote und Regeln folgen im nächsten Schritt.</p>
      </section>
      <div className="max-w-[540px]"><CreateForm /></div>
    </div>
  );

  const { boats, members, users, calls } = await getCompetitionFull(comp.id);
  const usersById = new Map(users.map(u => [u.id, u]));
  const assignedUserIds = new Set(members.map(m => m.user_id));
  const availableUsers = users.filter(u => !assignedUserIds.has(u.id));

  const membersByBoat = new Map<string, any[]>();
  for (const b of boats) membersByBoat.set(b.id, []);
  for (const m of members) {
    const u = usersById.get(m.user_id);
    if (u) membersByBoat.get(m.boat_id)?.push(u);
  }

  const statusLabel = { prep: "Vorbereitung", running: "läuft", paused: "pausiert", finished: "beendet" }[comp.status];
  const canStart = comp.status === "prep" && members.length >= 2;

  return (
    <div>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">{comp.name} · {statusLabel}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Wettkampf-Setup</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">
          {comp.status === "prep" ? "Bis zum Start dürfen alle anpassen. Danach werden Einstellungen fixiert." : "Wettkampf läuft — Einstellungen sind fixiert."}
        </p>
      </section>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[16px] font-bold text-spc-dark mb-1">Grunddaten</div>
        <p className="text-[13px] text-ink-3 mb-3">Name, Ort und Zeitrahmen</p>
        <div className="grid sm:grid-cols-2 gap-2 text-[14px]">
          <Field label="Name">{comp.name}</Field>
          <Field label="Ort">{comp.location ?? "—"}</Field>
          <Field label="Start">{comp.start_at ? new Date(comp.start_at).toLocaleString("de-DE") : "—"}</Field>
          <Field label="Ende">{comp.end_at ? new Date(comp.end_at).toLocaleString("de-DE") : "—"}</Field>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
        <div className="text-[16px] font-bold text-spc-dark mb-1">Teilnehmer & Boote</div>
        <p className="text-[13px] text-ink-3 mb-3">Bis zu 6 Teilnehmer:innen · zwei Boote · <strong className="text-spc-dark font-semibold">{members.length} zugewiesen</strong> · {availableUsers.length} verfügbar</p>

        {comp.status === "prep" && members.length === 0 && (
          <div className="bg-spc-lighter rounded-xl px-3 py-2.5 mb-4 text-[13px] text-spc-dark">
            👇 <strong className="font-bold">Nächster Schritt:</strong> weis unten mindestens 2 Teilnehmer einem Boot zu — dann erscheint der Start-Button.
          </div>
        )}
        {comp.status === "prep" && members.length === 1 && (
          <div className="bg-spc-lighter rounded-xl px-3 py-2.5 mb-4 text-[13px] text-spc-dark">
            👇 Noch <strong>ein Teilnehmer</strong> mehr, dann kann der Wettkampf starten.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {boats.map(b => (
            <div key={b.id} className="rounded-2xl bg-spc-greyLight p-3">
              <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold mb-2">{b.label} · {(membersByBoat.get(b.id) ?? []).length} Teilnehmer</div>
              <div className="space-y-1.5">
                {(membersByBoat.get(b.id) ?? []).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-spc-mid text-white flex items-center justify-center text-[13px] font-bold">
                        {(u.nickname ?? u.name).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="text-[14px] font-semibold">{u.nickname ?? u.name}</div>
                    </div>
                    {comp.status === "prep" && <RemoveButton boatId={b.id} userId={u.id} />}
                  </div>
                ))}
                {(membersByBoat.get(b.id) ?? []).length === 0 && (
                  <div className="text-[12.5px] text-ink-3 italic px-3 py-2">Noch niemand zugewiesen</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {comp.status === "prep" && <ParticipantPicker availableUsers={availableUsers} boats={boats} />}
      </div>


      {/* Call-Planung */}
      {members.length >= 2 && (
        <div className="bg-white rounded-3xl p-5 shadow-cs-sm mb-3">
          <div className="text-[16px] font-bold text-spc-dark mb-1">Call-Planung</div>
          <p className="text-[13px] text-ink-3 mb-3">
            {calls.length > 0
              ? `${calls.length} Call-Zeitfenster verteilt · jedes Boot gleichmäßig aufgeteilt.`
              : "Noch keine Calls definiert. Klick den Button für automatische Verteilung — jeder Bootsmember bekommt ein gleich langes Zeitfenster zwischen Start und Ende."}
          </p>
          {calls.length > 0 && (
            <div className="space-y-1.5">
              {calls.map((c: any) => {
                const u = users.find(u => u.id === c.user_id);
                const boat = boats.find(b => b.id === c.boat_id);
                return (
                  <div key={c.id} className="grid grid-cols-[110px_1fr_auto] gap-3 items-center bg-spc-greyLight rounded-xl px-3 py-2 text-[13px]">
                    <div className="num font-semibold text-spc-dark">
                      {new Date(c.start_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–{new Date(c.end_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      <strong className="font-semibold text-[14px]">{u?.nickname ?? u?.name ?? "?"}</strong>
                      <span className="ml-1.5 text-[11.5px] text-ink-3">{({morning:"Morning",mid:"Mid",late:"Late"} as any)[c.call_type]}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-spc-lighter text-spc-dark uppercase tracking-wider">{boat?.label?.split(" ").pop()}</span>
                  </div>
                );
              })}
            </div>
          )}
          {(comp.status === "prep" || comp.status === "running") && (
            <GenerateCallsButton competitionId={comp.id} hasCalls={calls.length > 0} />
          )}
        </div>
      )}

      {canStart && <StartButton competitionId={comp.id} />}
      {comp.status === "prep" && members.length < 2 && (
        <div className="mt-4 text-center text-[12.5px] text-ink-3">Der Start-Button erscheint, sobald min. 2 Teilnehmer zugewiesen sind.</div>
      )}
      {comp.status === "running" && (
        <div className="mt-6 text-center"><FinishButton competitionId={comp.id} /></div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-spc-greyLight rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-3 font-bold mb-0.5">{label}</div>
      <div className="text-[14px] text-spc-dark font-semibold">{children}</div>
    </div>
  );
}
