"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Link2, Zap, Info, Check } from "lucide-react";
import {
  getAgentSettings,
  setAgentSettings,
  type AgentSettings,
  type EnvMode,
} from "@/lib/agent-settings";

export default function AgentSettingsPage() {
  const [settings, setSettings] = useState<AgentSettings>(getAgentSettings);
  const [saved, setSaved] = useState(false);

  const loadFromStorage = useCallback(() => {
    setSettings(getAgentSettings());
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleSave = useCallback(() => {
    setAgentSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleModeChange = useCallback((mode: EnvMode) => {
    setSettings((prev) => {
      const next = { ...prev, envMode: mode };
      setAgentSettings(next);
      return next;
    });
  }, []);

  const handleWorkflowToggle = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, isWorkflowEnabled: !prev.isWorkflowEnabled };
      setAgentSettings(next);
      return next;
    });
  }, []);

  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">
              Agent Settings
            </h1>
            <p className="mt-1 text-charcoal-500">
              Configure n8n workflow integration (Test vs Production)
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-accent" />
                  Workflow Integration
                </CardTitle>
                <CardDescription>
                  Test uses the test webhook; Production uses the server .env setting (prod URL is never exposed in the UI).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    <Link2 className="h-4 w-4 text-emerald-accent shrink-0" />
                    Test Webhook URL (dev convenience)
                  </div>
                  <input
                    type="url"
                    value={settings.n8nWebhookTest}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        n8nWebhookTest: e.target.value,
                      }))
                    }
                    placeholder="http://localhost:5680/webhook-test/eco-action"
                    className="w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none"
                  />
                  <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Optional. Used only when N8N_WEBHOOK_TEST is not set on the server (e.g. local dev).
                  </p>
                </div>

                <div className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-charcoal-300">
                    Environment mode
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={settings.envMode === "test" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("test")}
                      className={
                        settings.envMode === "test"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Test
                    </Button>
                    <Button
                      type="button"
                      variant={settings.envMode === "prod" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModeChange("prod")}
                      className={
                        settings.envMode === "prod"
                          ? "bg-emerald-accent text-charcoal-950 hover:bg-emerald-accent/90"
                          : ""
                      }
                    >
                      Production
                    </Button>
                  </div>
                  <p className="text-xs text-charcoal-500 flex items-start gap-1.5" title="Test uses test webhook; Production uses server .env setting (do NOT expose prod URL in UI).">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Test uses the test webhook; Production uses the server .env setting (prod URL is never shown in the UI).
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    "Save configuration"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-charcoal-800 bg-charcoal-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-accent" />
                  Enable Workflow Triggers
                </CardTitle>
                <CardDescription>
                  When file analysis detects anomalies, the server can trigger the n8n webhook for the selected environment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-charcoal-400">
                  Current mode:{" "}
                  <span className="font-medium text-charcoal-200">
                    {settings.envMode === "test" ? "Test" : "Production"}
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
                    ? `Workflow enabled (${settings.envMode})`
                    : "Enable workflow triggers"}
                </Button>
                <p className="text-xs text-charcoal-500 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Toggle is saved to localStorage and used when uploading files for analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
