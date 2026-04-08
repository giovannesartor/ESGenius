"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { companyApi } from "@/services/api";

interface Company {
  id: string;
  name: string;
  sector?: string;
  country?: string;
  size?: string;
}

/**
 * Returns the user's first company (or null while loading).
 * Caches per token so re-renders don't refetch.
 */
export function useCompany() {
  const { token } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    companyApi
      .list(token)
      .then((data) => {
        const list = data as Company[];
        setCompany(list.length > 0 ? list[0] : null);
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [token]);

  return { company, loading, token };
}
