import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStoredConfig,
  storeConfig,
  clearConfig,
  isAIConfigured,
  type AIProvider,
  type AIProviderConfig,
} from "@/lib/zunoora/ai";

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openrouter: "OpenRouter",
  groq: "Groq",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  openrouter: [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat",
  ],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"],
};

export function SettingsDialog() {
  const [dense, setDense] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [provider, setProvider] = useState<AIProvider>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = getStoredConfig();
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setModel(config.model);
      setConfigured(true);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    const config: AIProviderConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model || PROVIDER_MODELS[provider][0],
    };
    storeConfig(config);
    setConfigured(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearConfig();
    setApiKey("");
    setModel("");
    setConfigured(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-[var(--surface)] hover:text-foreground">
          <SettingsIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Settings</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--surface)] border-[var(--hairline)] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="serif-italic text-lg font-normal">Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2 text-sm">
          <label className="flex items-center justify-between">
            <span>Dense sidebar</span>
            <Switch checked={dense} onCheckedChange={setDense} />
          </label>
          <label className="flex items-center justify-between">
            <span>Reduced motion</span>
            <Switch checked={reduced} onCheckedChange={setReduced} />
          </label>

          <div className="border-t border-[var(--hairline)] pt-3">
            <div className="serif-italic text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              AI Provider
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Provider</span>
                <Select
                  value={provider}
                  onValueChange={(v) => {
                    setProvider(v as AIProvider);
                    setModel(PROVIDER_MODELS[v as AIProvider][0]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">API Key</span>
                <div className="relative">
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type={showKey ? "text" : "password"}
                    placeholder={configured ? "API key saved" : "sk-..."}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Model</span>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_MODELS[provider]?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim()}
                  className="flex-1 rounded-md bg-[var(--warm)] px-3 py-2 text-xs font-medium text-[var(--carbon)] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {saved ? "Saved!" : "Save API Key"}
                </button>
                {configured && (
                  <button
                    onClick={handleClear}
                    className="rounded-md border border-[var(--hairline)] px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${isAIConfigured() ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <span>
                  AI: {isAIConfigured() ? "Configured" : "Not configured — set your API key above"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
