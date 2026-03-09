interface PortalUser {
  name: string;
  email?: string;
  company?: string;
}

type PortalType = "investor" | "wholesaler" | "partner" | "admin";

const MOCK_USERS: Record<PortalType, PortalUser> = {
  investor: { name: "John Investor", email: "john@example.com" },
  wholesaler: { name: "Mike Wholesaler", email: "mike@deals.com", company: "Quick Flip Properties" },
  partner: { name: "Partner User", email: "partner@integrityrealty.com" },
  admin: { name: "Admin User", email: "admin@integrityrealty.com" },
};

const mockAuthEnabled = import.meta.env.VITE_ENABLE_MOCK_AUTH !== "false";

export function usePortalAuth(portal: PortalType) {
  return {
    isAuthenticated: mockAuthEnabled,
    user: MOCK_USERS[portal],
  };
}

