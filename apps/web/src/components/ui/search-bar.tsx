import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  placeholder = "Search restaurants or dishes",
  className,
}: SearchBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] border",
        "border-[var(--color-neutral-200)] bg-white p-2",
        "shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <Search
        size={20}
        className="ml-2 shrink-0 text-[var(--color-neutral-400)]"
      />

      <Input
        type="search"
        placeholder={placeholder}
        className="h-11 border-0 px-1 shadow-none focus:border-0 focus:ring-0"
      />
    </div>
  );
}
