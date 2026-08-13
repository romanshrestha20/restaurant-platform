"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormField,
  Input,
  LoadingButton,
  Modal,
  Select,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { menuService } from "../services/menu.service";
import type {
  AddOnGroup,
  MenuItem,
  MenuItemConfiguration,
} from "../types/menu.types";

const message = (error: unknown) =>
  error instanceof ApiError ? error.messages.join(" ") : "Please try again.";

export function ItemConfigurationDialog({
  item,
  onChanged,
  onOpenChange,
  open,
  restaurantId,
}: {
  item: MenuItem | null;
  onChanged: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  restaurantId: string | null;
}) {
  const [configuration, setConfiguration] =
    useState<MenuItemConfiguration | null>(null);
  const [groups, setGroups] = useState<AddOnGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const reload = useCallback(async () => {
    if (!restaurantId || !item) return;
    setLoading(true);
    setError("");
    try {
      const [nextConfiguration, nextGroups] = await Promise.all([
        menuService.getItemConfiguration(restaurantId, item.id),
        menuService.listAddOnGroups(restaurantId),
      ]);
      setConfiguration(nextConfiguration);
      setGroups(nextGroups);
    } catch (caught) {
      setError(message(caught));
    } finally {
      setLoading(false);
    }
  }, [item, restaurantId]);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  const mutate = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      await reload();
      onChanged();
      toast.success(success);
    } catch (caught) {
      toast.error("Could not save configuration", {
        description: message(caught),
      });
    }
  };

  return (
    <Modal
      description="Manage presentation, choices, and optional extras without leaving the menu."
      open={open}
      panelClassName="menu-config-modal"
      title={item ? `Configure ${item.name}` : "Configure item"}
      onOpenChange={onOpenChange}
    >
      {error ? <Alert>{error}</Alert> : null}
      {loading && !configuration ? (
        <p className="menu-config-status">Loading configuration…</p>
      ) : null}
      {configuration && restaurantId ? (
        <div className="menu-config">
          <MediaSection
            configuration={configuration}
            restaurantId={restaurantId}
            mutate={mutate}
          />
          <VariantSection
            configuration={configuration}
            restaurantId={restaurantId}
            mutate={mutate}
          />
          <AddOnSection
            configuration={configuration}
            groups={groups}
            restaurantId={restaurantId}
            mutate={mutate}
          />
        </div>
      ) : null}
    </Modal>
  );
}

function MediaSection({
  configuration,
  mutate,
  restaurantId,
}: ConfigSectionProps) {
  const [uploading, setUploading] = useState(false);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    await mutate(
      () =>
        menuService.uploadItemMedia(
          restaurantId,
          configuration.id,
          file,
          configuration.name,
        ),
      "Image added",
    );
    setUploading(false);
  };
  return (
    <section className="menu-config-section">
      <div className="menu-config-heading">
        <div>
          <h3>Images</h3>
          <p>JPEG, PNG, or WebP up to 5 MB.</p>
        </div>
        <label className="button button--secondary">
          {uploading ? "Uploading…" : "Add image"}
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            hidden
            type="file"
            onChange={(event) => void upload(event)}
          />
        </label>
      </div>
      <div className="menu-media-strip">
        {configuration.media.map((entry) => (
          <figure key={entry.mediaId ?? entry.media.url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={entry.alt ?? ""} src={entry.media.url} />
            <Button
              variant="ghost"
              onClick={() =>
                entry.mediaId &&
                void mutate(
                  () =>
                    menuService.removeItemMedia(
                      restaurantId,
                      configuration.id,
                      entry.mediaId!,
                    ),
                  "Image removed",
                )
              }
            >
              Remove
            </Button>
          </figure>
        ))}
        {!configuration.media.length ? (
          <p className="menu-config-empty">No item images yet.</p>
        ) : null}
      </div>
    </section>
  );
}

