import { supabaseAdmin } from "./supabase";
import { calcPoints, assignScoredSlots, DEFAULT_SETTINGS, type Species, type ScoredCatch, type Settings } from "./scoring";

export async function getActiveCompetition() {
  const { data } = await supabaseAdmin
    .from("competitions")
    .select("*")
    .in("status", ["running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getPrepCompetition() {
  const { data } = await supabaseAdmin
    .from("competitions")
    .select("*")
    .eq("status", "prep")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getLatestCompetition() {
  const { data } = await supabaseAdmin
    .from("competitions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getCompetitionFull(competitionId: string) {
  const [{ data: comp }, { data: settings }, { data: boats }, { data: members }, { data: calls }, { data: users }] = await Promise.all([
    supabaseAdmin.from("competitions").select("*").eq("id", competitionId).maybeSingle(),
    supabaseAdmin.from("competition_settings").select("*").eq("competition_id", competitionId).maybeSingle(),
    supabaseAdmin.from("boats").select("*").eq("competition_id", competitionId).order("sort_order"),
    supabaseAdmin.from("boat_members").select("*, boats!inner(competition_id)").eq("boats.competition_id", competitionId),
    supabaseAdmin.from("calls").select("*").eq("competition_id", competitionId).order("start_at"),
    supabaseAdmin.from("users").select("id, name, nickname, avatar_url, is_admin").eq("is_active", true),
  ]);
  return { comp, settings, boats: boats ?? [], members: members ?? [], calls: calls ?? [], users: users ?? [] };
}

export async function getLiveRanking(competitionId: string) {
  const [{ data }, { data: admins }] = await Promise.all([
    supabaseAdmin.from("live_ranking").select("*").eq("competition_id", competitionId),
    supabaseAdmin.from("users").select("id").eq("is_admin", true),
  ]);
  const adminIds = new Set((admins ?? []).map((a: any) => a.id));
  const rows = (data ?? [])
    .filter((r: any) => !adminIds.has(r.user_id))
    .sort((a: any, b: any) => (b.points ?? 0) - (a.points ?? 0));
  return rows;
}

export async function getCatchesForUser(competitionId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from("catches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("user_id", userId)
    .order("caught_at", { ascending: false });
  return data ?? [];
}

export async function getAllCatches(competitionId: string) {
  const { data } = await supabaseAdmin
    .from("catches")
    .select("*")
    .eq("competition_id", competitionId)
    .order("caught_at", { ascending: false });
  return data ?? [];
}

export async function getTopFish(competitionId: string) {
  const { data } = await supabaseAdmin
    .from("catches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("is_valid", true)
    .order("total_points", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getUsers() {
  const { data } = await supabaseAdmin.from("users").select("*").eq("is_active", true).order("name");
  return data ?? [];
}

export async function getCurrentCall(competitionId: string) {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("calls")
    .select("*, users(name, nickname), boats(label)")
    .eq("competition_id", competitionId)
    .lte("start_at", now)
    .gte("end_at", now);
  return data ?? [];
}

export async function getUpcomingCalls(competitionId: string, limit = 6) {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("calls")
    .select("*, users(name, nickname), boats(label)")
    .eq("competition_id", competitionId)
    .gte("start_at", now)
    .order("start_at")
    .limit(limit);
  return data ?? [];
}
