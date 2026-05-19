"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { authApi } from "@/services/api";
import { Loader2 } from "lucide-react";

/**
 * Google OAuth callback page.
 *
 * After the backend sets httpOnly auth cookies and redirects here, we call
 * GET /auth/session to get a fresh access_token into the AuthContext memory,
 * then redirect to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error from backend redirect (e.g. ?error=google_auth_failed)
    const params = new URLSearchParams(window.location.search);
    const backendError = params.get("error");
    if (backendError) {
      setError(t("googleUnavailable"));
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    // Backend already set httpOnly cookies. Restore session from cookie to
    // populate AuthContext memory, then go to dashboard.
    authApi
      .restoreSession()
      .then(() => {
        router.push("/dashboard");
      })
      .catch(() => {
        setError(t("googleCallbackFailed"));
        setTimeout(() => router.push("/login"), 3000);
      });
  }, [router, t]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">{t("redirectingToLogin")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("completingSignIn")}</p>
      </div>
    </div>
  );
}
