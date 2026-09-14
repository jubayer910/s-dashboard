"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";

// This demo has no sign-in yet, so every action validates its input and only
// touches rows that already exist. Add authorization here once auth is in place.

type ActionResult = { ok: true } | { ok: false; error: string };

const id = z.coerce.number().int().positive();
const workspaceId = z.string().min(1).max(64);

function failure(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
  console.error(error);
  return { ok: false, error: "Something went wrong. Try again." };
}

export async function markNotificationRead(notificationId: number): Promise<ActionResult> {
  try {
    const parsed = id.parse(notificationId);
    await (await getDb())
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(eq(schema.notifications.id, parsed), isNull(schema.notifications.readAt)));
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function markAllNotificationsRead(workspace: string): Promise<ActionResult> {
  try {
    const parsed = workspaceId.parse(workspace);
    await (await getDb())
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(eq(schema.notifications.workspaceId, parsed), isNull(schema.notifications.readAt)));
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function setLegPinned(legId: number, pinned: boolean): Promise<ActionResult> {
  try {
    const parsed = z.object({ legId: id, pinned: z.boolean() }).parse({ legId, pinned });
    await (await getDb()).update(schema.legs).set({ pinned: parsed.pinned }).where(eq(schema.legs.id, parsed.legId));
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

const messageInput = z.object({
  legId: id,
  body: z.string().trim().min(1, "Write a message first").max(1000, "Keep it under 1,000 characters"),
});

export async function sendLeaderMessage(input: { legId: number; body: string }): Promise<ActionResult> {
  try {
    const parsed = messageInput.parse(input);
    const [leg] = await (await getDb()).select({ id: schema.legs.id }).from(schema.legs).where(eq(schema.legs.id, parsed.legId));
    if (!leg) return { ok: false, error: "That team no longer exists" };
    await (await getDb()).insert(schema.messages).values(parsed);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

const inviteInput = z.object({
  workspace: workspaceId,
  email: z.email("Enter a valid email address"),
  role: z.enum(["Leader", "Member", "Viewer"]),
});

export async function inviteMember(input: { workspace: string; email: string; role: string }): Promise<ActionResult> {
  try {
    const parsed = inviteInput.parse(input);
    const existing = await (await getDb())
      .select({ id: schema.invitations.id })
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.workspaceId, parsed.workspace),
          sql`lower(${schema.invitations.email}) = lower(${parsed.email})`,
        ),
      );
    if (existing.length > 0) return { ok: false, error: "That person is already invited" };
    await (await getDb()).insert(schema.invitations).values({ workspaceId: parsed.workspace, email: parsed.email, role: parsed.role });
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

const settingsInput = z.object({
  workspace: workspaceId,
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(40),
  role: z.string().trim().min(2, "Role needs at least 2 characters").max(40),
  goalPerPerson: z.coerce.number().min(0.1, "Goal must be at least 0.1").max(10, "Goal must be 10 or less"),
});

export async function updateWorkspaceSettings(input: {
  workspace: string;
  name: string;
  role: string;
  goalPerPerson: number;
}): Promise<ActionResult> {
  try {
    const parsed = settingsInput.parse(input);
    const initials = parsed.name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
    await (await getDb())
      .update(schema.workspaces)
      .set({ name: parsed.name, role: parsed.role, goalPerPerson: parsed.goalPerPerson, initials })
      .where(eq(schema.workspaces.id, parsed.workspace));
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
