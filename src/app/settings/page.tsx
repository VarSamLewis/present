"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SettingsState = {
  configured: boolean;
  baseUrl: string;
  model: string;
};

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: SettingsState) => {
        setState(data);
        setBaseUrl(data.baseUrl);
        setModel(data.model);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, baseUrl, model }),
    });
    const data = await res.json();
    setState(data);
    setApiKey("");
    setSavedMessage("Saved.");
    setSaving(false);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/settings", { method: "POST" });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Link href="/" className="text-blue-600 hover:underline">Back</Link>
      </div>

      {state && !state.configured && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          No API key configured yet. Paste your OpenAI-compatible key below to enable generation.
        </div>
      )}

      <form onSubmit={save} className="p-6 bg-white rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">API key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={state?.configured ? "Key saved — enter a new one to replace it" : "sk-..."}
            className="w-full border rounded px-3 py-2"
            autoComplete="off"
          />
          {state?.configured && (
            <p className="text-xs text-green-700 mt-1">A key is currently saved.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">
            Any OpenAI-compatible endpoint works (e.g. a local proxy or gateway).
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={testConnection}
            disabled={testing || (!state?.configured && !apiKey)}
            className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test connection"}
          </button>
          {savedMessage && <span className="text-sm text-green-700">{savedMessage}</span>}
        </div>

        {testResult && (
          <p className={`text-sm ${testResult.ok ? "text-green-700" : "text-red-600"}`}>
            {testResult.ok ? "Connection OK." : `Failed: ${testResult.error}`}
          </p>
        )}
      </form>

      <p className="text-sm text-slate-500 mt-4">
        Your key is stored locally in the app database and is only used for requests to the endpoint
        above.
      </p>
    </main>
  );
}
