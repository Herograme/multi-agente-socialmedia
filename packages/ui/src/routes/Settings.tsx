import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Rss,
  Bot,
  Image,
  CheckCircle,
  FolderOutput,
  AlertTriangle,
  Palette,
  ChevronRight,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import {
  SettingsSkeleton,
  SourcesSettings,
  LLMSettings,
  ImageSettings,
  QualitySettings,
  OutputSettings,
} from '../components/settings';

export function Settings() {
  const toast = useToast();
  const {
    settings,
    isLoading,
    isDirty,
    errors,
    updateField,
    saveSettings,
    resetSettings,
    isSaving,
    isResetting,
  } = useSettings();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['sources']);

  const handleSave = async () => {
    try {
      await saveSettings();
      toast.success('Configuracoes salvas', 'Suas configuracoes foram salvas com sucesso.');
    } catch (error) {
      toast.error(
        'Erro ao salvar',
        error instanceof Error ? error.message : 'Tente novamente'
      );
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      setShowResetDialog(false);
      toast.success(
        'Configuracoes restauradas',
        'Todas as configuracoes foram restauradas para os valores padrao.'
      );
    } catch (error) {
      toast.error(
        'Erro ao restaurar',
        error instanceof Error ? error.message : 'Tente novamente'
      );
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Configuracoes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as configuracoes do sistema de geracao de conteudo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowResetDialog(true)} disabled={isResetting}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padroes
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || hasErrors || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configuracoes'}
          </Button>
        </div>
      </div>

      {/* Indicador de mudancas nao salvas */}
      {isDirty && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-500 text-sm">Voce tem mudancas nao salvas</span>
        </div>
      )}

      {/* Indicador de erros */}
      {hasErrors && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-500 text-sm">
            Corrija os erros antes de salvar: {Object.values(errors).join(', ')}
          </span>
        </div>
      )}

      <Separator />

      {/* Secoes de Configuracao */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4"
      >
        {/* Fontes de Tendencias */}
        <AccordionItem value="sources" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Rss className="h-5 w-5 text-orange-500" />
              <div className="text-left">
                <div className="font-semibold">Fontes de Tendencias</div>
                <div className="text-sm text-muted-foreground">
                  Configure de onde buscar tendencias tech
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <SourcesSettings
              sources={settings.sources}
              onChange={(sources) => updateField('sources', sources)}
              errors={errors.sources}
            />
          </AccordionContent>
        </AccordionItem>

        {/* LLM Providers */}
        <AccordionItem value="llm" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-semibold">LLM Providers</div>
                <div className="text-sm text-muted-foreground">
                  Configure os modelos de linguagem para geracao de texto
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <LLMSettings
              llm={settings.llm}
              onChange={(llm) => updateField('llm', llm)}
              errors={errors.llm as Record<string, string> | undefined}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Geracao de Imagens */}
        <AccordionItem value="image" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-purple-500" />
              <div className="text-left">
                <div className="font-semibold">Geracao de Imagens</div>
                <div className="text-sm text-muted-foreground">
                  Configure como as imagens de fundo sao geradas
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <ImageSettings
              image={settings.image}
              onChange={(image) => updateField('image', image)}
              errors={errors.image as Record<string, string> | undefined}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Quality Gate */}
        <AccordionItem value="quality" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="text-left">
                <div className="font-semibold">Quality Gate</div>
                <div className="text-sm text-muted-foreground">
                  Configure o nivel de qualidade minimo para aprovacao
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <QualitySettings
              quality={settings.quality}
              onChange={(quality) => updateField('quality', quality)}
              errors={errors.quality as Record<string, string> | undefined}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Output e Formatos */}
        <AccordionItem value="output" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <FolderOutput className="h-5 w-5 text-cyan-500" />
              <div className="text-left">
                <div className="font-semibold">Output e Formatos</div>
                <div className="text-sm text-muted-foreground">
                  Configure onde e como os arquivos sao gerados
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <OutputSettings
              output={settings.output}
              onChange={(output) => updateField('output', output)}
              errors={errors.output as Record<string, string> | undefined}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Link para Templates (Story 5.7) */}
      <div className="border rounded-lg p-4">
        <Link
          to="/settings/templates"
          className="flex items-center justify-between hover:bg-muted/50 -m-4 p-4 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-pink-500" />
            <div className="text-left">
              <div className="font-semibold">Templates de Carrossel</div>
              <div className="text-sm text-muted-foreground">
                Personalize cores, fontes e branding dos seus carroseis
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Dialog de Confirmacao de Reset */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Configuracoes Padrao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao ira reverter todas as configuracoes para os valores padrao. Suas
              configuracoes personalizadas serao perdidas. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              {isResetting ? 'Restaurando...' : 'Restaurar Padroes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
