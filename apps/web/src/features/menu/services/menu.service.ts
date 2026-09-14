import type { MenuCatalog, MenuSection } from "../types";

export const menuService = {
  getSections(catalog: MenuCatalog): MenuSection[] {
    return catalog.menus.flatMap((menu) => menu.categories);
  },
};
