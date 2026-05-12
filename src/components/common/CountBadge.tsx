import { cn } from "@/lib/utils";

interface CountBadgeProps {
  value: number;
  className?: string;
}

export function CountBadge({ value, className }: CountBadgeProps) {
  if (value <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded-full bg-[color:var(--danger)] px-2 py-1 text-[10px] font-semibold text-white shadow-sm",
        className,
      )}
    >
      {value > 9 ? "9+" : value}
    </span>
  );
}
