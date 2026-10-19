import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, buildSoldExport } = vi.hoisted(() => ({
  invoke: vi.fn(),
  buildSoldExport: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
vi.mock("../../supabase/functions/_shared/sold-export", () => ({ buildSoldExport }));
vi.mock("fflate", () => ({ zipSync: vi.fn() }));

import AdminSoldExport from "@/pages/admin-portal/AdminSoldExport";

const row = (index: number) => ({
  address: `${index} Example Drive`, city: "St. Charles", state: "MO", zip: "63301",
  soldDate: "2026-10-18", mlsNumber: `MLS-${index}`,
});

describe("AdminSoldExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-19T00:30:00.000Z"));
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:report");
      static revokeObjectURL = vi.fn();
    });
    buildSoldExport.mockReturnValue({ filename: "report.xlsx", contentType: "application/octet-stream", bytes: new Uint8Array([1, 2, 3]) });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("fetches the default UTC window and exports every row while limiting the preview", async () => {
    const rows = Array.from({ length: 101 }, (_, index) => row(index + 1));
    invoke.mockResolvedValue({ data: { rows, count: rows.length }, error: null });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<AdminSoldExport />);

    expect(screen.getByLabelText("County")).toHaveValue("St. Charles County");
    expect(screen.getByLabelText("Look-back period")).toHaveValue("30");
    fireEvent.click(screen.getByRole("button", { name: "Fetch sold listings" }));

    expect(await screen.findByText("101 sold homes")).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("fetch-sold-listings", { body: {
      county: "St. Charles County", fromDate: "2026-09-20", toDate: "2026-10-19",
    } });
    expect(screen.getByText("100 Example Drive")).toBeInTheDocument();
    expect(screen.queryByText("101 Example Drive")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(101);

    fireEvent.click(screen.getByRole("button", { name: "Download XLSX" }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(buildSoldExport).toHaveBeenCalledWith(rows, "St. Charles County", "2026-09-20", "2026-10-19", "xlsx", expect.any(Function));
    expect(click.mock.instances[0]).toHaveAttribute("download", "report.xlsx");
  });

  it("clears stale results when filters change and uses the new county and window", async () => {
    invoke.mockResolvedValue({ data: { rows: [row(1)], count: 1 }, error: null });
    render(<AdminSoldExport />);
    fireEvent.click(screen.getByRole("button", { name: "Fetch sold listings" }));
    await screen.findByText("1 sold home");

    fireEvent.change(screen.getByLabelText("County"), { target: { value: "St. Louis County" } });
    fireEvent.change(screen.getByLabelText("Look-back period"), { target: { value: "7" } });
    expect(screen.queryByText("1 sold home")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download XLSX" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fetch sold listings" }));
    await screen.findByText("1 sold home");
    expect(invoke).toHaveBeenLastCalledWith("fetch-sold-listings", { body: {
      county: "St. Louis County", fromDate: "2026-10-13", toDate: "2026-10-19",
    } });
  });

  it("disables empty downloads and reports fetch failures without leaving old results", async () => {
    invoke.mockResolvedValueOnce({ data: { rows: [], count: 0 }, error: null });
    render(<AdminSoldExport />);
    fireEvent.click(screen.getByRole("button", { name: "Fetch sold listings" }));
    await screen.findByText("0 sold homes");
    expect(screen.getByRole("button", { name: "Download XLSX" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();

    invoke.mockResolvedValueOnce({ data: null, error: { message: "Access denied" } });
    fireEvent.click(screen.getByRole("button", { name: "Fetch sold listings" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
    expect(screen.queryByText("0 sold homes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fetch sold listings" })).toBeEnabled();
  });
});
