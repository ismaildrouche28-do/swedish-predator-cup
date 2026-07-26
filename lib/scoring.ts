export type Species = "perch" | "zander" | "pike";

export type SpeciesRule = { min_cm: number; factor: number; label_de: string };

export type Settings = {
  species_rules: Record<Species, SpeciesRule>;
  topwater_bonus: number;
  abriss_penalty: number;
  handling_ban_minutes: number;
  max_fish_total: number;
  max_fish_per_species: number;
};

export const DEFAULT_SETTINGS: Settings = {
  species_rules: {
    perch:  { min_cm: 25, factor: 2.0, label_de: "Barsch" },
    zander: { min_cm: 50, factor: 1.3, label_de: "Zander" },
    pike:   { min_cm: 60, factor: 1.0, label_de: "Hecht" },
  },
  topwater_bonus: 10,
  abriss_penalty: 20,
  handling_ban_minutes: 10,
  max_fish_total: 6,
  max_fish_per_species: 4,
};

export type CatchInput = {
  id: string;
  species: Species;
  length_cm: number;
  topwater: boolean;
  caught_at: string;
};

export type ScoredCatch = CatchInput & {
  base_points: number;
  bonus_points: number;
  total_points: number;
  is_valid: boolean;
  is_scored?: boolean;
};

export function calcPoints(c: CatchInput, s: Settings): ScoredCatch {
  const rule = s.species_rules[c.species];
  const isValid = c.length_cm >= rule.min_cm;
  const base = isValid ? Math.round(c.length_cm * rule.factor) : 0;
  const bonus = isValid && c.topwater ? s.topwater_bonus : 0;
  return { ...c, base_points: base, bonus_points: bonus, total_points: base + bonus, is_valid: isValid };
}

export function assignScoredSlots(catches: ScoredCatch[], s: Settings): ScoredCatch[] {
  const valid = catches.filter(c => c.is_valid);
  const sorted = [...valid].sort((a, b) =>
    b.total_points - a.total_points || +new Date(a.caught_at) - +new Date(b.caught_at)
  );

  const counts: Record<Species, number> = { perch: 0, zander: 0, pike: 0 };
  const scoredIds = new Set<string>();
  let total = 0;

  for (const c of sorted) {
    if (total >= s.max_fish_total) break;
    if (counts[c.species] >= s.max_fish_per_species) continue;
    const variety = (counts.perch>0?1:0) + (counts.zander>0?1:0) + (counts.pike>0?1:0);
    if (total >= 4 && variety < 3 && counts[c.species] > 0) continue;
    scoredIds.add(c.id);
    counts[c.species]++;
    total++;
  }

  return catches.map(c => ({ ...c, is_scored: scoredIds.has(c.id) }));
}

export function upgradeThreshold(
  species: Species, scoredCatches: ScoredCatch[], s: Settings
): number {
  const same = scoredCatches.filter(c => c.species === species);
  if (same.length === 0) return s.species_rules[species].min_cm;
  const weakest = Math.min(...same.map(c => c.length_cm));
  return weakest + 1;
}
