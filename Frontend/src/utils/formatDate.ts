export const formatDate = (dateString: string | null) => {
  if (dateString === null) return null;
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
export const formatDateForInput = (dateString: string | null) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split("T")[0];
};
