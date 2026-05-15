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
    /* eslint-disable react-hooks/set-state-in-effect */
    let cancelled = false;
    if (!token) {
      if (!cancelled) {
        setCompany(null);
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    companyApi
      .list(token)
      .then((data) => {
        if (cancelled) return;
        const list = data as Company[];
        setCompany(list.length > 0 ? list[0] : null);
      })
      .catch(() => {
        if (!cancelled) setCompany(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [token]);

  return { company, loading, token };
}
