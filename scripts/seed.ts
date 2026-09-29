/**
 * Seeds the Neon database with deterministic demo data.
 * Usage: npm run db:seed   (reads DATABASE_URL from .env.local)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { getDb, schema } from "../lib/db";
import { addDays, diffDays, weekdayIndex } from "../lib/dates";

const START = "2025-01-01";
const AS_OF = process.env.SEED_AS_OF ?? "2026-09-14";
const BATCH = process.env.PGLITE_DIR ? 400 : 2000;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260915);
const jitter = (spread: number) => 1 + (rand() * 2 - 1) * spread;
/** Rounds randomly so small expected values still produce realistic integers. */
const stochastic = (value: number) => Math.max(0, Math.floor(value + rand()));

type Scope = "mine" | "peer" | "upper";
interface LegSeed {
  name: string;
  people: number;
  reporting: number;
  tier: "EMERALD" | "EAGLE" | "PLATINUM" | null;
  scope: Scope;
  productivity: number;
  since: string;
}

const WORKSPACES = [
  { id: "vantage-admin", name: "Vantage Admin", role: "Management", initials: "VA", goalPerPerson: 1.2, sortOrder: 0 },
  { id: "vantage-field", name: "Vantage Field", role: "Operations", initials: "VF", goalPerPerson: 1.1, sortOrder: 1 },
  { id: "vantage-partners", name: "Vantage Partners", role: "Partners", initials: "VP", goalPerPerson: 1.0, sortOrder: 2 },
] as const;

