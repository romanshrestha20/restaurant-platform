"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Alert, Button, LoadingButton, Modal } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import {
  downloadMenuCsvTemplate,
  parseMenuCsv,
  type CsvMenuPreview,
} from "../lib/csv-menu-import";
import { menuService } from "../services/menu.service";
import type { RestaurantMenu } from "../types/menu.types";

export function CsvMenuImportDialog({
  menu,
  onImported,
  onOpenChange,
  open,
  restaurantId,
}: {
  menu: RestaurantMenu | undefined;
  onImported: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  restaurantId: string | null;
}) {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<CsvMenuPreview | null>(null);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setFileName("");
      setPreview(null);
      setError("");
    }
  }, [open]);

  const categories = useMemo(
    () => new Set(preview?.rows.map((row) => row.category) ?? []).size,
    [preview],
  );

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 2_000_000) {
      setError("Choose a CSV file smaller than 2 MB.");
      return;
    }
    setReading(true);
    setError("");
    try {
      setFileName(file.name);
      setPreview(parseMenuCsv(await file.text()));
    } catch {
      setError("The selected file could not be read.");
    } finally {
      setReading(false);
    }
  };

  const importRows = async () => {
    if (!restaurantId || !menu || !preview || preview.errors.length) return;
    setImporting(true);
    setError("");
    try {
      const result = await menuService.importCsv(
        restaurantId,
        menu.id,
        preview.rows,
      );
      await onImported();
      onOpenChange(false);
      toast.success(`${result.itemsCreated} menu items imported`, {
        description: `${result.categoriesCreated} new categories were created.`,
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.messages.join(" ")
          : "The menu could not be imported.",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      description={`Review rows before adding them to ${menu?.name ?? "this menu"}. Nothing is saved until you confirm.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            disabled={!preview?.rows.length || Boolean(preview.errors.length)}
            loading={importing}
            onClick={() => void importRows()}
          >
            Import {preview?.rows.length || ""} items
          </LoadingButton>
        </>
      }
      open={open}
      title="Import menu from CSV"
      onOpenChange={onOpenChange}
    >
      <div className="menu-import">
        {error ? <Alert>{error}</Alert> : null}
        <div className="menu-import__picker">
          <div>
            <strong>{fileName || "Choose a menu file"}</strong>
            <span>CSV · maximum 500 items · 2 MB</span>
          </div>
          <label className="button button--secondary">
            {reading ? "Reading…" : fileName ? "Replace file" : "Choose CSV"}
            <input
              accept=".csv,text/csv"
              disabled={reading}
              type="file"
              onChange={(event) => void selectFile(event)}
            />
          </label>
        </div>
        {!preview ? (
          <button
            className="menu-import__template"
            type="button"
            onClick={downloadMenuCsvTemplate}
          >
            Download the CSV template
          </button>
        ) : null}
        {preview?.errors.length ? (
          <Alert>
            <strong>Correct these issues and upload the file again:</strong>
            <ul>
              {preview.errors.slice(0, 8).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
        {preview && !preview.errors.length ? (
          <>
            <div className="menu-import__summary">
              <span>
                <strong>{preview.rows.length}</strong> items
              </span>
              <span>
                <strong>{categories}</strong> categories
              </span>
              <span>
                <strong>{preview.rows.filter((row) => row.sku).length}</strong>{" "}
                SKUs
              </span>
            </div>
            <div className="menu-import__preview">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 8).map((row, index) => (
                    <tr key={`${row.category}-${row.name}-${index}`}>
                      <td>
                        <strong>{row.name}</strong>
                        <small>{row.sku || "No SKU"}</small>
                      </td>
                      <td>{row.category}</td>
                      <td>{row.price.toFixed(2)}</td>
                      <td>{(row.status ?? "AVAILABLE").toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 8 ? (
                <p>Plus {preview.rows.length - 8} more items</p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
