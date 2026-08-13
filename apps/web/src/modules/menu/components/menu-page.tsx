"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Badge,
  Alert,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Form,
  FormField,
  Input,
  ListSkeleton,
  LoadingButton,
  Modal,
  PageHeader,
  PageSkeleton,
  Pagination,
  Select,
  Textarea,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useRealtimeEvent } from "@/lib/realtime";
import { useToast } from "@/lib/toast";
import { useActiveRestaurant } from "@/modules/restaurants";
import { menuService } from "../services/menu.service";
import type {
  MenuCategory,
  MenuItem,
  MenuItemInput,
  MenuItemStatus,
  RestaurantMenu,
} from "../types/menu.types";
import { ItemConfigurationDialog } from "./item-configuration-dialog";

const PAGE_SIZE = 10;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.messages.join(" ") : fallback;

export function MenuPage() {
  const { can, currentRestaurant, currentRestaurantId } = useActiveRestaurant();
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [referenceStatus, setReferenceStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [itemStatus, setItemStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [statusFilter, setStatusFilter] = useState<MenuItemStatus | "">("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<RestaurantMenu | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null,
  );
  const [deletingMenu, setDeletingMenu] = useState<RestaurantMenu | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(
    null,
  );
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | "new" | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const itemRequest = useRef(0);
  const realtimeRefresh = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localMutationUntil = useRef(0);

  const loadReferences = useCallback(
    async (silent = false) => {
      if (!currentRestaurantId) return;
      if (!silent) setReferenceStatus("loading");
      try {
        const [menuResult, categoryResult] = await Promise.all([
          menuService.listMenus(currentRestaurantId, { limit: 100 }),
          menuService.listCategories(currentRestaurantId, { limit: 100 }),
        ]);
        setMenus(menuResult.data);
        setCategories(categoryResult.data);
        setSelectedMenuId((current) =>
          menuResult.data.some((menu) => menu.id === current)
            ? current
            : (menuResult.data[0]?.id ?? ""),
        );
        setReferenceStatus("ready");
      } catch {
        if (!silent) setReferenceStatus("error");
      }
    },
    [currentRestaurantId],
  );

  const loadItems = useCallback(async () => {
    if (!currentRestaurantId || !selectedMenuId) {
      setItems([]);
      setItemStatus("ready");
      return;
    }
    const request = ++itemRequest.current;
    setItemStatus("loading");
    try {
      const result = await menuService.listItems(currentRestaurantId, {
        page,
        limit: PAGE_SIZE,
        menuId: selectedMenuId,
        categoryId: selectedCategoryId || undefined,
        status: statusFilter || undefined,
        search: appliedSearch || undefined,
      });
      if (request !== itemRequest.current) return;
      setItems(result.data);
      setTotalPages(result.pagination.totalPages);
      setItemStatus("ready");
    } catch {
      if (request === itemRequest.current) setItemStatus("error");
    }
  }, [
    appliedSearch,
    currentRestaurantId,
    page,
    selectedCategoryId,
    selectedMenuId,
    statusFilter,
  ]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    if (referenceStatus === "ready") void loadItems();
  }, [loadItems, referenceStatus]);

  useEffect(
    () => () => {
      if (realtimeRefresh.current) clearTimeout(realtimeRefresh.current);
    },
    [],
  );

  const handleRealtimeChange = useCallback(
    (payload: { restaurantId: string }) => {
      if (
        payload.restaurantId !== currentRestaurantId ||
        Date.now() < localMutationUntil.current
      )
        return;
      if (realtimeRefresh.current) clearTimeout(realtimeRefresh.current);
      realtimeRefresh.current = setTimeout(() => {
        void Promise.all([loadItems(), loadReferences(true)]);
      }, 180);
    },
    [currentRestaurantId, loadItems, loadReferences],
  );
  useRealtimeEvent("menu:item_created", handleRealtimeChange);
  useRealtimeEvent("menu:item_updated", handleRealtimeChange);
  useRealtimeEvent("menu:item_deleted", handleRealtimeChange);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.menuId === selectedMenuId),
    [categories, selectedMenuId],
  );
  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId);
  const canCreate = can("menu.create");
  const canUpdate = can("menu.update");
  const canDelete = can("menu.delete");
  const currency = currentRestaurant?.currency ?? "EUR";

  const selectMenu = (menuId: string) => {
    setSelectedMenuId(menuId);
    setSelectedCategoryId("");
    setPage(1);
  };

  const saveAvailability = async (item: MenuItem, status: MenuItemStatus) => {
    if (!currentRestaurantId) return;
    const previous = item.status;
    localMutationUntil.current = Date.now() + 1_000;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, status } : entry,
      ),
    );
    try {
      await menuService.updateItem(currentRestaurantId, item.id, { status });
      toast.success("Availability updated");
    } catch (error) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: previous } : entry,
        ),
      );
      toast.error("Could not update availability", {
        description: errorMessage(error, "Please try again."),
      });
    }
  };

  const removeItem = async () => {
    if (!currentRestaurantId || !deletingItem) return;
    setDeleting(true);
    const snapshot = items;
    localMutationUntil.current = Date.now() + 1_000;
    setItems((current) =>
      current.filter((entry) => entry.id !== deletingItem.id),
    );
    try {
      await menuService.deleteItem(currentRestaurantId, deletingItem.id);
      setDeletingItem(null);
      toast.success("Menu item deleted");
    } catch (error) {
      setItems(snapshot);
      toast.error("Could not delete menu item", {
        description: errorMessage(error, "Please try again."),
      });
    } finally {
      setDeleting(false);
    }
  };

  const removeMenu = async () => {
    if (!currentRestaurantId || !deletingMenu) return;
    setDeleting(true);
    try {
      await menuService.deleteMenu(currentRestaurantId, deletingMenu.id);
      setMenus((current) =>
        current.filter((entry) => entry.id !== deletingMenu.id),
      );
      setDeletingMenu(null);
      toast.success("Menu deleted");
      await loadReferences(true);
    } catch (error) {
      toast.error("Could not delete menu", {
        description: errorMessage(error, "Please try again."),
      });
    } finally {
      setDeleting(false);
    }
  };

  const removeCategory = async () => {
    if (!currentRestaurantId || !deletingCategory) return;
    setDeleting(true);
    try {
      await menuService.deleteCategory(
        currentRestaurantId,
        deletingCategory.id,
      );
      setCategories((current) =>
        current.filter((entry) => entry.id !== deletingCategory.id),
      );
      if (selectedCategoryId === deletingCategory.id) setSelectedCategoryId("");
      setDeletingCategory(null);
      toast.success("Category deleted");
      await loadReferences(true);
    } catch (error) {
      toast.error("Could not delete category", {
        description: errorMessage(error, "Please try again."),
      });
    } finally {
      setDeleting(false);
    }
  };

  if (referenceStatus === "loading") {
    return <PageSkeleton className="menu-page" />;
  }

  if (referenceStatus === "error") {
    return (
      <ErrorState
        action={
          <Button onClick={() => void loadReferences()}>Try again</Button>
        }
        description="Menus and categories could not be loaded."
        title="Menu unavailable"
      />
    );
  }

  return (
    <div className="menu-page">
      <PageHeader
        actions={
          canCreate && visibleCategories.length ? (
            <Button onClick={() => setEditingItem("new")}>Add item</Button>
          ) : undefined
        }
        description="Organize categories, pricing, and service availability."
        eyebrow={currentRestaurant?.name ?? "Restaurant"}
        title="Menu"
      />

      {!menus.length ? (
        <EmptyState
          action={
            canCreate ? (
              <Button onClick={() => setMenuDialogOpen(true)}>
                Create menu
              </Button>
            ) : undefined
          }
          description="Create the first menu before adding categories and items."
          icon="M"
          title="No menus yet"
        />
      ) : (
        <>
          <div className="menu-toolbar">
            <Form
              className="menu-search"
              spacing="sm"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setAppliedSearch(search.trim());
              }}
            >
              <Input
                aria-label="Search menu items"
                placeholder="Search menu items"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </Form>
            <Select
              aria-label="Menu"
              value={selectedMenuId}
              onChange={(event) => selectMenu(event.target.value)}
            >
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Availability"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as MenuItemStatus | "");
                setPage(1);
              }}
            >
              <option value="">All availability</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="HIDDEN">Hidden</option>
            </Select>
          </div>

          <div className="menu-workspace">
            <aside className="menu-categories" aria-label="Menu categories">
              <div className="menu-categories__heading">
                <div>
                  <span>Categories</span>
                  <strong>{selectedMenu?.name}</strong>
                </div>
                <span className="menu-rail-actions">
                  {canUpdate && selectedMenu ? (
                    <button
                      aria-label="Edit menu"
                      type="button"
                      onClick={() => setEditingMenu(selectedMenu)}
                    >
                      ✎
                    </button>
                  ) : null}
                  {canDelete && selectedMenu ? (
                    <button
                      aria-label="Delete menu"
                      type="button"
                      onClick={() => setDeletingMenu(selectedMenu)}
                    >
                      ×
                    </button>
                  ) : null}
                  {canCreate ? (
                    <button
                      aria-label="Add category"
                      type="button"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      +
                    </button>
                  ) : null}
                </span>
              </div>
              <button
                className={!selectedCategoryId ? "is-active" : ""}
                type="button"
                onClick={() => {
                  setSelectedCategoryId("");
                  setPage(1);
                }}
              >
                <span>All items</span>
              </button>
              {visibleCategories.map((category) => (
                <div
                  className={
                    selectedCategoryId === category.id
                      ? "menu-category-row is-active"
                      : "menu-category-row"
                  }
                  key={category.id}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setPage(1);
                    }}
                  >
                    <span>{category.name}</span>
                    <small>{category._count?.menuItems ?? 0}</small>
                  </button>
                  {canUpdate ? (
                    <button
                      aria-label={`Edit ${category.name}`}
                      className="menu-category-action"
                      type="button"
                      onClick={() => setEditingCategory(category)}
                    >
                      ✎
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      aria-label={`Delete ${category.name}`}
                      className="menu-category-action"
                      type="button"
                      onClick={() => setDeletingCategory(category)}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </aside>

            <section className="menu-items" aria-label="Menu items">
              {itemStatus === "loading" ? <ListSkeleton rows={5} /> : null}
              {itemStatus === "error" ? (
                <ErrorState
                  action={
                    <Button onClick={() => void loadItems()}>Retry</Button>
                  }
                  description="The menu items could not be loaded."
                />
              ) : null}
              {itemStatus === "ready" && !visibleCategories.length ? (
                <EmptyState
                  action={
                    canCreate ? (
                      <Button onClick={() => setCategoryDialogOpen(true)}>
                        Add category
                      </Button>
                    ) : undefined
                  }
                  description="Every menu item belongs to a category."
                  title="Add the first category"
                />
              ) : null}
              {itemStatus === "ready" &&
              visibleCategories.length &&
              !items.length ? (
                <EmptyState
                  action={
                    canCreate ? (
                      <Button onClick={() => setEditingItem("new")}>
                        Add item
                      </Button>
                    ) : undefined
                  }
                  description="No items match the current menu filters."
                  title="No menu items"
                />
              ) : null}
              {itemStatus === "ready" && items.length ? (
                <>
                  <MenuItemTable
                    canDelete={canDelete}
                    canUpdate={canUpdate}
                    categories={categories}
                    currency={currency}
                    items={items}
                    onAvailability={saveAvailability}
                    onDelete={setDeletingItem}
                    onEdit={setEditingItem}
                    onConfigure={setConfiguringItem}
                  />
                  <Pagination
                    currentPage={page}
                    label="Menu item pages"
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </>
              ) : null}
            </section>
          </div>
        </>
      )}

      <MenuDialog
        menu={null}
        open={menuDialogOpen}
        restaurantId={currentRestaurantId}
        onOpenChange={setMenuDialogOpen}
        onSaved={async (menu) => {
          await loadReferences();
          setSelectedMenuId(menu.id);
        }}
      />
      <MenuDialog
        menu={editingMenu}
        open={editingMenu !== null}
        restaurantId={currentRestaurantId}
        onOpenChange={(open) => {
          if (!open) setEditingMenu(null);
        }}
        onSaved={async () => {
          await loadReferences();
          setEditingMenu(null);
        }}
      />
      <CategoryDialog
        category={null}
        menuId={selectedMenuId}
        open={categoryDialogOpen}
        restaurantId={currentRestaurantId}
        onOpenChange={setCategoryDialogOpen}
        onSaved={() => loadReferences(true)}
      />
      <CategoryDialog
        category={editingCategory}
        menuId={selectedMenuId}
        open={editingCategory !== null}
        restaurantId={currentRestaurantId}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        onSaved={async () => {
          await loadReferences(true);
          setEditingCategory(null);
        }}
      />
      <ItemDialog
        categories={visibleCategories}
        item={editingItem === "new" ? null : editingItem}
        open={editingItem !== null}
        preferredCategoryId={selectedCategoryId}
        restaurantId={currentRestaurantId}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
        onSaved={async () => {
          localMutationUntil.current = Date.now() + 1_000;
          await loadItems();
        }}
      />
      <ConfirmDialog
        confirmLabel="Delete item"
        description={
          deletingItem
            ? `Delete ${deletingItem.name}? It will no longer appear in the menu.`
            : ""
        }
        loading={deleting}
        open={deletingItem !== null}
        title="Delete menu item?"
        onConfirm={() => void removeItem()}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingItem(null);
        }}
      />
      <ConfirmDialog
        confirmLabel="Delete menu"
        description={
          deletingMenu
            ? `Delete ${deletingMenu.name} and its categories from active menu management?`
            : ""
        }
        loading={deleting}
        open={deletingMenu !== null}
        title="Delete menu?"
        onConfirm={() => void removeMenu()}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingMenu(null);
        }}
      />
      <ConfirmDialog
        confirmLabel="Delete category"
        description={
          deletingCategory
            ? `Delete ${deletingCategory.name}? Its items will no longer appear in active menus.`
            : ""
        }
        loading={deleting}
        open={deletingCategory !== null}
        title="Delete category?"
        onConfirm={() => void removeCategory()}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingCategory(null);
        }}
      />
      <ItemConfigurationDialog
        item={configuringItem}
        open={configuringItem !== null}
        restaurantId={currentRestaurantId}
        onChanged={() => {
          localMutationUntil.current = Date.now() + 1_000;
          void loadItems();
        }}
        onOpenChange={(open) => {
          if (!open) setConfiguringItem(null);
        }}
      />
    </div>
  );
}

