"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { webhooksApi, apiKeysApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Webhook, Key, Plus, Trash2, Copy, Check } from "lucide-react";

interface WebhookT {
  id: string; name: string; url: string; events: string[];
  is_active: boolean; secret?: string;
  created_at: string; failure_count: number;
}

interface ApiKeyT {
  id: string; name: string; key_prefix: string; scopes: string[];
  is_active: boolean; last_used_at?: string | null;
  expires_at?: string | null; created_at: string;
}

const EVENT_OPTIONS = [
  "data_point.created", "data_point.updated",
  "report.created", "report.published",
  "document.uploaded", "document.processed",
  "score.changed", "task.assigned",
];

export default function IntegrationsPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [webhooks, setWebhooks] = useState<WebhookT[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyT[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // webhook form
  const [whName, setWhName] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [whOpen, setWhOpen] = useState(false);

  // key form
  const [keyName, setKeyName] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);

  const refresh = async () => {
    if (!token || !company?.id) return;
    const [w, k] = await Promise.all([
      webhooksApi.list(token, company.id) as Promise<WebhookT[]>,
      apiKeysApi.list(token, company.id) as Promise<ApiKeyT[]>,
    ]);
    setWebhooks(w);
    setApiKeys(k);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, company?.id]);

  const createWebhook = async () => {
    if (!token || !company?.id) return;
    await webhooksApi.create(token, company.id, { name: whName, url: whUrl, events: whEvents });
    setWhName(""); setWhUrl(""); setWhEvents([]);
    setWhOpen(false);
    refresh();
  };

  const deleteWebhook = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this webhook?")) return;
    await webhooksApi.remove(token, id);
    refresh();
  };

  const createKey = async () => {
    if (!token || !company?.id) return;
    const k = await apiKeysApi.create(token, company.id, { name: keyName, scopes: ["read", "write"] });
    setCreatedKey(k.plaintext_key);
    setKeyName("");
    setKeyOpen(false);
    refresh();
  };

  const deleteKey = async (id: string) => {
    if (!token) return;
    if (!confirm("Revoke this API key?")) return;
    await apiKeysApi.remove(token, id);
    refresh();
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Webhooks for outbound events and API keys for programmatic access.
        </p>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks"><Webhook className="h-3 w-3 mr-2" /> Webhooks</TabsTrigger>
          <TabsTrigger value="keys"><Key className="h-3 w-3 mr-2" /> API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={whOpen} onOpenChange={setWhOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-2" /> New webhook</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create webhook</DialogTitle>
                  <DialogDescription>HTTPS endpoint will receive POST requests with X-ESG360-Signature header.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="My Slack notifier" /></div>
                  <div><Label>URL</Label><Input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://example.com/webhook" /></div>
                  <div>
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {EVENT_OPTIONS.map((ev) => (
                        <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={whEvents.includes(ev)}
                            onChange={(e) => setWhEvents((p) =>
                              e.target.checked ? [...p, ev] : p.filter((x) => x !== ev)
                            )}
                          />
                          {ev}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWhOpen(false)}>Cancel</Button>
                  <Button onClick={createWebhook} disabled={!whName || !whUrl || whEvents.length === 0}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {webhooks.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No webhooks configured.</CardContent></Card>
          ) : webhooks.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{w.name}</span>
                    <Badge variant={w.is_active ? "default" : "secondary"}>
                      {w.is_active ? "active" : "inactive"}
                    </Badge>
                    {w.failure_count > 0 && (
                      <Badge variant="outline" className="text-red-500">
                        {w.failure_count} failures
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate mt-1">{w.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.events.map((e) => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}
                  </div>
                  {w.secret && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-muted-foreground">Secret:</span>
                      <code className="font-mono bg-muted px-2 py-0.5 rounded text-[10px]">{w.secret.slice(0, 16)}…</code>
                      <button onClick={() => copy(w.secret!)} className="text-emerald-500 hover:text-emerald-400">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteWebhook(w.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="keys" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-2" /> New API key</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                  <DialogDescription>You can copy the key only once after creation.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="CI/CD pipeline" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setKeyOpen(false)}>Cancel</Button>
                  <Button onClick={createKey} disabled={!keyName}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {createdKey && (
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold text-emerald-500">
                  Save this key now — it won&apos;t be shown again
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs bg-background px-2 py-1.5 rounded border break-all flex-1">
                    {createdKey}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copy(createdKey)}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setCreatedKey(null)}>Dismiss</Button>
              </CardContent>
            </Card>
          )}

          {apiKeys.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No API keys.</CardContent></Card>
          ) : apiKeys.map((k) => (
            <Card key={k.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{k.name}</span>
                    <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{k.key_prefix}…</code>
                    <Badge variant={k.is_active ? "default" : "secondary"}>{k.is_active ? "active" : "revoked"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {k.scopes.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                    {k.expires_at && ` · Expires ${new Date(k.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteKey(k.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
