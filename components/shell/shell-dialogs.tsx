"use client";

import { Mail01Icon, Settings01Icon, Tick02Icon, UserAdd02Icon } from "@hugeicons/core-free-icons";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { inviteMember, sendLeaderMessage, updateWorkspaceSettings } from "@/app/actions";
import { Dialog, DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Icon, type IconData } from "@/components/ui/icon";
import { Button, Divider } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { useShell } from "./shell-provider";

function DialogFrame({
  icon,
  title,
  description,
  children,
  footer,
  onSubmit,
}: {
  icon: IconData;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="control grid size-8 shrink-0 place-items-center text-label">
            <Icon icon={icon} size={16} />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <DialogTitle className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">{title}</DialogTitle>
            <DialogDescription className="text-[14px] leading-[18px] text-muted">{description}</DialogDescription>
          </div>
        </div>
        <DialogClose />
      </div>
      <Divider />
      <div className="flex flex-col gap-4 px-6 py-5">{children}</div>
      <Divider />
      <div className="flex items-center justify-end gap-[10px] px-5 py-[14px]">{footer}</div>
    </form>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" icon={Tick02Icon} iconClassName="text-lime" className="text-lime" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function MessageDialog({ legId, legName }: { legId: number; legName: string }) {
  const { closeDialog } = useShell();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <DialogFrame
      icon={Mail01Icon}
      title={`Message ${legName}`}
      description="Both leaders receive it in their Stride inbox."
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await sendLeaderMessage({ legId, body });
          if (!result.ok) return setError(result.error);
          toast.success(`Message sent to ${legName}`);
          closeDialog();
        });
      }}
      footer={
        <>
          <Button onClick={closeDialog}>Cancel</Button>
          <SubmitButton pending={pending} label="Send message" />
        </>
      }
    >
      <Field label="Message" htmlFor="message-body" error={error} hint={`${body.length}/1,000`}>
        <TextArea
          id="message-body"
          autoFocus
          value={body}
          maxLength={1000}
          aria-invalid={Boolean(error)}
          placeholder="Great week on MG1 — what helped most?"
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
          }}
        />
      </Field>
    </DialogFrame>
  );
}

function InviteDialog() {
  const { workspace, closeDialog } = useShell();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Leader" | "Member" | "Viewer">("Member");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <DialogFrame
      icon={UserAdd02Icon}
      title="Invite members"
      description={`They’ll join ${workspace.name} once they accept.`}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await inviteMember({ workspace: workspace.id, email, role });
          if (!result.ok) return setError(result.error);
          toast.success(`Invitation sent to ${email}`);
          closeDialog();
        });
      }}
      footer={
        <>
          <Button onClick={closeDialog}>Cancel</Button>
          <SubmitButton pending={pending} label="Send invite" />
        </>
      }
    >
      <Field label="Email" htmlFor="invite-email" error={error}>
        <TextInput
          id="invite-email"
          type="email"
          autoFocus
          autoComplete="off"
          value={email}
          aria-invalid={Boolean(error)}
          placeholder="name@company.com"
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
        />
      </Field>
      <div className="flex flex-col gap-[6px]">
        <span className="text-[12px] leading-4 text-kpi">Role</span>
        <Segmented
          label="Role"
          variant="range"
          value={role}
          onValueChange={setRole}
          options={[
            { value: "Leader", label: "Leader" },
            { value: "Member", label: "Member" },
            { value: "Viewer", label: "Viewer" },
          ]}
          className="self-start"
        />
      </div>
    </DialogFrame>
  );
}

function SettingsDialog() {
  const { workspace, closeDialog } = useShell();
  const [name, setName] = useState(workspace.name);
  const [role, setRole] = useState(workspace.role);
  const [goal, setGoal] = useState(String(workspace.goalPerPerson));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <DialogFrame
      icon={Settings01Icon}
      title="Workspace settings"
      description="Changes apply to everyone in this workspace."
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateWorkspaceSettings({ workspace: workspace.id, name, role, goalPerPerson: Number(goal) });
          if (!result.ok) return setError(result.error);
          toast.success("Workspace settings saved");
          closeDialog();
        });
      }}
      footer={
        <>
          <Button onClick={closeDialog}>Cancel</Button>
          <SubmitButton pending={pending} label="Save changes" />
        </>
      }
    >
      <Field label="Workspace name" htmlFor="ws-name">
        <TextInput id="ws-name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} />
      </Field>
      <Field label="Subtitle" htmlFor="ws-role">
        <TextInput id="ws-role" value={role} onChange={(e) => { setRole(e.target.value); setError(null); }} />
      </Field>
      <Field
        label="Weekly MG1 goal per person"
        htmlFor="ws-goal"
        error={error}
        hint="A leg hits its week when MG1 ≥ goal × people. Drives the Weeks column."
      >
        <TextInput
          id="ws-goal"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0.1"
          max="10"
          className="tnum"
          value={goal}
          onChange={(e) => { setGoal(e.target.value); setError(null); }}
        />
      </Field>
    </DialogFrame>
  );
}

export function ShellDialogs() {
  const { dialog, closeDialog } = useShell();
  // Keep the last dialog's content mounted while the exit transition plays.
  const [shown, setShown] = useState(dialog);
  if (dialog.kind !== null && dialog !== shown) setShown(dialog);
  const key = shown.kind === null ? "none" : `${shown.kind}-${shown.seq}`;

  return (
    <Dialog open={dialog.kind !== null} onOpenChange={(open) => !open && closeDialog()} width={520}>
      {shown.kind === "message" ? <MessageDialog key={key} legId={shown.legId} legName={shown.legName} /> : null}
      {shown.kind === "invite" ? <InviteDialog key={key} /> : null}
      {shown.kind === "settings" ? <SettingsDialog key={key} /> : null}
    </Dialog>
  );
}
