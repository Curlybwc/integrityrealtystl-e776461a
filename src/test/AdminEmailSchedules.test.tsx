import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from, loadSchedules, update, eq, selectUpdate, saveSchedule } = vi.hoisted(() => ({
  from: vi.fn(), loadSchedules: vi.fn(), update: vi.fn(), eq: vi.fn(), selectUpdate: vi.fn(), saveSchedule: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));

import AdminEmailSchedules from "@/pages/admin-portal/AdminEmailSchedules";

const schedule = {
  id: "schedule-1", client_name: "Mark Parkinson", client_email: "mparkinson@sccmo.org",
  source_type: "sold_report", config: { county: "St. Charles County", lookbackDays: 30 },
  cadence: "monthly", send_mode: "automatic", file_format: "xlsx", is_active: true,
  created_at: "2026-10-19T00:00:00.000Z",
};

describe("AdminEmailSchedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const updateQuery = { eq, select: selectUpdate, maybeSingle: saveSchedule };
    eq.mockReturnValue(updateQuery);
    selectUpdate.mockReturnValue(updateQuery);
    update.mockReturnValue(updateQuery);
    from.mockReturnValue({ select: () => ({ order: () => ({ limit: loadSchedules }) }), update });
    loadSchedules.mockResolvedValue({ data: [schedule], error: null });
  });

  afterEach(cleanup);

  it("lists the schedule and persists only pause/resume changes", async () => {
    saveSchedule.mockResolvedValueOnce({ data: { id: schedule.id, is_active: false }, error: null });
    render(<AdminEmailSchedules />);
    expect(await screen.findByText("Mark Parkinson")).toBeInTheDocument();
    expect(screen.getByText("St. Charles County · At least 32 days")).toBeInTheDocument();
    expect(from).toHaveBeenCalledWith("client_email_schedules");

    fireEvent.click(screen.getByRole("button", { name: "Pause schedule for Mark Parkinson" }));
    await screen.findByText("Paused");
    expect(update).toHaveBeenLastCalledWith({ is_active: false });
    expect(eq).toHaveBeenCalledWith("id", schedule.id);
    expect(eq).toHaveBeenCalledWith("is_active", true);

    saveSchedule.mockResolvedValueOnce({ data: { id: schedule.id, is_active: true }, error: null });
    fireEvent.click(screen.getByRole("button", { name: "Resume schedule for Mark Parkinson" }));
    await screen.findByText("Active");
    expect(update).toHaveBeenLastCalledWith({ is_active: true });
  });

  it("keeps the previous state when pausing fails and displays the error", async () => {
    saveSchedule.mockResolvedValue({ data: null, error: { message: "Update denied" } });
    render(<AdminEmailSchedules />);
    fireEvent.click(await screen.findByRole("button", { name: "Pause schedule for Mark Parkinson" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Update denied");
    await waitFor(() => expect(screen.getByRole("button", { name: "Pause schedule for Mark Parkinson" })).toBeEnabled());
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("reports a concurrent schedule change when the guarded update matches zero rows", async () => {
    saveSchedule.mockResolvedValue({ data: null, error: null });
    render(<AdminEmailSchedules />);
    fireEvent.click(await screen.findByRole("button", { name: "Pause schedule for Mark Parkinson" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This schedule changed. Reload the page and try again.");
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause schedule for Mark Parkinson" })).toBeEnabled();
  });
});
