import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  initials: text("initials").notNull(),
  /** Weekly MG1 goal per person; drives the “Weeks” column. */
  goalPerPerson: real("goal_per_person").notNull().default(0.9),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * A leg is a leadership pair and the people under them.
 * scope: "mine" (legs you lead), "peer" (other legs in your team), "upper" (upline leaders).
 */
export const legs = pgTable(
  "legs",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tier: text("tier"),
    people: integer("people").notNull(),
    reporting: integer("reporting").notNull(),
    scope: text("scope").notNull(),
    since: date("since").notNull(),
    pinned: boolean("pinned").notNull().default(false),
  },
  (t) => [index("legs_workspace_scope_idx").on(t.workspaceId, t.scope)],
);

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  legId: integer("leg_id")
    .notNull()
    .references(() => legs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  /** Share of the leg's MG1 attributed to this member. */
  share: real("share").notNull(),
});

export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    legId: integer("leg_id")
      .notNull()
      .references(() => legs.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    positiveMessages: integer("positive_messages").notNull(),
    mg1: integer("mg1").notNull(),
    followUps: integer("follow_ups").notNull(),
    newCustomers: integer("new_customers").notNull(),
    activeSubs: integer("active_subs").notNull(),
    reporters: integer("reporters").notNull(),
    walkIns: integer("walk_ins").notNull(),
    referrals: integer("referrals").notNull(),
    campaigns: integer("campaigns").notNull(),
    other: integer("other").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.legId, t.day] }),
    index("daily_metrics_day_idx").on(t.day),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    highlight: text("highlight"),
    source: text("source").notNull(),
    legId: integer("leg_id").references(() => legs.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("notifications_workspace_idx").on(t.workspaceId, t.createdAt)],
);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  legId: integer("leg_id")
    .notNull()
    .references(() => legs.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
