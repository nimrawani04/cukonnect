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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [confirmDriver, setConfirmDriver] = useState(false);

  if (!user) return null;

  const applySwitch = async (
    next: UserRole,
    options: { redirect: boolean } = { redirect: true },
  ) => {
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
        ? "Switched to Driver mode"
        : "Switched to Passenger — find a ride!",
    );
    if (options.redirect) {
      navigate(next === "driver" ? "/publish/new" : "/search");
    }
  };

  const handleSelect = (next: UserRole) => {
    if (next === role) return;
    if (next === "driver") {
      setConfirmDriver(true);
      return;
    }
    applySwitch(next);
  };

  const Icon = role === "driver" ? Car : Users;
  const label =
    loading || !role
      ? "Choose role"
      : role === "driver"
        ? "Driver mode"
        : "Passenger mode";

  return (
    <>
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
            onClick={() => handleSelect("passenger")}
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
            onClick={() => handleSelect("driver")}
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

      <AlertDialog open={confirmDriver} onOpenChange={setConfirmDriver}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Driver mode?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be set up as a driver. Would you like to open
              "Publish a ride" now to share your next trip, or just switch
              roles and stay here?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                setConfirmDriver(false);
                await applySwitch("driver", { redirect: false });
              }}
            >
              Just switch
            </Button>
            <AlertDialogAction
              onClick={async () => {
                setConfirmDriver(false);
                await applySwitch("driver", { redirect: true });
              }}
            >
              <Car className="mr-1 h-4 w-4" />
              Open Publish a ride
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoleSwitcher;
