import { useMutation } from "@tanstack/react-query";
import { api } from "../api";
import type { SendInviteInput } from "./types";

/** Manually send an SMS invite to a contact for a session. */
export function useSendInvite() {
  return useMutation<any, Error, SendInviteInput>({
    mutationFn: async ({ contactId, sessionId }: SendInviteInput) => {
      const res = await api.sendInvite(contactId, sessionId);
      return (res as any).data;
    },
  });
}
