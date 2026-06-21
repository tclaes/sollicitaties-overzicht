import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { onAuthChange } from "./auth";

export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
