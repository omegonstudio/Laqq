import {
  useCategoriesList,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "./useProducts";

export {
  useCategoriesList,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
};

// Alias legado (mantener compatibilidad con nombre original con typo)
export const useCategorys = useCategoriesList;
