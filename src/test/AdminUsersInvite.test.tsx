import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// 07.14 Phase 1 / IA-R01 (canon acceptance test 15): the invite form opens
// with zero roles preselected; submitting with no role selected is
// rejected; only explicitly selected roles reach the invite function.
// Rule source: Authority Matrix §8 (adopted 2026-10-25) — admin is never
// a default and nobody is granted a role they were not explicitly given.

const { rpc, from, invoke, getSession, toast } = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  invoke: vi.fn(),
  getSession: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, from, functions: { invoke }, auth: { getSession } },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

import AdminUsers from "@/pages/admin-portal/AdminUsers";

// jsdom lacks ResizeObserver, which the Radix dialog/checkbox primitives
// require; the shared setup only stubs matchMedia.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

const openInviteDialog = async () => {
  render(<AdminUsers />);
  fireEvent.click(await screen.findByRole("button", { name: /invite user/i }));
  return await screen.findByRole("dialog");
};

const roleCheckbox = (dialog: HTMLElement, role: string) => {
  const label = within(dialog).getByText(role, { selector: "label" });
  return within(label).getByRole("checkbox");
};

describe("AdminUsers invite — no default grants (IA-R01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ data: [], error: null });
    from.mockReturnValue({
      select: () => Promise.resolve({ data: [], error: null }),
    });
    getSession.mockResolvedValue({ data: { session: null } });
    invoke.mockResolvedValue({
      data: { user: { id: "new-user-1", email: "sam@example.com" }, roles: ["investor"] },
      error: null,
    });
  });

  afterEach(cleanup);

  it("opens with zero roles preselected", async () => {
    const dialog = await openInviteDialog();
    const boxes = within(dialog).getAllByRole("checkbox");
    expect(boxes).toHaveLength(4);
    for (const box of boxes) {
      expect(box).toHaveAttribute("aria-checked", "false");
    }
  });

  it("rejects a submit with no role selected and never calls the invite function", async () => {
    const dialog = await openInviteDialog();
    fireEvent.change(within(dialog).getByPlaceholderText("sam@integrityrealtystl.com"), {
      target: { value: "sam@example.com" },
    });
    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Select at least one role." })
      )
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it("sends only the explicitly selected role, then resets to zero preselected", async () => {
    const dialog = await openInviteDialog();
    fireEvent.change(within(dialog).getByPlaceholderText("sam@integrityrealtystl.com"), {
      target: { value: "sam@example.com" },
    });
    fireEvent.click(roleCheckbox(dialog, "investor"));
    expect(roleCheckbox(dialog, "investor")).toHaveAttribute("aria-checked", "true");
    expect(roleCheckbox(dialog, "admin")).toHaveAttribute("aria-checked", "false");

    fireEvent.submit(dialog.querySelector("form")!);
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    const [fnName, opts] = invoke.mock.calls[0];
    expect(fnName).toBe("admin-invite-user");
    expect(opts.body.roles).toEqual(["investor"]);

    // After a successful invite the dialog closes; reopening it in the
    // same mount shows the no-default state again (the reset must not
    // restore preselection).
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /invite user/i }));
    const dialog2 = await screen.findByRole("dialog");
    const boxes = within(dialog2).getAllByRole("checkbox");
    expect(boxes).toHaveLength(4);
    for (const box of boxes) {
      expect(box).toHaveAttribute("aria-checked", "false");
    }
  });
});

// Static contract (source-shape check, not an execution): the invite edge
// function must never fall back to a default grant. Live execution proof
// (invoke with no roles -> HTTP 400) is a gate readback at deploy time,
// because this lane has no Management API access to the Integrity project.
describe("admin-invite-user edge function — no default grant (static)", () => {
  const src = readFileSync(
    path.resolve(process.cwd(), "supabase/functions/admin-invite-user/index.ts"),
    "utf8"
  );

  it("has no default-role fallback", () => {
    expect(src).not.toContain(': ["admin"]');
    expect(src).toContain("Array.isArray(roles) ? roles : []");
  });

  it("rejects when no valid roles remain", () => {
    expect(src).toContain("validRoles.length === 0");
    expect(src).toContain("No valid roles provided");
  });
});
