import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/data/mockDeals", () => ({
  loadDeals: vi.fn(),
  saveDeals: vi.fn(),
  resetDeals: vi.fn(() => []),
}));

import { useDeals } from "@/hooks/useDeals";
import { loadDeals, saveDeals } from "@/data/mockDeals";

describe("useDeals persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists empty arrays after initial load", async () => {
    vi.mocked(loadDeals).mockReturnValue([]);

    renderHook(() => useDeals());

    expect(saveDeals).toHaveBeenCalledWith([]);
  });
});
