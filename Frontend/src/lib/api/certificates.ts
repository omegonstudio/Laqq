import { api } from "./client";

export type CertificateProvider = "fisher" | "solstice";

export interface CertificateSearchPayload {
  provider: CertificateProvider;
  articleNo?: string;
  lotNo?: string;
}

export interface CertificateResult {
  id?: string;
  title: string;
  lotNumber: string;
  documentType: string;
  fileName: string;
  url: string | null;
  publishDate?: string | null;
  productTitles?: string[];
}

export interface CertificateSearchResponse {
  provider: CertificateProvider;
  message: string;
  results: CertificateResult[];
}

const BASE = "/certificates";

export const certificatesApi = {
  search: (payload: CertificateSearchPayload) =>
    api.post<CertificateSearchResponse>(`${BASE}/search/`, payload),
};
