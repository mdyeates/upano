import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils/utils";

export type Role = "reporter" | "sde" | "admin";

export function RoleBadge({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  const variant: "default" | "secondary" | "outline" =
    role === "admin" ? "default" : role === "sde" ? "secondary" : "outline";

  return (
    <Badge
      variant={variant}
      className={cn("text-[10px] uppercase tracking-wide font-mono", className)}
    >
      {role}
    </Badge>
  );
}
