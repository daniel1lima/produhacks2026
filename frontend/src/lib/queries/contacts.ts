import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "../api";
import { contactKeys } from "./keys";
import type { CreateContactInput } from "./types";

/** Fetch all contacts. */
export function useContacts(options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: contactKeys.all,
    queryFn: async () => {
      const res = await api.listContacts();
      return res.data!;
    },
    ...options,
  });
}

/** Fetch a single contact with its sessions and analyses. */
export function useContact(id: string, options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      const res = await api.getContact(id);
      return res.data!;
    },
    enabled: !!id,
    ...options,
  });
}

/** Create a new contact. Invalidates the contacts list on success. */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateContactInput>({
    mutationFn: async (input: CreateContactInput) => {
      const res = await api.createContact(input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}
