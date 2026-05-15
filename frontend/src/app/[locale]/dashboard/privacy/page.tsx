"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { privacyApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, ShieldAlert, UserCog } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export default function PrivacyPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const downloadExport = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const data = await privacyApi.exportData(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esg360-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  const deleteAccount = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      await privacyApi.deleteAccount(token);
      logout();
      router.push("/login");
    } catch (e) {
      alert((e as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-emerald-500" /> Privacy & Data
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          GDPR / LGPD: export and delete your personal data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> Export your data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download a JSON file containing your account, notifications, audit logs and related records.
          </p>
          <Button onClick={downloadExport} disabled={downloading}>
            {downloading ? "Preparing..." : "Download export"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-500">
            <ShieldAlert className="h-4 w-4" /> Delete account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently remove your account, personal data and access. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete my account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently anonymize your personal data and revoke access. Company-owned ESG data may be retained per regulatory requirements. Continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount} className="bg-red-500 hover:bg-red-600">
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
