import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SupportMessageAuthor = "user" | "support" | "system";

export interface SupportMessage {
  id: string;
  sender: SupportMessageAuthor;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: Array<{
    id: string;
    uri: string;
    type: string;
    name?: string;
  }>;
}

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high";

export interface SupportTicket {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  lastAgentName?: string;
  satisfactionScore?: number | null;
}

export interface SupportStateSnapshot {
  tickets: SupportTicket[];
  activeTicketId: string | null;
  unreadCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

interface SupportActions {
  setTickets: (tickets: SupportTicket[]) => void;
  upsertTicket: (ticket: SupportTicket) => void;
  addMessageToTicket: (ticketId: string, message: SupportMessage) => void;
  setActiveTicket: (ticketId: string | null) => void;
  markTicketRead: (ticketId: string) => void;
  setUnreadCount: (count: number) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncedAt: (timestamp: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type SupportState = SupportStateSnapshot & SupportActions;

const createInitialSnapshot = (): SupportStateSnapshot => ({
  tickets: [],
  activeTicketId: null,
  unreadCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
});

const initialSnapshot = createInitialSnapshot();

export const getInitialSupportStateSnapshot = (): SupportStateSnapshot =>
  createInitialSnapshot();

export const useSupportStore = create<SupportState>()(
  persist(
    (set) => ({
      ...initialSnapshot,
      setTickets: (tickets) => set({ tickets }),
      upsertTicket: (ticket) =>
        set((state) => {
          const index = state.tickets.findIndex((entry) => entry.id === ticket.id);
          if (index >= 0) {
            const updatedTickets = state.tickets.slice();
            updatedTickets[index] = { ...updatedTickets[index], ...ticket };
            return { tickets: updatedTickets };
          }

          return { tickets: [ticket, ...state.tickets] };
        }),
      addMessageToTicket: (ticketId, message) =>
        set((state) => {
          const tickets = state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  messages: [...ticket.messages, message],
                  updatedAt: message.timestamp,
                  status:
                    message.sender === "support" && ticket.status === "resolved"
                      ? "open"
                      : ticket.status,
                }
              : ticket,
          );

          const unreadCount =
            message.sender === "support"
              ? state.unreadCount + 1
              : state.unreadCount;

          return { tickets, unreadCount };
        }),
      setActiveTicket: (ticketId) => set({ activeTicketId: ticketId }),
      markTicketRead: (ticketId) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  messages: ticket.messages.map((message) => ({
                    ...message,
                    read: true,
                  })),
                }
              : ticket,
          ),
          unreadCount: 0,
        })),
      setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      setError: (error) => set({ error }),
      reset: () => set(() => createInitialSnapshot()),
    }),
    {
      name: "twin-support-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tickets: state.tickets,
        activeTicketId: state.activeTicketId,
        unreadCount: state.unreadCount,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
