import { requireAdmin } from "@/lib/auth";
import { getPrepCompetition, getActiveCompetition, getCompetitionFull } from "@/lib/queries";
import { CreateForm, ParticipantPicker, RemoveButton, FinishButton, GenerateCallsButton, WettkampfzeitForm, ManualCallForm, CallRow } from "./SetupForm";
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

  const STATUS_LABEL: Record<string, string> = { prep: "Vorbereitung", running: "läuft", paused: "pausiert", finished: "beendet" };
  const statusLabel = STATUS_LABEL[comp.status] ?? comp.status;
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

      <div className="mb-3">
        <WettkampfzeitForm comp={comp} />
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
              ? `${calls.length} Call-Zeitfenster · verteilt auf ${boats.length} Boote · respektiert Wettkampfzeit und Pause.`
              : "Noch keine Calls. Automatisch verteilen — die Calls orientieren sich an der eingestellten Wettkampfzeit und lassen die Pause aus."}
          </p>

          {/* Calls pro Boot */}
          {boats.map(b => {
            const boatParticipants = members
              .filter(m => m.boat_id === b.id)
              .map(m => {
                const u = users.find(u => u.id === m.user_id);
                return { id: m.user_id, label: u?.nickname ?? u?.name ?? "?", boat_id: b.id };
              });
            const allParticipants = members.map(m => {
              const u = users.find(u => u.id === m.user_id);
              return { id: m.user_id, label: u?.nickname ?? u?.name ?? "?", boat_id: m.boat_id };
            });
            const boatCalls = calls.filter((c: any) => c.boat_id === b.id).sort((a: any, b: any) => +new Date(a.start_at) - +new Date(b.start_at));
            return (
              <div key={b.id} className="mb-4">
                <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold mb-1.5">{b.label}</div>
                {boatCalls.length === 0 ? (
                  <div className="text-[12.5px] text-ink-3 italic mb-2">Noch keine Calls für dieses Boot.</div>
                ) : (
                  <div className="space-y-1.5 mb-2">
                    {boatCalls.map((c: any) => <CallRow key={c.id} call={c} participants={allParticipants} />)}
                  </div>
                )}
                {boatParticipants.length > 0 && (comp.status === "prep" || comp.status === "running") && (
                  <ManualCallForm competitionId={comp.id} boats={[b]} participants={boatParticipants} />
                )}
              </div>
            );
          })}

          {(comp.status === "prep" || comp.status === "running") && (
            <GenerateCallsButton competitionId={comp.id} hasCalls={calls.length > 0} />
          )}
        </div>
      )}

      {/* Abschluss der Konfiguration — bewusst KEIN Start-Button hier.
          Der Wettkampf startet ausschliesslich manuell im Bereich Wettkampf steuern. */}
      {comp.status === "prep" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-cs-sm mt-3">
          <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">Konfiguration</div>
          <div className="text-[19px] font-bold text-spc-dark mt-0.5">
            {canStart ? "Bereit zur Steuerung" : `Noch ${2 - members.length} Teilnehmer:in fehlt`}
          </div>
          <p className="text-[13px] text-ink-3 mt-1 mb-3">
            Der Wettkampf bleibt vorbereitet. <strong className="text-spc-dark">Anlegen und Konfigurieren startet den Wettkampf NICHT.</strong> Zum Starten wechselst du in den Bereich „Wettkampf steuern" und drückst dort auf <em>„Wettkampf starten"</em>.
          </p>
          {canStart ? (
            <Link href={`/admin/wettkampf?id=${comp.id}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-spc-dark text-white font-bold text-[14.5px] hover:bg-spc-mid transition shadow-cs-sm">
              Zur Wettkampf-Steuerung
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          ) : (
            <div className="text-[12.5px] text-ink-3 italic">Weise mindestens 2 Teilnehmer:innen einem Boot zu, dann wird der Wechsel zur Steuerung freigeschaltet.</div>
          )}
        </div>
      )}
      {comp.status === "running" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-cs-sm mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-success-dark font-bold">Läuft</div>
            <div className="text-[15px] font-bold text-spc-dark">Wettkampf ist gestartet</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/wettkampf?id=${comp.id}`} className="text-[13px] font-semibold text-spc-mid hover:underline">Zur Steuerung →</Link>
            <FinishButton competitionId={comp.id} />
          </div>
        </div>
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
