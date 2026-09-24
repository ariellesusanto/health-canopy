"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  nextRequestId,
  OPEN_STATUSES,
  seedRequests,
  sortRequests,
  type RequestStatus,
  type SupplyRequest,
} from "./supply-requests";

const STORAGE_KEY = "hc_supply_requests";

type NewRequest = Omit<SupplyRequest, "id" | "status" | "submittedAt">;

type RequestsContextValue = {
  requests: SupplyRequest[];
  /** Count of requests still waiting on somebody — drives the sidebar badge. */
  openCount: number;
  submitRequest: (draft: NewRequest) => SupplyRequest;
  setStatus: (id: string, status: RequestStatus, reviewNote?: string) => void;
  resetRequests: () => void;
};

const RequestsContext = createContext<RequestsContextValue | null>(null);

export function SupplyRequestsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [requests, setRequests] = useState<SupplyRequest[]>(seedRequests);

  // Rehydrate anything submitted earlier in the session. The server
  // prerenders this page from the seed, so reading storage any earlier
  // than mount would desync hydration — the setState is deliberate.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRequests(parsed as SupplyRequest[]);
      }
    } catch {
      // Private mode / blocked storage — the seed data is fine on its own.
    }
  }, []);

  const persist = useCallback((list: SupplyRequest[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Non-fatal: the demo still works from in-memory state.
    }
  }, []);

  const submitRequest = useCallback(
    (draft: NewRequest) => {
      const created: SupplyRequest = {
        ...draft,
        id: nextRequestId(requests),
        status: "submitted",
        // The app runs on a frozen demo clock, but a brand-new request
        // should still read as the most recent thing in the queue.
        submittedAt: new Date().toISOString(),
      };
      const next = [created, ...requests];
      setRequests(next);
      persist(next);
      return created;
    },
    [requests, persist]
  );

  const setStatus = useCallback(
    (id: string, status: RequestStatus, reviewNote?: string) => {
      setRequests((prev) => {
        const next = prev.map((r) =>
          r.id === id
            ? { ...r, status, reviewNote: reviewNote ?? r.reviewNote }
            : r
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetRequests = useCallback(() => {
    setRequests(seedRequests);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<RequestsContextValue>(
    () => ({
      requests: sortRequests(requests),
      openCount: requests.filter((r) => OPEN_STATUSES.includes(r.status)).length,
      submitRequest,
      setStatus,
      resetRequests,
    }),
    [requests, submitRequest, setStatus, resetRequests]
  );

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useSupplyRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) {
    throw new Error(
      "useSupplyRequests must be used inside <SupplyRequestsProvider>"
    );
  }
  return ctx;
}