function MenuItemTable({
  canDelete,
  canUpdate,
  categories,
  currency,
  items,
  onAvailability,
  onDelete,
  onEdit,
  onConfigure,
}: {
  canDelete: boolean;
  canUpdate: boolean;
  categories: MenuCategory[];
  currency: string;
  items: MenuItem[];
  onAvailability: (item: MenuItem, status: MenuItemStatus) => Promise<void>;
  onDelete: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onConfigure: (item: MenuItem) => void;
}) {
  const money = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency }),
    [currency],
  );
  return (
    <div className="menu-table-wrap">
      <table className="menu-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Price</th>
            <th>Availability</th>
            <th>
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const image = item.media[0];
            return (
              <tr key={item.id}>
                <td>
                  <span className="menu-item-identity">
                    <span className="menu-item-image">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image.media.url} alt={image.alt ?? ""} />
                      ) : (
                        item.name.charAt(0)
                      )}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.description || "No description"}</small>
                    </span>
                  </span>
                </td>
                <td>
                  {categories.find(
                    (category) => category.id === item.categoryId,
                  )?.name ?? "Unknown"}
                </td>
                <td>{money.format(Number(item.basePrice))}</td>
                <td>
                  {canUpdate ? (
                    <Select
                      aria-label={`${item.name} availability`}
                      value={item.status}
                      onChange={(event) =>
                        void onAvailability(
                          item,
                          event.target.value as MenuItemStatus,
                        )
                      }
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                      <option value="HIDDEN">Hidden</option>
                    </Select>
                  ) : (
                    <Badge
                      tone={item.status === "AVAILABLE" ? "success" : "warning"}
                    >
                      {item.status.toLowerCase()}
                    </Badge>
                  )}
                </td>
                <td>
                  <span className="menu-item-actions">
                    {canUpdate ? (
                      <>
                        <Button variant="ghost" onClick={() => onEdit(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => onConfigure(item)}
                        >
                          Configure
                        </Button>
                      </>
                    ) : null}
                    {canDelete ? (
                      <Button variant="ghost" onClick={() => onDelete(item)}>
                        Delete
                      </Button>
                    ) : null}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MenuDialog({
  menu,
  onOpenChange,
  onSaved,
  open,
  restaurantId,
}: {
  menu: RestaurantMenu | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (menu: RestaurantMenu) => Promise<void>;
  open: boolean;
  restaurantId: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setName(menu?.name ?? "");
    setDescription(menu?.description ?? "");
    setError("");
  }, [menu, open]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId) return;
    setSaving(true);
    setError("");
    try {
      const saved = menu
        ? await menuService.updateMenu(restaurantId, menu.id, {
            name: name.trim(),
            description: description.trim() || null,
          })
        : await menuService.createMenu(restaurantId, {
            name: name.trim(),
            description: description.trim() || null,
          });
      await onSaved(saved);
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught, "Could not create the menu."));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      description={
        menu
          ? "Update how this menu appears to staff and guests."
          : "Menus contain categories and their items."
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton form="create-menu-form" loading={saving} type="submit">
            {menu ? "Save menu" : "Create menu"}
          </LoadingButton>
        </>
      }
      open={open}
      title={menu ? "Edit menu" : "Create menu"}
      onOpenChange={onOpenChange}
    >
      <Form id="create-menu-form" onSubmit={submit}>
        {error ? <Alert>{error}</Alert> : null}
        <FormField htmlFor="menu-name" label="Name">
          <Input
            id="menu-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField htmlFor="menu-description" label="Description">
          <Textarea
            id="menu-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>
      </Form>
    </Modal>
  );
}