function VariantSection({
  configuration,
  mutate,
  restaurantId,
}: ConfigSectionProps) {
  const [variantName, setVariantName] = useState("");
  const [option, setOption] = useState({
    variantId: "",
    name: "",
    adjustment: "0",
  });
  const addVariant = (event: FormEvent) => {
    event.preventDefault();
    const name = variantName.trim();
    if (!name) return;
    void mutate(
      () => menuService.createVariant(restaurantId, configuration.id, { name }),
      "Variant added",
    ).then(() => setVariantName(""));
  };
  const addOption = (event: FormEvent) => {
    event.preventDefault();
    if (!option.variantId || !option.name.trim()) return;
    void mutate(
      () =>
        menuService.createVariantOption(restaurantId, option.variantId, {
          name: option.name.trim(),
          priceAdjustment: Number(option.adjustment),
        }),
      "Option added",
    ).then(() =>
      setOption((current) => ({ ...current, name: "", adjustment: "0" })),
    );
  };
  return (
    <section className="menu-config-section">
      <div className="menu-config-heading">
        <div>
          <h3>Variants</h3>
          <p>Choices such as size, crust, or preparation.</p>
        </div>
      </div>
      <Form className="menu-config-inline" onSubmit={addVariant}>
        <Input
          aria-label="Variant name"
          placeholder="Variant name, e.g. Size"
          value={variantName}
          onChange={(event) => setVariantName(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          Add variant
        </Button>
      </Form>
      <div className="menu-config-list">
        {configuration.variants.map((variant) => (
          <div className="menu-config-row" key={variant.id}>
            <div>
              <strong>{variant.name}</strong>
              <small>{variant.options.length} options</small>
            </div>
            <div className="menu-config-chips">
              {variant.options.map((entry) => (
                <span key={entry.id}>
                  {entry.name} ({Number(entry.priceAdjustment) >= 0 ? "+" : ""}
                  {Number(entry.priceAdjustment).toFixed(2)}){" "}
                  <button
                    aria-label={`Remove ${entry.name}`}
                    onClick={() =>
                      void mutate(
                        () =>
                          menuService.deleteVariantOption(
                            restaurantId,
                            entry.id,
                          ),
                        "Option removed",
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                void mutate(
                  () => menuService.deleteVariant(restaurantId, variant.id),
                  "Variant removed",
                )
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      {configuration.variants.length ? (
        <Form
          className="menu-config-inline menu-config-inline--three"
          onSubmit={addOption}
        >
          <Select
            aria-label="Variant"
            value={option.variantId}
            onChange={(event) =>
              setOption({ ...option, variantId: event.target.value })
            }
          >
            <option value="">Choose variant</option>
            {configuration.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Option name"
            placeholder="Option name"
            value={option.name}
            onChange={(event) =>
              setOption({ ...option, name: event.target.value })
            }
          />
          <Input
            aria-label="Price adjustment"
            step="0.01"
            type="number"
            value={option.adjustment}
            onChange={(event) =>
              setOption({ ...option, adjustment: event.target.value })
            }
          />
          <Button type="submit" variant="secondary">
            Add option
          </Button>
        </Form>
      ) : null}
    </section>
  );
}

function AddOnSection({
  configuration,
  groups,
  mutate,
  restaurantId,
}: ConfigSectionProps & { groups: AddOnGroup[] }) {
  const [group, setGroup] = useState({
    name: "",
    required: false,
    min: "0",
    max: "1",
  });
  const [addOn, setAddOn] = useState({ groupId: "", name: "", price: "0" });
  const attached = useMemo(
    () => new Set(configuration.addOnGroups.map((entry) => entry.id)),
    [configuration.addOnGroups],
  );
  const createGroup = (event: FormEvent) => {
    event.preventDefault();
    if (!group.name.trim()) return;
    void mutate(
      () =>
        menuService.createAddOnGroup(restaurantId, {
          name: group.name.trim(),
          required: group.required,
          minSelection: Number(group.min),
          maxSelection: Number(group.max),
        }),
      "Add-on group created",
    ).then(() => setGroup({ name: "", required: false, min: "0", max: "1" }));
  };
  const createAddOn = (event: FormEvent) => {
    event.preventDefault();
    if (!addOn.groupId || !addOn.name.trim()) return;
    void mutate(
      () =>
        menuService.createAddOn(restaurantId, addOn.groupId, {
          name: addOn.name.trim(),
          price: Number(addOn.price),
        }),
      "Add-on created",
    ).then(() => setAddOn((current) => ({ ...current, name: "", price: "0" })));
  };
  return (
    <section className="menu-config-section">
      <div className="menu-config-heading">
        <div>
          <h3>Add-ons</h3>
          <p>Reusable extras can be attached to multiple items.</p>
        </div>
      </div>
      <div className="menu-addon-layout">
        <div>
          <h4>Available groups</h4>
          <div className="menu-config-list">
            {groups.map((entry) => (
              <div className="menu-config-row" key={entry.id}>
                <div>
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.addOns.length} extras · {entry.minSelection}–
                    {entry.maxSelection}
                  </small>
                  {entry.addOns.length ? (
                    <span className="menu-config-mini-list">
                      {entry.addOns.map((extra) => (
                        <span key={extra.id}>
                          {extra.name} · {Number(extra.price).toFixed(2)}
                          <button
                            aria-label={`Remove ${extra.name}`}
                            type="button"
                            onClick={() =>
                              void mutate(
                                () =>
                                  menuService.deleteAddOn(
                                    restaurantId,
                                    extra.id,
                                  ),
                                'Add-on removed',
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
                <Button
                  variant={attached.has(entry.id) ? "secondary" : "ghost"}
                  onClick={() =>
                    void mutate(
                      () =>
                        attached.has(entry.id)
                          ? menuService.detachAddOnGroup(
                              restaurantId,
                              configuration.id,
                              entry.id,
                            )
                          : menuService.attachAddOnGroup(
                              restaurantId,
                              configuration.id,
                              entry.id,
                            ),
                      attached.has(entry.id)
                        ? "Group detached"
                        : "Group attached",
                    )
                  }
                >
                  {attached.has(entry.id) ? "Attached" : "Attach"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    void mutate(
                      () =>
                        menuService.deleteAddOnGroup(restaurantId, entry.id),
                      "Group removed",
                    )
                  }
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="menu-addon-forms">
          <Form spacing="sm" onSubmit={createGroup}>
            <h4>New group</h4>
            <FormField htmlFor="addon-group-name" label="Name">
              <Input
                id="addon-group-name"
                value={group.name}
                onChange={(event) =>
                  setGroup({ ...group, name: event.target.value })
                }
              />
            </FormField>
            <div className="field-grid">
              <FormField htmlFor="addon-min" label="Minimum">
                <Input
                  id="addon-min"
                  min="0"
                  type="number"
                  value={group.min}
                  onChange={(event) =>
                    setGroup({ ...group, min: event.target.value })
                  }
                />
              </FormField>
              <FormField htmlFor="addon-max" label="Maximum">
                <Input
                  id="addon-max"
                  min="1"
                  type="number"
                  value={group.max}
                  onChange={(event) =>
                    setGroup({ ...group, max: event.target.value })
                  }
                />
              </FormField>
            </div>
            <Checkbox
              checked={group.required}
              label="Required choice"
              onChange={(event) =>
                setGroup({ ...group, required: event.target.checked })
              }
            />
            <Button type="submit" variant="secondary">
              Create group
            </Button>
          </Form>
          {groups.length ? (
            <Form spacing="sm" onSubmit={createAddOn}>
              <h4>New add-on</h4>
              <Select
                aria-label="Add-on group"
                value={addOn.groupId}
                onChange={(event) =>
                  setAddOn({ ...addOn, groupId: event.target.value })
                }
              >
                <option value="">Choose group</option>
                {groups.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
              <Input
                aria-label="Add-on name"
                placeholder="Add-on name"
                value={addOn.name}
                onChange={(event) =>
                  setAddOn({ ...addOn, name: event.target.value })
                }
              />
              <Input
                aria-label="Add-on price"
                min="0"
                step="0.01"
                type="number"
                value={addOn.price}
                onChange={(event) =>
                  setAddOn({ ...addOn, price: event.target.value })
                }
              />
              <LoadingButton loading={false} type="submit" variant="secondary">
                Add extra
              </LoadingButton>
            </Form>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type ConfigSectionProps = {
  configuration: MenuItemConfiguration;
  mutate: (action: () => Promise<unknown>, success: string) => Promise<void>;
  restaurantId: string;
};
