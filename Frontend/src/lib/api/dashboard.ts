import { api } from "./client";
import { DashboardSummary } from "@/types/api";

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary/"),
};

