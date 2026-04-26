import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
  align?: "left" | "center";
};

export function Divider({ label, className, align = "center" }: Props) {
  if (!label) {
    return <hr className={cn("border-0 border-t border-rule", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {align === "center" && <span className="h-px flex-1 bg-rule" />}
      <span className="font-mono text-[0.65rem] uppercase tracking-museum text-ink-subtle whitespace-nowrap">
        {label}
      </span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}
