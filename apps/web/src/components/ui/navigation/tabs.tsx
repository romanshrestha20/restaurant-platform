'use client';

import { useState, type ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export type TabItem = { content: ReactNode; disabled?: boolean; label: ReactNode; value: string };

export function Tabs({ className, defaultValue, onValueChange, tabs, value }: { className?: string; defaultValue?: string; onValueChange?: (value: string) => void; tabs: TabItem[]; value?: string }) {
  const firstEnabled = tabs.find((tab) => !tab.disabled)?.value ?? '';
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabled);
  const activeValue = value ?? internalValue;
  const select = (next: string) => { if (value === undefined) setInternalValue(next); onValueChange?.(next); };
  return <div className={classNames('tabs', className)}><div className="tabs__list" role="tablist">{tabs.map((tab) => <button key={tab.value} id={`tab-${tab.value}`} type="button" role="tab" aria-selected={activeValue === tab.value} aria-controls={`panel-${tab.value}`} disabled={tab.disabled} tabIndex={activeValue === tab.value ? 0 : -1} onClick={() => select(tab.value)}>{tab.label}</button>)}</div>{tabs.map((tab) => activeValue === tab.value ? <div key={tab.value} id={`panel-${tab.value}`} className="tabs__panel" role="tabpanel" aria-labelledby={`tab-${tab.value}`}>{tab.content}</div> : null)}</div>;
}
