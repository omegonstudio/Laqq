import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store";
import { buildCategories } from "@/utils/data/categories";

export const selectCategoriesState = (state: RootState) => state.categories;

export const selectCategoryMenuItems = createSelector(
  [selectCategoriesState],
  (categoriesState) => buildCategories(categoriesState.list)
);

export const selectCategoriesUiState = createSelector(
  [selectCategoriesState, selectCategoryMenuItems],
  (categoriesState, menuItems) => {
    const isLoading =
      categoriesState.status === "loading" ||
      (categoriesState.status === "idle" && categoriesState.loading);
    const isError = categoriesState.status === "error";
    const isEmpty = categoriesState.status === "success" && menuItems.length === 0;

    return {
      status: categoriesState.status,
      loading: isLoading,
      error: categoriesState.error,
      hasData: menuItems.length > 0,
      isError,
      isEmpty,
    };
  }
);
