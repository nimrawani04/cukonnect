import { useNavigate } from "react-router-dom";
import { Car, Users, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "default" | "compact";
  className?: string;
};

const RoleSwitcher = ({ variant = "default", className }: Props) => {
  const { user } = useAuth();
  const { role, loading, updateRole } = useUserRole();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<UserRole | null>(null);

  if (!user) return null;

  const switchTo = async (next: UserRole) => {
    if (next === role) return;
    setSwitching(next);
    const { error } = await updateRole(next);
    setSwitching(null);
    if (error) {
      toast.error(error.message ?? "Could not switch role");
      return;
    }
    toast.success(
      next === "driver"
        ? "Switched to Driver — publish a ride!"
        : "Switched to Passenger — find a ride!",
    );
    navigate(next === "driver" ? "/publish/new" : "/search");
  };

  const Icon = role === "driver" ? Car : Users;
  const label =
    loading || !role
      ? "Choose role"
      : role === "driver"
        ? "Driver mode"
        : "Passenger mode";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={variant === "compact" ? "sm" : "sm"}
          className={cn("rounded-full gap-1.5", className)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          <span className={variant === "compact" ? "hidden sm:inline" : ""}>
            {label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch role anytime</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => switchTo("passenger")}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium">Passenger</span>
            <span className="text-xs text-muted-foreground">
              Find and book rides
            </span>
          </div>
          {role === "passenger" && (
            <span className="text-xs font-semibold text-primary">Active</span>
          )}
          {switching === "passenger" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo("driver")}
          className="gap-2"
        >
          <Car className="h-4 w-4" />
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium">Driver</span>
            <span className="text-xs text-muted-foreground">
              Publish rides, share fuel
            </span>
          </div>
          {role === "driver" && (
            <span className="text-xs font-semibold text-primary">Active</span>
          )}
          {switching === "driver" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
