"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { chatApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles } from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { document_id?: string; page_number?: number; snippet?: string }[];
  created_at?: string;
}

export default function ChatPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!token || !company?.id || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", content: text }]);
    setSending(true);
    try {
      const res = await chatApi.send(token, {
        company_id: company.id,
        message: text,
        conversation_id: conversationId,
      });
      setConversationId(res.conversation_id);
      setMessages((p) => [
        ...p,
        {
          id: res.message_id,
          role: "assistant",
          content: res.answer,
          citations: res.citations as Msg["citations"],
        },
      ]);
    } catch (e) {
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: "assistant", content: `Error: ${(e as Error).message}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-57px)]">
      <div className="px-6 py-4 border-b border-border/60">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" /> ESG Assistant
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions about your data, regulations, and recommendations.
        </p>
      </div>
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              Start by asking about your ESG performance, frameworks, or how to improve a score.
            </div>
          )}
          {messages.map((m) => (
            <Card
              key={m.id}
              className={`p-4 ${m.role === "user" ? "bg-emerald-500/5 ml-12" : "mr-12"}`}
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sources</div>
                  {m.citations.map((c, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      {c.snippet ? `"${c.snippet.slice(0, 140)}..."` : "Source"}
                      {c.page_number ? ` (p.${c.page_number})` : ""}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="px-6 py-4 border-t border-border/60">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything about your ESG..."
            rows={2}
            className="resize-none"
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="lg">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
