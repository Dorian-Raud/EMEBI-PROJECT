import { apiFetch } from "./fetch";

export type Company = {
  id: string;
  name: string;
  siret: string;
  vatNumber: string;
};

export const companiesRequester = {
  getAll: () => apiFetch<Company[]>("/companies"),
  getById: (id: string) => apiFetch<Company>(`/companies/${id}`),
  create: (data: Omit<Company, "id">) =>
    apiFetch<Company>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Company>) =>
    apiFetch<Company>(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/api/companies/${id}`, { method: "DELETE" }),
};

