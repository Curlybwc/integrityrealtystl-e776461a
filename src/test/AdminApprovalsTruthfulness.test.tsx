import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 07.14 truthfulness interim fix (carve-out from the AdminApprovals
// role-mapping item, Packet 1 freeze §3): the UI must never display or
// persist "Approved" when the role grant it claims actually failed.
// Canon binds the full role-mapping fix to joint (ag) sequencing behind
// 07.11's counsel gate; this packet changes ONLY the truthfulness of the
// displayed state — grant first, and "Approved" is recorded and shown
// only after the grant has succeeded.

const h = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  toast: vi.fn(),
  listRequests: vi.fn(),
  updateRequest: vi.fn(),
  upsertRole: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: h.from, auth: { getUser: h.getUser } },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: h.toast }) }));

import AdminApprovals from "@/pages/admin-portal/AdminApprovals";

const pendingRequest = {
  id: "req-1",
  user_id: "user-9",
  portal: "investor",
  status: "pending",
  message: null,
  created_at: "2026-11-01T00:00:00Z",
  profiles: { email: "ina@example.com", full_name: "Ina Investor" },
};

describe("AdminApprovals — approval truthfulness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.from.mockImplementation((table: string) => {
      if (table === "portal_access_requests") {
        return {
          select: () => ({ order: () => h.listRequests() }),
          update: (payload: unknown) => ({ eq: () => h.updateRequest(payload) }),
        };
      }
      if (table === "user_roles") {
        return { upsert: (payload: unknown, opts: unknown) => h.upsertRole(payload, opts) };
      }
      throw new Error(`unexpected table: ${table}`);
    });
    h.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    h.listRequests.mockResolvedValue({ data: [pendingRequest], error: null });
    h.updateRequest.mockResolvedValue({ error: null });
    h.upsertRole.mockResolvedValue({ error: null });
  });

  afterEach(cleanup);

  it("grant failure: no 'Approved' is displayed or persisted, and the failure is shown honestly", async () => {
    h.upsertRole.mockResolvedValue({ error: { message: "permission denied for table user_roles" } });

    render(<AdminApprovals />);
    fireEvent.click(await screen.findByRole("button", { name: /approve/i }));

    // An honest failure toast, in plain words — not a success message.
    await waitFor(() =>
      expect(h.toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Approval failed", variant: "destructive" })
      )
    );
    expect(h.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Access Approved" })
    );

    // The status write must never have happened: the approval was not
    // persisted, and the row still reads Pending — never Approved.
    expect(h.updateRequest).not.toHaveBeenCalled();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("grant success: 'Approved' appears only after the grant resolves, grant before status write", async () => {
    let resolveGrant!: (v: { error: null }) => void;
    h.upsertRole.mockReturnValue(
      new Promise((res) => {
        resolveGrant = res;
      })
    );

    render(<AdminApprovals />);
    fireEvent.click(await screen.findByRole("button", { name: /approve/i }));

    // While the grant is still in flight: no Approved state anywhere,
    // and the status write has not run ahead of the grant.
    await waitFor(() => expect(h.upsertRole).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    expect(h.updateRequest).not.toHaveBeenCalled();

    resolveGrant({ error: null });

    await waitFor(() => expect(screen.getByText("Approved")).toBeInTheDocument());
    expect(h.updateRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
    expect(h.upsertRole.mock.invocationCallOrder[0]).toBeLessThan(
      h.updateRequest.mock.invocationCallOrder[0]
    );
    expect(h.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Access Approved" })
    );
  });

  it("deny: no grant is attempted and the denial records as before", async () => {
    render(<AdminApprovals />);
    fireEvent.click(await screen.findByRole("button", { name: /deny/i }));

    await waitFor(() => expect(screen.getByText("Denied")).toBeInTheDocument());
    expect(h.upsertRole).not.toHaveBeenCalled();
    expect(h.updateRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: "denied" })
    );
  });
});
