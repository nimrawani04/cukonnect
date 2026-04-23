import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "passenger" | "driver";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();
    setRole((data?.user_type as UserRole) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const updateRole = useCallback(
    async (next: UserRole) => {
      if (!user) return { error: new Error("Not signed in") };
      const { error } = await supabase
        .from("profiles")
        .update({ user_type: next })
        .eq("user_id", user.id);
      if (!error) setRole(next);
      return { error };
    },
    [user],
  );

  return { role, loading, updateRole, refetch: fetchRole };
};
