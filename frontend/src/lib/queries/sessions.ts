import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "../api";
import { contactKeys, sessionKeys, analysisKeys } from "./keys";

/** Fetch a single session with its contact and analysis. */
export function useSession(id: string, options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async () => {
      const res = await api.getSession(id);
      return res.data!;
    },
    enabled: !!id,
    ...options,
  });
}

/** Create a session and auto-send SMS invite. */
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (contactId: string) => {
      const res = await api.createSession(contactId);
      return res.data!;
    },
    onSuccess: (_data: any, contactId: string) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

/** Join a pending session via contact ID. Returns LiveKit credentials. */
export function useJoinSession() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (contactId: string) => {
      const res = await api.joinSession(contactId);
      return res.data!;
    },
    onSuccess: (_data: any, contactId: string) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
    },
  });
}

/** Send a chat message during an active session. */
export function useChat() {
  return useMutation<any, Error, { sessionId: string; text: string }>({
    mutationFn: async ({ sessionId, text }) => {
      const res = await api.chat(sessionId, text);
      return res.data!;
    },
  });
}

/** Save geolocation on a session. */
export function useSaveLocation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { sessionId: string; latitude: number; longitude: number }>({
    mutationFn: async ({ sessionId, latitude, longitude }) => {
      const res = await api.saveLocation(sessionId, { latitude, longitude });
      return (res as any).data;
    },
    onSuccess: (_data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.sessionId) });
    },
  });
}

/** Mark a session as completed and pull the transcript. */
export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (sessionId: string) => {
      const res = await api.completeSession(sessionId);
      return res.data!;
    },
    onSuccess: (data: any, sessionId: string) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      if (data?.contactId) {
        queryClient.invalidateQueries({ queryKey: contactKeys.detail(data.contactId) });
      }
    },
  });
}

/** Trigger Gemini analysis on a completed session. */
export function useAnalyzeSession() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (sessionId: string) => {
      const res = await api.analyzeSession(sessionId);
      return res.data!;
    },
    onSuccess: (_data: any, sessionId: string) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(sessionId) });
    },
  });
}
