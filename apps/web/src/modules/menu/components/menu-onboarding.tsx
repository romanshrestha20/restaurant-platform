"use client";

import { Badge, Button } from "@/components/ui";
import { downloadMenuCsvTemplate } from "../lib/csv-menu-import";
import type { RestaurantMenu } from "../types/menu.types";

export function MenuOnboarding({
  canCreate,
  menu,
  onAddCategory,
  onImport,
}: {
  canCreate: boolean;
  menu: RestaurantMenu;
  onAddCategory: () => void;
  onImport: () => void;
}) {
  return (
    <section className="menu-onboarding">
      <div className="menu-onboarding__marker" aria-hidden="true">
        01
      </div>
      <div className="menu-onboarding__copy">
        <div className="menu-onboarding__status">
          <Badge tone={menu.isActive ? "success" : "warning"}>
            {menu.isActive ? "Published" : "Draft"}
          </Badge>
          <span>{menu.name}</span>
        </div>
        <h2>Bring in your first menu</h2>
        <p>
          Import a spreadsheet to create categories and items together, or start
          with one category and build the menu by hand.
        </p>
        {canCreate ? (
          <div className="menu-onboarding__actions">
            <Button onClick={onImport}>Import CSV</Button>
            <Button variant="secondary" onClick={onAddCategory}>
              Add category manually
            </Button>
          </div>
        ) : null}
        <button
          className="menu-onboarding__template"
          type="button"
          onClick={downloadMenuCsvTemplate}
        >
          Download CSV template →
        </button>
      </div>
      <div className="menu-onboarding__format" aria-label="CSV columns">
        <span>Required columns</span>
        <strong>category</strong>
        <strong>name</strong>
        <strong>price</strong>
        <small>
          Optional: description, SKU, preparation time, calories, featured and
          status.
        </small>
      </div>
    </section>
  );
}
