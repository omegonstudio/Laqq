import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { DashboardSummary } from "@/types/api";
import { NormalizedApiError } from "@/lib/api/client";

export const useDashboardSummary = () =>
  useQuery<DashboardSummary, NormalizedApiError>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardApi.summary(),
  });