function CategoryDialog({
  category,
  menuId,
  onOpenChange,
  onSaved,
  open,
  restaurantId,
}: {
  category: MenuCategory | null;
  menuId: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
  open: boolean;
  restaurantId: string | null;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setError("");
  }, [category, open]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId || !menuId) return;
    setSaving(true);
    setError("");
    try {
      if (category)
        await menuService.updateCategory(restaurantId, category.id, {
          name: name.trim(),
        });
      else
        await menuService.createCategory(restaurantId, {
          menuId,
          name: name.trim(),
        });
      await onSaved();
      setName("");
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught, "Could not create the category."));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      description={
        category
          ? "Rename this category without moving its items."
          : "Categories keep the menu organized for staff and guests."
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            form="create-category-form"
            loading={saving}
            type="submit"
          >
            {category ? "Save category" : "Add category"}
          </LoadingButton>
        </>
      }
      open={open}
      title={category ? "Edit category" : "Add category"}
      onOpenChange={onOpenChange}
    >
      <Form id="create-category-form" onSubmit={submit}>
        {error ? <Alert>{error}</Alert> : null}
        <FormField htmlFor="category-name" label="Name">
          <Input
            id="category-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
      </Form>
    </Modal>
  );
}

function ItemDialog({
  categories,
  item,
  onOpenChange,
  onSaved,
  open,
  preferredCategoryId,
  restaurantId,
}: {
  categories: MenuCategory[];
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
  open: boolean;
  preferredCategoryId: string;
  restaurantId: string | null;
}) {
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    sku: "",
    price: "",
    preparationTime: "",
    calories: "",
    isFeatured: false,
    sortOrder: "0",
    status: "AVAILABLE" as MenuItemStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      categoryId:
        item?.categoryId || preferredCategoryId || categories[0]?.id || "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      sku: item?.sku ?? "",
      price: item ? String(item.basePrice) : "",
      preparationTime:
        item?.preparationTime == null ? "" : String(item.preparationTime),
      calories: item?.calories == null ? "" : String(item.calories),
      isFeatured: item?.isFeatured ?? false,
      sortOrder: String(item?.sortOrder ?? 0),
      status: item?.status ?? "AVAILABLE",
    });
    setError("");
  }, [categories, item, open, preferredCategoryId]);

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId) return;
    setSaving(true);
    setError("");
    const input: MenuItemInput = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      sku: form.sku.trim() || null,
      price: Number(form.price),
      preparationTime:
        form.preparationTime === "" ? null : Number(form.preparationTime),
      calories: form.calories === "" ? null : Number(form.calories),
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder),
      status: form.status,
    };
    try {
      if (item) await menuService.updateItem(restaurantId, item.id, input);
      else await menuService.createItem(restaurantId, input);
      await onSaved();
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught, "Could not save the menu item."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      description="Set the item identity, price, placement, and availability."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton form="menu-item-form" loading={saving} type="submit">
            {item ? "Save item" : "Create item"}
          </LoadingButton>
        </>
      }
      open={open}
      title={item ? "Edit menu item" : "Create menu item"}
      onOpenChange={onOpenChange}
    >
      <Form id="menu-item-form" onSubmit={submit}>
        {error ? <Alert>{error}</Alert> : null}
        <div className="field-grid">
          <FormField htmlFor="item-name" label="Name">
            <Input
              id="item-name"
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="item-category" label="Category">
            <Select
              id="item-category"
              required
              value={form.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField fullWidth htmlFor="item-description" label="Description">
            <Textarea
              id="item-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="item-sku" label="SKU">
            <Input
              id="item-sku"
              value={form.sku}
              onChange={(event) => update("sku", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="item-preparation" label="Preparation (minutes)">
            <Input
              id="item-preparation"
              min="0"
              type="number"
              value={form.preparationTime}
              onChange={(event) =>
                update("preparationTime", event.target.value)
              }
            />
          </FormField>
          <FormField htmlFor="item-calories" label="Calories">
            <Input
              id="item-calories"
              min="0"
              type="number"
              value={form.calories}
              onChange={(event) => update("calories", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="item-price" label="Price">
            <Input
              id="item-price"
              min="0"
              step="0.01"
              required
              type="number"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="item-sort" label="Sort order">
            <Input
              id="item-sort"
              min="0"
              required
              type="number"
              value={form.sortOrder}
              onChange={(event) => update("sortOrder", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="item-status" label="Availability">
            <Select
              id="item-status"
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="HIDDEN">Hidden</option>
            </Select>
          </FormField>
          <Checkbox
            checked={form.isFeatured}
            label="Feature this item"
            onChange={(event) => update("isFeatured", event.target.checked)}
          />
        </div>
      </Form>
    </Modal>
  );
}
