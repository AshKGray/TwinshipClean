import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTwinStore } from "../../state/twinStore";
import {
  useSupportStore,
  getInitialSupportStateSnapshot,
  SupportMessage,
  SupportTicket,
} from "../../state/supportStore";

const getSupportStateSnapshot = () => {
  const {
    tickets,
    activeTicketId,
    unreadCount,
    isSyncing,
    lastSyncedAt,
    error,
  } = useSupportStore.getState();

  return { tickets, activeTicketId, unreadCount, isSyncing, lastSyncedAt, error };
};

describe("useTwinStore signOut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSupportStore.getState().reset();
  });

  it("resets the support store and clears persisted storage", () => {
    const messageHistory: SupportMessage[] = [
      {
        id: "message-1",
        sender: "user",
        content: "I need help with the app",
        timestamp: "2024-01-01T00:00:00.000Z",
        read: true,
      },
      {
        id: "message-2",
        sender: "support",
        content: "We're looking into this for you",
        timestamp: "2024-01-01T01:00:00.000Z",
        read: false,
      },
    ];

    const supportTicket: SupportTicket = {
      id: "ticket-1",
      subject: "Twinship support request",
      status: "open",
      priority: "high",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T01:00:00.000Z",
      messages: messageHistory,
    };

    useSupportStore.setState({
      tickets: [supportTicket],
      activeTicketId: supportTicket.id,
      unreadCount: 5,
      isSyncing: true,
      lastSyncedAt: "2024-01-01T02:00:00.000Z",
      error: "Network error",
    });

    useTwinStore.getState().signOut();

    expect(getSupportStateSnapshot()).toEqual(getInitialSupportStateSnapshot());
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("twin-support-store");
  });
});
