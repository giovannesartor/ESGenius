"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Server,
  Brain,
  Upload,
  Mail,
  Hash,
  AtSign,
  ToggleLeft,
  Shield,
  Eye,
  ScanSearch,
  Key,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Save,
  Globe,
} from "lucide-react";

interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
}

const initialFeatureFlags: FeatureFlag[] = [
  {
    id: "google-oauth",
    label: "Google OAuth",
    description: "Allow users to sign in with their Google accounts",
    enabled: true,
    icon: Globe,
  },
  {
    id: "ai-processing",
    label: "AI Processing",
    description: "Enable AI-powered document analysis and ESG scoring",
    enabled: true,
    icon: Brain,
  },
  {
    id: "document-ocr",
    label: "Document OCR",
    description: "Optical character recognition for scanned documents",
    enabled: true,
    icon: ScanSearch,
  },
  {
    id: "api-access",
    label: "API Access",
    description: "Allow external API access for enterprise integrations",
    enabled: false,
    icon: Key,
  },
];

export default function AdminSettingsPage() {
  const t = useTranslations();
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);

  const toggleFlag = (id: string) => {
    setFeatureFlags((prev) =>
      prev.map((flag) => (flag.id === id ? { ...flag, enabled: !flag.enabled } : flag))
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          {t("admin.nav.settings")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system configuration, email settings, and feature flags
        </p>
      </div>

      {/* System Configuration */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-brand-blue" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="api-url" className="text-sm font-medium">
                API Base URL
              </Label>
              <Input id="api-url" defaultValue="https://api.esg360.digital/api/v1" />
              <p className="text-xs text-muted-foreground">Backend API endpoint</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-model" className="text-sm font-medium">
                AI Model
              </Label>
              <Input id="ai-model" defaultValue="deepseek-chat-v3-0324" />
              <p className="text-xs text-muted-foreground">Default AI model for processing</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="max-upload" className="text-sm font-medium">
                Max Upload Size (MB)
              </Label>
              <Input id="max-upload" type="number" defaultValue="50" />
              <p className="text-xs text-muted-foreground">Maximum file upload size in megabytes</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-limit" className="text-sm font-medium">
                AI Rate Limit (req/min)
              </Label>
              <Input id="rate-limit" type="number" defaultValue="60" />
              <p className="text-xs text-muted-foreground">Max AI requests per minute per user</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button className="font-semibold">
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-gold" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="smtp-host" className="text-sm font-medium">
                SMTP Host
              </Label>
              <Input id="smtp-host" defaultValue="smtp.sendgrid.net" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port" className="text-sm font-medium">
                SMTP Port
              </Label>
              <Input id="smtp-port" type="number" defaultValue="587" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="smtp-sender" className="text-sm font-medium">
                Sender Email
              </Label>
              <Input id="smtp-sender" type="email" defaultValue="noreply@esg360.digital" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-name" className="text-sm font-medium">
                Sender Name
              </Label>
              <Input id="smtp-name" defaultValue="ESG360 Platform" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button className="font-semibold">
              <Save className="mr-2 h-4 w-4" />
              Save Email Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-brand-green" />
            Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-1">
            {featureFlags.map((flag, idx) => (
              <div key={flag.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${flag.enabled ? "bg-brand-green/10" : "bg-muted"}`}>
                      <flag.icon className={`h-4 w-4 ${flag.enabled ? "text-brand-green" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{flag.label}</p>
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        flag.enabled
                          ? "text-brand-green bg-brand-green/10"
                          : "text-muted-foreground bg-muted"
                      }
                    >
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => toggleFlag(flag.id)}
                    />
                  </div>
                </div>
                {idx < featureFlags.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border/50">
            <div>
              <p className="text-sm font-medium">Clear Cache</p>
              <p className="text-xs text-muted-foreground">
                Clear all cached data including Redis cache and temporary files
              </p>
            </div>
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="text-sm font-medium text-destructive">Reset Database</p>
              <p className="text-xs text-muted-foreground">
                Permanently reset all data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" className="shrink-0">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Database
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