const LEGS: Record<(typeof WORKSPACES)[number]["id"], LegSeed[]> = {
  "vantage-admin": [
    { name: "Luis & Jackie Moreta", people: 16, reporting: 9, tier: null, scope: "mine", productivity: 0.55, since: "2024-02-12" },
    { name: "Julio & Liz Vasquez", people: 55, reporting: 37, tier: "EMERALD", scope: "mine", productivity: 1.15, since: "2024-03-04" },
    { name: "Oscar & Nayrobi Griñán", people: 58, reporting: 31, tier: "EMERALD", scope: "mine", productivity: 0.95, since: "2023-11-20" },
    { name: "Edwin & Wiliannys", people: 32, reporting: 22, tier: "EAGLE", scope: "mine", productivity: 1.0, since: "2024-06-10" },
    { name: "Alberto & Ciany", people: 21, reporting: 18, tier: "PLATINUM", scope: "mine", productivity: 0.7, since: "2024-09-02" },
    { name: "Emmanuel & Sudeidy", people: 18, reporting: 12, tier: null, scope: "mine", productivity: 0.9, since: "2025-01-13" },
    { name: "Domingo & Alejandra", people: 14, reporting: 9, tier: null, scope: "mine", productivity: 0.65, since: "2025-03-03" },
    { name: "Rafael & Yudelka Santos", people: 12, reporting: 8, tier: null, scope: "mine", productivity: 0.75, since: "2025-04-21" },
    { name: "Kelvin & Mariela Paulino", people: 15, reporting: 10, tier: "EAGLE", scope: "mine", productivity: 0.85, since: "2024-12-02" },
    { name: "Ramón & Ana Castillo", people: 40, reporting: 29, tier: "EMERALD", scope: "peer", productivity: 1.05, since: "2023-08-14" },
    { name: "José & Carmen Ureña", people: 33, reporting: 21, tier: "PLATINUM", scope: "peer", productivity: 0.9, since: "2024-01-08" },
    { name: "Luis & Paola Fernández", people: 27, reporting: 16, tier: null, scope: "peer", productivity: 0.8, since: "2024-07-15" },
    { name: "Wilson & Rosa Batista", people: 22, reporting: 15, tier: "EAGLE", scope: "peer", productivity: 0.95, since: "2024-10-07" },
    { name: "Andrés & Carolina Peña", people: 210, reporting: 150, tier: "EMERALD", scope: "upper", productivity: 1.05, since: "2021-05-03" },
    { name: "Miguel & Rosa Almonte", people: 176, reporting: 118, tier: "PLATINUM", scope: "upper", productivity: 0.95, since: "2021-09-13" },
    { name: "Héctor & Luz Cabrera", people: 150, reporting: 96, tier: "EMERALD", scope: "upper", productivity: 0.9, since: "2022-02-21" },
    { name: "Francisco & Elena Díaz", people: 98, reporting: 64, tier: "EAGLE", scope: "upper", productivity: 1.0, since: "2022-08-01" },
  ],
  "vantage-field": [
    { name: "Carlos & Maribel Tavárez", people: 44, reporting: 30, tier: "EMERALD", scope: "mine", productivity: 1.05, since: "2024-01-15" },
    { name: "Pedro & Lucía Guzmán", people: 36, reporting: 22, tier: "EAGLE", scope: "mine", productivity: 0.9, since: "2024-05-06" },
    { name: "Juan & Daniela Rosario", people: 29, reporting: 19, tier: null, scope: "mine", productivity: 0.8, since: "2024-08-19" },
    { name: "Manuel & Sofía Reyes", people: 24, reporting: 17, tier: "PLATINUM", scope: "mine", productivity: 0.95, since: "2024-11-11" },
    { name: "Ángel & Karina Mejía", people: 18, reporting: 11, tier: null, scope: "mine", productivity: 0.7, since: "2025-02-17" },
    { name: "Víctor & Inés Polanco", people: 13, reporting: 8, tier: null, scope: "mine", productivity: 0.6, since: "2025-05-05" },
    { name: "Ernesto & Gloria Jiménez", people: 31, reporting: 20, tier: "EAGLE", scope: "peer", productivity: 0.9, since: "2023-10-02" },
    { name: "Sergio & Patricia Núñez", people: 25, reporting: 14, tier: null, scope: "peer", productivity: 0.85, since: "2024-04-22" },
    { name: "Tomás & Beatriz Acosta", people: 19, reporting: 13, tier: null, scope: "peer", productivity: 0.75, since: "2024-09-30" },
    { name: "Roberto & Diana Marte", people: 160, reporting: 104, tier: "EMERALD", scope: "upper", productivity: 1.0, since: "2021-03-08" },
    { name: "Fernando & Isabel Vargas", people: 132, reporting: 90, tier: "PLATINUM", scope: "upper", productivity: 0.95, since: "2021-11-15" },
    { name: "Ricardo & Teresa Lora", people: 88, reporting: 55, tier: "EAGLE", scope: "upper", productivity: 0.9, since: "2022-06-27" },
  ],
  "vantage-partners": [
    { name: "Gabriel & Mónica Espinal", people: 34, reporting: 24, tier: "EMERALD", scope: "mine", productivity: 1.0, since: "2024-02-05" },
    { name: "Hugo & Verónica Ortiz", people: 26, reporting: 18, tier: "EAGLE", scope: "mine", productivity: 0.9, since: "2024-06-24" },
    { name: "Iván & Claudia Peralta", people: 20, reporting: 13, tier: null, scope: "mine", productivity: 0.8, since: "2024-10-14" },
    { name: "Julián & Natalia Sosa", people: 15, reporting: 10, tier: null, scope: "mine", productivity: 0.7, since: "2025-03-24" },
    { name: "Mario & Adriana Brito", people: 28, reporting: 19, tier: "PLATINUM", scope: "peer", productivity: 0.95, since: "2023-12-11" },
    { name: "Nelson & Rocío Fermín", people: 21, reporting: 12, tier: null, scope: "peer", productivity: 0.8, since: "2024-07-29" },
    { name: "Óscar & Leticia Paredes", people: 120, reporting: 80, tier: "EMERALD", scope: "upper", productivity: 1.0, since: "2021-07-19" },
    { name: "Pablo & Silvia Rivas", people: 94, reporting: 60, tier: "EAGLE", scope: "upper", productivity: 0.9, since: "2022-04-04" },
  ],
};

