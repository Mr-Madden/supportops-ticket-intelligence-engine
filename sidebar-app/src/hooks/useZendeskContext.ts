/**
 * useZendeskContext — reads the current ticket from ZAF SDK.
 * Falls back to mock data in development (outside Zendesk).
 */

import { useState, useEffect } from "react";

export interface ZendeskTicket {
  ticketId: number;
  subject: string;
  description: string;
  status: string;
  priority: string | null;
  requesterName: string;
  requesterId: number | null;
  tags: string[];
  createdAt: string;
}

interface UseZendeskContextReturn {
  ticket: ZendeskTicket | null;
  isLoading: boolean;
  isZAF: boolean;
}

const DEV_MOCK_TICKET: ZendeskTicket = {
  ticketId: 42891,
  subject: "Cannot login after password reset — getting 401 error",
  description:
    "I reset my password via the email link but now I'm getting a 401 Unauthorized error every time I try to log in. I've tried three times and even used an incognito window. This is very urgent — I have a client presentation in 2 hours and need access to my account.",
  status: "open",
  priority: "high",
  requesterName: "Alex Johnson",
  requesterId: 10023,
  tags: [],
  createdAt: new Date().toISOString(),
};

declare global {
  interface Window {
    ZAFClient?: {
      init: () => {
        get: (keys: string[]) => Promise<Record<string, unknown>>;
        invoke: (method: string, ...args: unknown[]) => Promise<unknown>;
        on: (event: string, handler: (data: unknown) => void) => void;
        resize: (opts: { width: string; height: string }) => void;
      };
    };
  }
}

export function useZendeskContext(): UseZendeskContextReturn {
  const [ticket, setTicket] = useState<ZendeskTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isZAF = typeof window.ZAFClient !== "undefined";

  useEffect(() => {
    if (!isZAF) {
      setTicket(DEV_MOCK_TICKET);
      setIsLoading(false);
      return;
    }

    const client = window.ZAFClient!.init();

    client
      .get([
        "ticket.id",
        "ticket.subject",
        "ticket.description",
        "ticket.status",
        "ticket.priority",
        "ticket.requester.name",
        "ticket.requester.id",
        "ticket.tags",
        "ticket.createdAt",
      ])
      .then((ctx) => {
        setTicket({
          ticketId:      ctx["ticket.id"] as number,
          subject:       (ctx["ticket.subject"] as string) ?? "",
          description:   (ctx["ticket.description"] as string) ?? "",
          status:        (ctx["ticket.status"] as string) ?? "open",
          priority:      ctx["ticket.priority"] as string | null,
          requesterName: (ctx["ticket.requester.name"] as string) ?? "Unknown",
          requesterId:   ctx["ticket.requester.id"] as number | null,
          tags:          (ctx["ticket.tags"] as string[]) ?? [],
          createdAt:     (ctx["ticket.createdAt"] as string) ?? new Date().toISOString(),
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    client.resize({ width: "100%", height: "600px" });
  }, [isZAF]);

  return { ticket, isLoading, isZAF };
}
