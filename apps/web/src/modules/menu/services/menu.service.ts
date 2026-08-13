import { apiClient, createQueryString, type ListQuery } from "@/lib/api";
import type {
  AddOn,
  AddOnGroup,
  MenuCategory,
  MenuCategoryListResponse,
  MenuCategoryStatus,
  MenuItem,
  MenuItemConfiguration,
  MenuItemVariant,
  MenuItemInput,
  MenuItemListResponse,
  MenuItemStatus,
  MenuListResponse,
  RestaurantMenu,
  VariantOption,
} from "../types/menu.types";

const root = (restaurantId: string) => `/restaurants/${restaurantId}`;

export const menuService = {
  listMenus(restaurantId: string, query: ListQuery = {}) {
    return apiClient.get<MenuListResponse>(
      `${root(restaurantId)}/menus${createQueryString(query)}`,
    );
  },
  createMenu(
    restaurantId: string,
    input: Pick<RestaurantMenu, "name"> &
      Partial<Pick<RestaurantMenu, "description" | "sortOrder" | "isActive">>,
  ) {
    return apiClient.post<RestaurantMenu>(`${root(restaurantId)}/menus`, input);
  },
  updateMenu(
    restaurantId: string,
    menuId: string,
    input: Partial<RestaurantMenu>,
  ) {
    return apiClient.patch<RestaurantMenu>(
      `${root(restaurantId)}/menus/${menuId}`,
      input,
    );
  },
  deleteMenu(restaurantId: string, menuId: string) {
    return apiClient.delete<void>(`${root(restaurantId)}/menus/${menuId}`);
  },
  listCategories(
    restaurantId: string,
    query: ListQuery & { menuId?: string; status?: MenuCategoryStatus } = {},
  ) {
    return apiClient.get<MenuCategoryListResponse>(
      `${root(restaurantId)}/menu-categories${createQueryString(query)}`,
    );
  },
  createCategory(
    restaurantId: string,
    input: {
      menuId: string;
      name: string;
      description?: string | null;
      sortOrder?: number;
      status?: MenuCategoryStatus;
    },
  ) {
    return apiClient.post<MenuCategory>(
      `${root(restaurantId)}/menu-categories`,
      input,
    );
  },
  updateCategory(
    restaurantId: string,
    categoryId: string,
    input: Partial<MenuCategory>,
  ) {
    return apiClient.patch<MenuCategory>(
      `${root(restaurantId)}/menu-categories/${categoryId}`,
      input,
    );
  },
  deleteCategory(restaurantId: string, categoryId: string) {
    return apiClient.delete<void>(
      `${root(restaurantId)}/menu-categories/${categoryId}`,
    );
  },
  listItems(
    restaurantId: string,
    query: ListQuery & {
      menuId?: string;
      categoryId?: string;
      status?: MenuItemStatus;
    } = {},
  ) {
    return apiClient.get<MenuItemListResponse>(
      `${root(restaurantId)}/menu-items${createQueryString(query)}`,
    );
  },
  createItem(restaurantId: string, input: MenuItemInput) {
    return apiClient.post<MenuItem>(`${root(restaurantId)}/menu-items`, input);
  },
  updateItem(
    restaurantId: string,
    itemId: string,
    input: Partial<MenuItemInput>,
  ) {
    return apiClient.patch<MenuItem>(
      `${root(restaurantId)}/menu-items/${itemId}`,
      input,
    );
  },
  deleteItem(restaurantId: string, itemId: string) {
    return apiClient.delete<void>(`${root(restaurantId)}/menu-items/${itemId}`);
  },
  getItemConfiguration(restaurantId: string, itemId: string) {
    return apiClient.get<MenuItemConfiguration>(
      `${root(restaurantId)}/menu-items/${itemId}/configuration`,
    );
  },
  uploadItemMedia(restaurantId: string, itemId: string, file: File, alt = "") {
    const body = new FormData();
    body.append("image", file);
    if (alt) body.append("alt", alt);
    return apiClient.post(
      `${root(restaurantId)}/menu-items/${itemId}/media`,
      body,
    );
  },
  removeItemMedia(restaurantId: string, itemId: string, mediaId: string) {
    return apiClient.delete<void>(
      `${root(restaurantId)}/menu-items/${itemId}/media/${mediaId}`,
    );
  },
  createVariant(
    restaurantId: string,
    itemId: string,
    input: { name: string; sortOrder?: number },
  ) {
    return apiClient.post<MenuItemVariant>(
      `${root(restaurantId)}/menu-items/${itemId}/variants`,
      input,
    );
  },
  updateVariant(
    restaurantId: string,
    variantId: string,
    input: { name?: string; sortOrder?: number },
  ) {
    return apiClient.patch<MenuItemVariant>(
      `${root(restaurantId)}/variants/${variantId}`,
      input,
    );
  },
  deleteVariant(restaurantId: string, variantId: string) {
    return apiClient.delete<void>(
      `${root(restaurantId)}/variants/${variantId}`,
    );
  },
  createVariantOption(
    restaurantId: string,
    variantId: string,
    input: { name: string; priceAdjustment: number },
  ) {
    return apiClient.post<VariantOption>(
      `${root(restaurantId)}/variants/${variantId}/options`,
      input,
    );
  },
  updateVariantOption(
    restaurantId: string,
    optionId: string,
    input: { name?: string; priceAdjustment?: number },
  ) {
    return apiClient.patch<VariantOption>(
      `${root(restaurantId)}/variant-options/${optionId}`,
      input,
    );
  },
  deleteVariantOption(restaurantId: string, optionId: string) {
    return apiClient.delete<void>(
      `${root(restaurantId)}/variant-options/${optionId}`,
    );
  },
  listAddOnGroups(restaurantId: string) {
    return apiClient.get<AddOnGroup[]>(`${root(restaurantId)}/add-on-groups`);
  },
  createAddOnGroup(
    restaurantId: string,
    input: Pick<AddOnGroup, "name"> &
      Partial<Pick<AddOnGroup, "required" | "minSelection" | "maxSelection">>,
  ) {
    return apiClient.post<AddOnGroup>(
      `${root(restaurantId)}/add-on-groups`,
      input,
    );
  },
  updateAddOnGroup(
    restaurantId: string,
    groupId: string,
    input: Partial<AddOnGroup>,
  ) {
    return apiClient.patch<AddOnGroup>(
      `${root(restaurantId)}/add-on-groups/${groupId}`,
      input,
    );
  },
  deleteAddOnGroup(restaurantId: string, groupId: string) {
    return apiClient.delete<void>(
      `${root(restaurantId)}/add-on-groups/${groupId}`,
    );
  },
  createAddOn(
    restaurantId: string,
    groupId: string,
    input: Pick<AddOn, "name"> &
      Partial<Pick<AddOn, "sortOrder" | "isAvailable">> & { price: number },
  ) {
    return apiClient.post<AddOn>(
      `${root(restaurantId)}/add-on-groups/${groupId}/add-ons`,
      input,
    );
  },
  updateAddOn(
    restaurantId: string,
    addOnId: string,
    input: Partial<AddOn> & { price?: number },
  ) {
    return apiClient.patch<AddOn>(
      `${root(restaurantId)}/add-ons/${addOnId}`,
      input,
    );
  },
  deleteAddOn(restaurantId: string, addOnId: string) {
    return apiClient.delete<void>(`${root(restaurantId)}/add-ons/${addOnId}`);
  },
  attachAddOnGroup(restaurantId: string, itemId: string, groupId: string) {
    return apiClient.put(
      `${root(restaurantId)}/menu-items/${itemId}/add-on-groups/${groupId}`,
    );
  },
  detachAddOnGroup(restaurantId: string, itemId: string, groupId: string) {
    return apiClient.delete<void>(
      `${root(restaurantId)}/menu-items/${itemId}/add-on-groups/${groupId}`,
    );
  },
};
