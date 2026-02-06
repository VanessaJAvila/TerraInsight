"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Link2, Zap, Shield, Code } from "lucide-react";
import {
  getAgentSettings,
  setAgentSettings,
  AGENT_SETTINGS_DEFAULTS,
  type AgentSettings,
  type EnvMode,
} from "@/lib/agent-settings";

/** Base payload for UI preview. Timestamp set in state after mount to avoid hydration mismatch. */
const WEBHOOK_PAYLOAD_PREVIEW_BASE = {
  action: "investigate_file_anomaly",
  details: 'File "critical_waste.csv" analysis detected: High numerical values detected - potential consumption spikes, Energy consumption data detected for analysis',
  severity: "high",
  source: "TerraInsight File Analysis",
  recommendations: [
    "Review high-value entries for efficiency opportunities",
    "Verify meter readings and align with baseline",
  ],
};

export default function IntegrationHubPage() {
  const [settings, setSettings] = useState<AgentSettings>(AGENT_SETTINGS_DEFAULTS);
  const [envApi, setEnvApi] = useState<{ n8nWebhookTestFromEnv?: boolean; isProduction?: boolean } | null>(null);
  const [webhookPreviewPayload, setWebhookPreviewPayload] = useState<Record<string, unknown>>(() => ({
    ...WEBHOOK_PAYLOAD_PREVIEW_BASE,
    timestamp: "2026-02-04T12:00:00.000Z",
  }));

  const isProduction = envApi?.isProduction === true;

  useEffect(() => {
    setWebhookPreviewPayload((prev) => ({ ...prev, timestamp: new Date().toISOString() }));
  }, []);

  useEffect(() => {
    setSettings(getAgentSettings());
    fetch("/api/agent-settings/env")
      .then((res) => res.json())
      .then((data) => setEnvApi({ isProduction: data.isProduction === true }))
      .catch(() => setEnvApi({ isProduction: false }));
  }, []);

  useEffect(() => {
    if (isProduction) {
      const next = { ...getAgentSettings(), envMode: "prod" as EnvMode };
      setAgentSettings(next);
      setSettings(next);
    }
  }, [isProduction]);

  const handleModeChange = useCallback((mode: EnvMode) => {
    if (isProduction) return;
    setSettings((prev) => {
      const next = { ...prev, envMode: mode };
      setAgentSettings(next);
      return next;
    });
  }, [isProduction]);

  const handleWorkflowToggle = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, isWorkflowEnabled: !prev.isWorkflowEnabled };
      setAgentSettings(next);
      return next;
    });
  }, []);

  const envModeLabel = settings.envMode === "test" ? "Development/Sandbox" : "Live/Production";

  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">
              Integration Hub
            </h1>
            <p className="mt-1 text-charcoal-500">
              {isProduction
                ? "Workflow status and n8n integration monitoring"
                : "Configure n8n workflow integration (Development/Sandbox vs Live/Production)"}
            </p>
          </div>

          {isProduction && (
            <Card className="mb-6 border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-emerald-accent" />
                  Status Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400">
                    <Shield className="h-4 w-4" />
                    Status: Connected to TerraInsight Engine
                  </span>
                  <span className="inline-flex items-center rounded-full bg-charcoal-700 px-3 py-1.5 text-sm font-medium text-charcoal-300">
                    Live/Production
                  </span>
                </div>
                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 px-4 py-3">
                  <p className="text-sm font-medium text-charcoal-400">Active Endpoint</p>
                  <p className="mt-1 font-mono text-sm text-charcoal-300">[Protected Production URL]</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className={isProduction ? "grid gap-6 md:grid-cols-2" : "space-y-6"}>
            {isProduction && (
              <Card className="border-charcoal-800 bg-charcoal-900/50 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-emerald-accent" />
                    Webhook Payload Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-lg border border-charcoal-700 bg-charcoal-950 p-4 text-xs text-charcoal-300 font-mono">
                    {JSON.stringify(webhookPreviewPayload, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-accent" />
                  Workflow Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isProduction && (
                  <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                      <Link2 className="h-4 w-4 text-emerald-accent shrink-0" />
                      Test Webhook URL
                    </div>
                    {envApi?.n8nWebhookTestFromEnv === true ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400">
                        Using N8N_WEBHOOK_TEST from .env.local
                      </span>
                    ) : (
                      <input
                        type="url"
                        value={settings.n8nWebhookTest}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSettings((prev) => ({ ...prev, n8nWebhookTest: v }));
                          setAgentSettings({ n8nWebhookTest: v });
                        }}
                        placeholder="http://localhost:5678/webhook-test/eco-action"
                        className="w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none"
                      />
                    )}
                  </div>
                )}
                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300 mb-2">
                    Environment mode
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={settings.envMode === "test" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("test")}
                      disabled={isProduction}
                      className={
                        settings.envMode === "test"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Development/Sandbox
                    </Button>
                    <Button
                      type="button"
                      variant={settings.envMode === "prod" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("prod")}
                      disabled={isProduction}
                      className={
                        settings.envMode === "prod"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Live/Production
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-accent" />
                  Enable Workflow Triggers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-charcoal-400">
                  Current mode:{" "}
                  <span className="font-medium text-charcoal-200">
                    {envModeLabel}
                  </span>
                </p>
                <Button
                  type="button"
                  onClick={handleWorkflowToggle}
                  variant={settings.isWorkflowEnabled ? "default" : "outline"}
                  size="sm"
                  className={
                    settings.isWorkflowEnabled
                      ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                      : ""
                  }
                >
                  {settings.isWorkflowEnabled
                    ? `Workflow enabled (${envModeLabel})`
                    : "Enable workflow triggers"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {!isProduction && (
            <div className="mt-6">
              <Card className="border-charcoal-800 bg-charcoal-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-emerald-accent" />
                    Webhook Payload Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-lg border border-charcoal-700 bg-charcoal-950 p-4 text-xs text-charcoal-300 font-mono">
                    {JSON.stringify(webhookPreviewPayload, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
