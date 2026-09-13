import { requireAdmin } from "@/lib/auth";
import { getPrepCompetition, getActiveCompetition, getCompetitionFull } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabase";
import { CreateForm, ParticipantPicker, RemoveButton, FinishButton, GenerateCallsButton, WettkampfzeitForm, ManualCallForm, CallRow, PauseRow } from "./SetupForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: { id?: string; new?: string } }) {
  requireAdmin();

  // 1) Wenn ?new=1 gesetzt: immer CreateForm anzeigen
  // 2) Wenn ?id=X gesetzt: diesen Wettkampf laden
  // 3) Sonst: laufender oder erster prep Wettkampf (Legacy-Fallback)
  let comp: any = null;
  if (searchParams.new === "1") {
    comp = null;
  } else if (searchParams.id) {
    const { data } = await supabaseAdmin.from("competitions").select("*").eq("id", searchParams.id).maybeSingle();
    comp = data;
  } else {
    const active = await getActiveCompetition();
    const prep = active ? null : await getPrepCompetition();
    comp = active ?? prep;
  }

  if (!comp) return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-[13px] text-spc-mid font-semibold mb-3">← Admin</Link>
      <section className="bg-cs-section rounded-3xl p-5 mb-4">
        <div className="text-[11px] font-bold text-spc-mid uppercase tracking-widest mb-1">Neuer Wettkampf</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-spc-dark tracking-tight">Neuen Wettkampf anlegen</h1>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[56ch]">Grunddaten festlegen. Nach dem Anlegen findest du den Wettkampf in der Übersicht — er wird <strong className="text-spc-dark">nicht automatisch aktiv</strong>.</p>
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
          {(() => {
            const totalMin = comp.start_at && comp.end_at
              ? Math.round((+new Date(comp.end_at) - +new Date(comp.start_at)) / 60000) : 0;
            const pauseMin = comp.pause_start && comp.pause_end
              ? Math.round((+new Date(comp.pause_end) - +new Date(comp.pause_start)) / 60000) : 0;
            const effMin = Math.max(0, totalMin - pauseMin);
            const fmtDur = (m: number) => {
              const h = Math.floor(m / 60);
              const r = m % 60;
              return r === 0 ? `${h} h` : `${h} h ${r} min`;
            };
            return effMin > 0 ? (
              <p className="text-[13px] text-ink-3 mb-3">
                Wettkampfzeit {fmtDur(totalMin)} − Pause {fmtDur(pauseMin)} = <strong className="text-spc-dark">{fmtDur(effMin)} verfügbare Call-Zeit</strong>, gleichmäßig pro Boot auf die Teilnehmer verteilt.
              </p>
            ) : (
              <p className="text-[13px] text-ink-3 mb-3">Sobald Angelstart und Angelende gesetzt sind, wird hier die verfügbare Call-Zeit berechnet.</p>
            );
          })()}

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
            // Rows aufbauen: Pause-Zeile einschieben, Fortsetzung markieren
            const rows: Array<{ kind: "call"; call: any; isContinuation: boolean } | { kind: "pause"; startAt: string; endAt: string }> = [];
            const pauseStartMs = comp.pause_start ? +new Date(comp.pause_start) : null;
            const pauseEndMs = comp.pause_end ? +new Date(comp.pause_end) : null;
            let pauseShown = false;
            for (let i = 0; i < boatCalls.length; i++) {
              const c = boatCalls[i];
              const prev = boatCalls[i - 1];
              // Pause-Zeile einschieben, wenn der Uebergang zum vorigen Call ueber die Pause geht
              if (!pauseShown && pauseStartMs && pauseEndMs && prev
                  && +new Date(prev.end_at) <= pauseStartMs && +new Date(c.start_at) >= pauseEndMs) {
                rows.push({ kind: "pause", startAt: comp.pause_start!, endAt: comp.pause_end! });
                pauseShown = true;
              }
              // Fortsetzung: selber User wie vorher UND vorheriger Call endete an der Pause-Grenze
              const isContinuation = !!(prev && prev.user_id === c.user_id
                && pauseStartMs && pauseEndMs
                && +new Date(prev.end_at) <= pauseStartMs && +new Date(c.start_at) >= pauseEndMs);
              rows.push({ kind: "call", call: c, isContinuation });
            }
            // Falls Pause NACH allen Calls liegt (Randfall) trotzdem einblenden
            if (!pauseShown && pauseStartMs && pauseEndMs && boatCalls.length > 0) {
              const lastEnd = +new Date(boatCalls[boatCalls.length - 1].end_at);
              if (lastEnd >= pauseEndMs) {
                // Pause lag mitten drin, wurde aber nicht erkannt (keine sauberen Grenzen) — nichts tun
              }
            }
            const memberCount = boatParticipants.length;
            const timePerMember = memberCount > 0
              ? Math.round(((comp.start_at && comp.end_at
                  ? (+new Date(comp.end_at) - +new Date(comp.start_at)) / 60000 : 0)
                  - (comp.pause_start && comp.pause_end
                      ? (+new Date(comp.pause_end) - +new Date(comp.pause_start)) / 60000 : 0))
                / memberCount)
              : 0;
            const perMemberText = timePerMember > 0
              ? `${memberCount} Teilnehmer · ${Math.floor(timePerMember / 60)} h ${timePerMember % 60 === 0 ? "" : (timePerMember % 60) + " min"} pro Call`
              : `${memberCount} Teilnehmer`;

            return (
              <div key={b.id} className="mb-4">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <div className="text-[11px] uppercase tracking-widest text-spc-mid font-bold">{b.label}</div>
                  <div className="text-[11px] text-ink-3">{perMemberText}</div>
                </div>
                {boatCalls.length === 0 ? (
                  <div className="text-[12.5px] text-ink-3 italic mb-2">Noch keine Calls für dieses Boot.</div>
                ) : (
                  <div className="space-y-1.5 mb-2">
                    {rows.map((row, i) => row.kind === "pause"
                      ? <PauseRow key={`pause-${i}`} startAt={row.startAt} endAt={row.endAt} />
                      : <CallRow key={row.call.id} call={row.call} participants={allParticipants} isContinuation={row.isContinuation} />
                    )}
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
