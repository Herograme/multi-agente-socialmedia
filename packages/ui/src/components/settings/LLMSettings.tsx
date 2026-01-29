import { Label } from '../ui/label';
import { Select, SelectOption } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Bot, GripVertical, ExternalLink } from 'lucide-react';
import type { LLMSettings as LLMSettingsType, LLMProviderType } from '@social-content/shared';
import { cn } from '../../lib/utils';

interface LLMSettingsProps {
  llm: LLMSettingsType;
  onChange: (llm: LLMSettingsType) => void;
  errors?: Record<string, string>;
}

const providerInfo: Record<LLMProviderType, { label: string; icon: string; docsUrl: string }> = {
  groq: {
    label: 'Groq (Llama 3)',
    icon: 'G',
    docsUrl: 'https://console.groq.com/keys',
  },
  gemini: {
    label: 'Google Gemini',
    icon: 'G',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
};

export function LLMSettings({ llm, onChange, errors }: LLMSettingsProps) {
  const handlePrimaryChange = (provider: string) => {
    const newFallbackOrder = llm.fallbackOrder.filter((p) => p !== provider);
    onChange({
      ...llm,
      primaryProvider: provider as LLMProviderType,
      fallbackOrder: newFallbackOrder,
    });
  };

  const handleToggleFallback = (provider: LLMProviderType) => {
    if (provider === llm.primaryProvider) return;

    const isInFallback = llm.fallbackOrder.includes(provider);
    const newFallbackOrder = isInFallback
      ? llm.fallbackOrder.filter((p) => p !== provider)
      : [...llm.fallbackOrder, provider];

    onChange({
      ...llm,
      fallbackOrder: newFallbackOrder,
    });
  };

  const handleTemperatureChange = (value: string) => {
    const temp = parseFloat(value);
    if (!isNaN(temp) && temp >= 0 && temp <= 2) {
      onChange({ ...llm, temperature: Math.round(temp * 10) / 10 });
    }
  };

  const handleMaxTokensChange = (value: string) => {
    const tokens = parseInt(value, 10);
    if (!isNaN(tokens) && tokens >= 100 && tokens <= 8192) {
      onChange({ ...llm, maxTokens: tokens });
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Primario */}
      <div className="space-y-2">
        <Label htmlFor="primaryProvider">Provider Primario</Label>
        <Select
          id="primaryProvider"
          value={llm.primaryProvider}
          onValueChange={handlePrimaryChange}
        >
          {Object.entries(providerInfo).map(([key, info]) => (
            <SelectOption key={key} value={key}>
              {info.label}
            </SelectOption>
          ))}
        </Select>
        <p className="text-sm text-muted-foreground">
          Este sera o provider usado para gerar conteudo.
        </p>
        {errors?.primaryProvider && (
          <p className="text-sm text-destructive">{errors.primaryProvider}</p>
        )}
      </div>

      {/* Fallback Order */}
      <div className="space-y-2">
        <Label>Ordem de Fallback</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Se o provider primario falhar, estes serao usados na ordem.
        </p>
        <div className="space-y-2">
          {(Object.keys(providerInfo) as LLMProviderType[])
            .filter((p) => p !== llm.primaryProvider)
            .map((provider) => {
              const info = providerInfo[provider];
              const isInFallback = llm.fallbackOrder.includes(provider);
              const fallbackIndex = llm.fallbackOrder.indexOf(provider);

              return (
                <div
                  key={provider}
                  onClick={() => handleToggleFallback(provider)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                    isInFallback ? 'bg-secondary/50 border-primary/30' : 'bg-muted/30 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isInFallback && (
                      <Badge variant="outline" className="text-xs">
                        #{fallbackIndex + 1}
                      </Badge>
                    )}
                    <Badge variant={isInFallback ? 'default' : 'outline'}>
                      {isInFallback ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Configuracoes Avancadas */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-medium">Configuracoes Avancadas</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={llm.temperature ?? 0.7}
              onChange={(e) => handleTemperatureChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">0 = Mais focado, 2 = Mais criativo</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min={100}
              max={8192}
              step={100}
              value={llm.maxTokens ?? 4096}
              onChange={(e) => handleMaxTokensChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Maximo de tokens por requisicao</p>
          </div>
        </div>
      </div>

      {/* Links para obter API keys */}
      <div className="space-y-2 pt-4 border-t">
        <h4 className="text-sm font-medium">Obter API Keys</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(providerInfo).map(([key, info]) => (
            <a
              key={key}
              href={info.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {info.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