const FIRST_NAMES = ["Andrea", "Marcos", "Yesenia", "Daniel", "Rosa", "Kevin", "Luz", "Brayan", "Paola", "Samuel", "Yuleisy", "Franklin", "Joselyn", "Wander", "Nicole", "Ariel", "Mildred", "Starlin", "Carolina", "Elvis"];
const LAST_NAMES = ["Pérez", "Rodríguez", "Gómez", "Martínez", "Hernández", "Cruz", "Ramírez", "Torres", "Díaz", "Morales", "Ortega", "Jiménez", "Castro", "Vargas"];

/** "Julio & Liz Vasquez" → ["Julio Vasquez", "Liz Vasquez"]; "Edwin & Wiliannys" → ["Edwin", "Wiliannys"]. */
function leaderNames(legName: string) {
  const [first, second = ""] = legName.split(" & ");
  const [partner, ...surnameParts] = second.split(" ");
  const surname = surnameParts.join(" ");
  return surname ? [`${first} ${surname}`, `${partner} ${surname}`] : [first, partner];
}

async function main() {
  const db = await getDb();
  const days = diffDays(START, AS_OF) + 1;
  console.log(`Seeding ${days} days (${START} → ${AS_OF})`);

  await db.execute(
    sql`truncate table ${schema.invitations}, ${schema.messages}, ${schema.notifications}, ${schema.dailyMetrics}, ${schema.members}, ${schema.legs}, ${schema.workspaces} restart identity cascade`,
  );

  await db.insert(schema.workspaces).values([...WORKSPACES]);

  let metricRows: (typeof schema.dailyMetrics.$inferInsert)[] = [];
  const flush = async () => {
    if (metricRows.length === 0) return;
    await db.insert(schema.dailyMetrics).values(metricRows);
    metricRows = [];
  };

  const legIdsByName = new Map<string, number>();

  for (const ws of WORKSPACES) {
    for (const leg of LEGS[ws.id]) {
      const [row] = await db
        .insert(schema.legs)
        .values({ workspaceId: ws.id, name: leg.name, tier: leg.tier, people: leg.people, reporting: leg.reporting, scope: leg.scope, since: leg.since })
        .returning({ id: schema.legs.id });
      legIdsByName.set(`${ws.id}:${leg.name}`, row.id);
      console.log(`  ${ws.id} · ${leg.name}`);

      // Members: the leader pair plus a handful of top contributors.
      const leaders = leaderNames(leg.name);
      const memberCount = Math.min(leg.people, 8);
      const contributors = memberCount - leaders.length;
      const weights = Array.from({ length: contributors }, () => 0.3 + rand());
      const weightTotal = weights.reduce((a, b) => a + b, 0) || 1;
      const contributorShare = Math.min(0.55, 0.06 * contributors + 0.1);
      await db.insert(schema.members).values([
        { legId: row.id, name: leaders[0], role: "Leader", share: 0.19 },
        { legId: row.id, name: leaders[1], role: "Leader", share: 0.16 },
        ...weights
          .map((w) => (w / weightTotal) * contributorShare)
          .sort((a, b) => b - a)
          .map((share) => ({
            legId: row.id,
            name: `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`,
            role: `Member · ${Math.max(1, Math.round(rand() * 14))} reporting`,
            share: Number(share.toFixed(4)),
          })),
      ]);

      // Daily metrics
      const phase = rand() * Math.PI * 2;
      const phaseEff = rand() * Math.PI * 2;
      const baseEff = 0.29 + 0.035 * (leg.productivity - 0.85);
      const churnRate = 0.0026;
      let subs = leg.people * 7.1 * (0.75 + leg.productivity * 0.3);

      for (let i = 0; i < days; i++) {
        const day = addDays(START, i);
        const weekday = weekdayIndex(day);
        const weekdayFactor = weekday < 5 ? 1.1 : weekday === 5 ? 0.8 : 0.5;
        const season = 1 + 0.14 * Math.sin((2 * Math.PI * i) / 150 + phase) + 0.00035 * i;
        const expected = leg.people * 0.54 * leg.productivity * weekdayFactor * season * jitter(0.28);
        const positive = stochastic(expected);

        const eff = Math.min(0.5, Math.max(0.12, baseEff + 0.03 * Math.sin((2 * Math.PI * i) / 64 + phaseEff) + (rand() - 0.5) * 0.08));
        const mg1 = Math.min(positive, stochastic(positive * eff));
        const followUps = Math.min(mg1, stochastic(mg1 * (0.35 + 0.03 * Math.sin((2 * Math.PI * i) / 90 + phase))));
        const newCustomers = Math.min(followUps, stochastic(followUps * (0.33 + rand() * 0.06)));

        subs = Math.max(0, subs + newCustomers - subs * churnRate * jitter(0.5));
        const reporters = Math.min(leg.people, stochastic(leg.reporting * (weekday < 5 ? 0.97 : 0.86) * jitter(0.12)));

        const shares = [0.38 * jitter(0.15), 0.32 * jitter(0.15), 0.2 * jitter(0.2), 0.1 * jitter(0.3)];
        const shareTotal = shares.reduce((a, b) => a + b, 0);
        const referrals = Math.floor((positive * shares[1]) / shareTotal);
        const campaigns = Math.floor((positive * shares[2]) / shareTotal);
        const other = Math.floor((positive * shares[3]) / shareTotal);
        const walkIns = positive - referrals - campaigns - other;

        metricRows.push({
          legId: row.id,
          day,
          positiveMessages: positive,
          mg1,
          followUps,
          newCustomers,
          activeSubs: Math.round(subs),
          reporters,
          walkIns,
          referrals,
          campaigns,
          other,
        });
        if (metricRows.length >= BATCH) await flush();
      }
    }
  }
  await flush();

  const now = Date.now();
  const ago = (minutes: number) => new Date(now - minutes * 60_000);
  const admin = (name: string) => legIdsByName.get(`vantage-admin:${name}`) ?? null;
  await db.insert(schema.notifications).values([
    { workspaceId: "vantage-admin", kind: "tier", title: "Julio & Liz Vasquez reached Emerald tier", source: "Team performance", legId: admin("Julio & Liz Vasquez"), createdAt: ago(12) },
    { workspaceId: "vantage-admin", kind: "report", title: "Weekly report for Sep 8–14 is ready", source: "Reports", createdAt: ago(62) },
    { workspaceId: "vantage-admin", kind: "alert", title: "Efficiency dropped 2.4 pts vs prior", highlight: "2.4 pts", source: "Alerts", createdAt: ago(185) },
    { workspaceId: "vantage-admin", kind: "mention", title: "Oscar Griñán mentioned you", source: "Weekly analysis", legId: admin("Oscar & Nayrobi Griñán"), createdAt: ago(60 * 26), readAt: ago(60 * 20) },
    { workspaceId: "vantage-admin", kind: "report", title: "Monthly report for August is ready", source: "Reports", createdAt: ago(60 * 24 * 6), readAt: ago(60 * 24 * 5) },
    { workspaceId: "vantage-admin", kind: "mention", title: "Alberto & Ciany mentioned you", source: "Numbers", legId: admin("Alberto & Ciany"), createdAt: ago(60 * 24 * 9), readAt: ago(60 * 24 * 8) },
    { workspaceId: "vantage-field", kind: "tier", title: "Manuel & Sofía Reyes reached Platinum tier", source: "Team performance", legId: legIdsByName.get("vantage-field:Manuel & Sofía Reyes") ?? null, createdAt: ago(45) },
    { workspaceId: "vantage-field", kind: "report", title: "Weekly report for Sep 8–14 is ready", source: "Reports", createdAt: ago(90) },
    { workspaceId: "vantage-partners", kind: "alert", title: "Reporting rate fell 4.1 pts vs prior", highlight: "4.1 pts", source: "Alerts", createdAt: ago(240) },
  ]);

  const [{ count }] = (await db.execute(sql`select count(*)::int as count from daily_metrics`)).rows as { count: number }[];
  console.log(`Done. ${count} daily metric rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
