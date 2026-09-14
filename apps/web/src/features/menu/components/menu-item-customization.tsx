"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@restaurant/ui";
import type { MenuItem } from "@/types/restaurant";
import { useAddCartItem } from "@/features/cart/hooks/use-cart";
import { isApiError } from "@/lib/api/errors";
import { formatMoney } from "./menu-item-card";

interface Props {
  item: MenuItem;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function MenuItemCustomization({
  item,
  currency,
  open,
  onOpenChange,
  onAdded,
}: Props) {
  const [variantSelections, setVariantSelections] = useState<
    Record<string, string | undefined>
  >({});
  const [addOnSelections, setAddOnSelections] = useState<
    Record<string, string[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const addCartItem = useAddCartItem();

  const selectedOptions = item.variants.flatMap((variant) => {
    const optionId = variantSelections[variant.id];
    return variant.options.filter((option) => option.id === optionId);
  });
  const selectedAddOns = item.addOnGroups.flatMap((group) =>
    group.addOns.filter((addOn) =>
      addOnSelections[group.id]?.includes(addOn.id),
    ),
  );
  const unitTotal =
    Number(item.basePrice) +
    selectedOptions.reduce(
      (sum, option) => sum + Number(option.priceAdjustment),
      0,
    ) +
    selectedAddOns.reduce((sum, addOn) => sum + Number(addOn.price), 0);
  const total = unitTotal * quantity;
  const image = item.media[0];

  const selectionSummary = useMemo(
    () => ({ variantSelections, addOnSelections, quantity }),
    [variantSelections, addOnSelections, quantity],
  );

  function validate() {
    const nextErrors: string[] = [];
    item.variants.forEach((variant) => {
      if (
        variant.options.length > 0 &&
        !selectionSummary.variantSelections[variant.id]
      )
        nextErrors.push(`Choose an option for ${variant.name}.`);
    });
    item.addOnGroups.forEach((group) => {
      const count = selectionSummary.addOnSelections[group.id]?.length || 0;
      const minimum = Math.max(group.required ? 1 : 0, group.minSelection);
      if (count < minimum)
        nextErrors.push(`${group.name}: select at least ${minimum}.`);
      if (count > group.maxSelection)
        nextErrors.push(
          `${group.name}: select no more than ${group.maxSelection}.`,
        );
    });
    setErrors(nextErrors);
    return nextErrors.length === 0;
  }

  function toggleAddOn(groupId: string, addOnId: string, maxSelection: number) {
    setAdded(false);
    setAddOnSelections((current) => {
      const selected = current[groupId] || [];
      if (selected.includes(addOnId))
        return {
          ...current,
          [groupId]: selected.filter((id) => id !== addOnId),
        };
      if (selected.length >= maxSelection) return current;
      return { ...current, [groupId]: [...selected, addOnId] };
    });
  }

  function handleAdd() {
    if (!validate()) return;
    setErrors([]);
    addCartItem.mutate(
      {
        menuItemId: item.id,
        quantity,
        variantOptionIds: Object.values(variantSelections).filter(
          (optionId): optionId is string => Boolean(optionId),
        ),
        addOns: item.addOnGroups.flatMap((group) =>
          (addOnSelections[group.id] || []).map((addOnId) => ({
            addOnId,
            quantity: 1,
          })),
        ),
      },
      {
        onSuccess: () => {
          setAdded(true);
          onAdded();
          window.setTimeout(() => onOpenChange(false), 700);
        },
        onError: (error) => {
          const message = isApiError(error)
            ? error.statusCode === 401
              ? "Please sign in before adding items to your cart."
              : error.statusCode === 404
                ? "Your cart is no longer available. Please try again."
                : error.statusCode === 409
                  ? "Your cart changed in another session. Please try adding this item again."
                  : error.statusCode === 0
                    ? "We couldn’t reach the restaurant service. Check your connection and try again."
                    : error.messages[0] || "We couldn’t add this item to your cart. Please try again."
            : "We couldn’t add this item to your cart. Please try again.";
          setErrors([message]);
        },
      },
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setErrors([]);
      setAdded(false);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl overflow-y-auto p-0 sm:max-h-[calc(100svh-4rem)]">
        <div className="overflow-hidden rounded-t-2xl bg-muted">
          {image?.media.url && (
            <img
              src={image.media.url}
              alt={image.alt || item.name}
              className="h-48 w-full object-cover sm:h-56"
            />
          )}
        </div>
        <div className="p-5 sm:p-7">
          <DialogHeader className="pr-8">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl sm:text-3xl">
                {item.name}
              </DialogTitle>
              <span className="shrink-0 text-lg font-bold text-primary">
                {formatMoney(item.basePrice, currency)}
              </span>
            </div>
            <DialogDescription className="leading-6">
              {item.description || "Customize this item to your taste."}
            </DialogDescription>
          </DialogHeader>

          {item.variants.map((variant) => (
            <fieldset key={variant.id} className="border-t border-border py-5">
              <legend className="mb-3 text-sm font-bold">
                {variant.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Choose one
                </span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {variant.options.map((option) => {
                  const selected = variantSelections[variant.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setAdded(false);
                        setVariantSelections((current) => ({
                          ...current,
                          [variant.id]: option.id,
                        }));
                      }}
                      className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted"}`}
                    >
                      <span className="font-medium">{option.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Number(option.priceAdjustment) > 0
                          ? `+${formatMoney(option.priceAdjustment, currency)}`
                          : formatMoney(option.priceAdjustment, currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {item.addOnGroups.map((group) => {
            const selected = addOnSelections[group.id] || [];
            const minimum = Math.max(
              group.required ? 1 : 0,
              group.minSelection,
            );
            return (
              <fieldset key={group.id} className="border-t border-border py-5">
                <legend className="mb-1 text-sm font-bold">
                  {group.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {minimum > 0
                      ? `Choose at least ${minimum}`
                      : `Optional · up to ${group.maxSelection}`}
                  </span>
                </legend>
                <p className="mb-3 text-xs text-muted-foreground">
                  {selected.length} of {group.maxSelection} selected
                </p>
                <div className="space-y-2">
                  {group.addOns.map((addOn) => {
                    const checked = selected.includes(addOn.id);
                    return (
                      <label
                        key={addOn.id}
                        className={`flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${checked ? "border-primary bg-accent" : "border-border hover:bg-muted"}`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleAddOn(
                                group.id,
                                addOn.id,
                                group.maxSelection,
                              )
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="font-medium">{addOn.name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          +{formatMoney(addOn.price, currency)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="border-t border-border py-5">
            <label
              htmlFor={`quantity-${item.id}`}
              className="text-sm font-bold"
            >
              Quantity
            </label>
            <div className="mt-3 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
              >
                −
              </Button>
              <Input
                id={`quantity-${item.id}`}
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.min(99, Math.max(1, Number(event.target.value) || 1)),
                  )
                }
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Increase quantity"
                onClick={() =>
                  setQuantity((current) => Math.min(99, current + 1))
                }
              >
                +
              </Button>
            </div>
          </div>
          {errors.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p className="font-bold">Complete your selections</p>
              <ul className="mt-1 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {added && (
            <p
              role="status"
              className="rounded-xl bg-accent p-3 text-sm font-semibold text-accent-foreground"
            >
              Added to your cart.
            </p>
          )}
          <DialogFooter className="mt-5 sm:justify-between">
            <div className="flex items-center justify-between text-base font-bold sm:min-w-44">
              <span>Total</span>
              <span className="text-primary">
                {formatMoney(total, currency)}
              </span>
            </div>
            <Button type="button" size="lg" onClick={handleAdd} isLoading={addCartItem.isPending} disabled={addCartItem.isPending}>
              {addCartItem.isPending ? "Adding…" : "Add to cart"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
