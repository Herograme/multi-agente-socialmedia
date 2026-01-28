# Project Brief: Social Content Agent

> Sistema multi-agente de automação de conteúdo para redes sociais focado em desenvolvedores

---

## Resumo Executivo

**Conceito:** Sistema multi-agente de automação de conteúdo para redes sociais que pesquisa tendências tech, gera tópicos relevantes e produz postagens otimizadas para Instagram e LinkedIn.

**Problema Principal:** Desenvolvedores frequentemente carecem de tempo e/ou criatividade para manter presença ativa nas redes sociais. Entre código, deploys e deadlines, criar conteúdo fica em segundo plano — resultando em perfis estagnados e oportunidades perdidas de networking, visibilidade profissional e personal branding.

**Mercado-Alvo:** Desenvolvedores de software que desejam construir autoridade técnica e expandir sua rede profissional sem sacrificar horas de produtividade.

**Proposta de Valor:** Automatização inteligente end-to-end — da pesquisa de tendências tech à publicação — entregando conteúdo técnico de qualidade com mínimo esforço, permitindo que devs foquem no que fazem melhor: codar.

---

## Declaração do Problema

### Estado Atual e Pontos de Dor

Desenvolvedores enfrentam uma realidade paradoxal: precisam de visibilidade online para crescer na carreira, mas seu trabalho diário consome toda energia disponível. O cenário típico inclui:

- **Síndrome do perfil fantasma:** LinkedIn e Instagram abandonados por meses
- **Bloqueio criativo:** "Sei codar, mas não sei o que postar"
- **Tempo escasso:** Entre sprints, code reviews e estudos, sobra pouco para criar conteúdo
- **Inconsistência:** Posts esporádicos que não geram engajamento nem algoritmo favorável

### Impacto do Problema

- Oportunidades de emprego/freela perdidas por falta de presença digital
- Networking limitado — conexões que poderiam surgir de conteúdo relevante
- Sensação de "ficar para trás" em relação a devs influenciadores
- Estimativa: dev gasta 3-5h/semana para manter presença ativa de qualidade

### Por que Soluções Existentes Falham

- **Ferramentas de agendamento** (Buffer, Hootsuite): Não criam conteúdo, apenas agendam
- **IA genérica** (ChatGPT direto): Requer prompts elaborados, curadoria manual, conhecimento de marketing
- **Agências de social media:** Caras e não entendem contexto técnico/dev

### Urgência

O mercado tech está cada vez mais competitivo. Personal branding deixou de ser diferencial e virou necessidade. Quem não está visível, está invisível para recrutadores e oportunidades.

---

## Solução Proposta

### Conceito Central

Um sistema multi-agente orquestrado que automatiza todo o pipeline de criação de conteúdo para redes sociais, desde a pesquisa de tendências até a geração de posts completos com texto e assets visuais, prontos para publicação.

### Arquitetura de Agentes

| Agente | Responsabilidade |
|--------|------------------|
| **Pesquisador** | Monitora tendências tech, notícias, releases, discussões em comunidades dev |
| **Gerador de Tópicos** | Analisa dados e sugere tópicos relevantes e oportunos |
| **Curador de Conteúdo** | Busca referências, artigos, códigos e materiais de apoio |
| **Redator** | Gera textos otimizados para cada plataforma (Instagram/LinkedIn) |
| **Designer de Imagens** | Cria imagens de fundo baseadas no conteúdo gerado |
| **Criador de Carrossel** | Gera carrosséis de imagens para Instagram (conteúdos longos) |
| **Gerador de PDF** | Cria PDFs formatados para LinkedIn (funciona como carrossel) |
| **QA Analyst** | Analisa todo o output (texto, imagens, PDFs) e atribui score de qualidade |
| **Orquestrador** | Coordena o fluxo entre agentes e garante qualidade final |

### Fluxo de Produção

```
Pesquisador → Gerador de Tópicos → Curador → Redator
                                                 ↓
                             ┌──────────────────┴──────────────────┐
                             ↓                                     ↓
                        Instagram                              LinkedIn
                             ↓                                     ↓
                   ┌────────┴────────┐                    ┌───────┴───────┐
                   ↓                 ↓                    ↓               ↓
             Post Simples      Carrossel              Post Simples      PDF
                   ↓                 ↓                    ↓               ↓
             Designer de       Criador de           Designer de     Gerador de
              Imagens          Carrossel             Imagens           PDF
                   └────────┬────────┘                    └───────┬───────┘
                             ↓                                     ↓
                             └──────────────┬──────────────────────┘
                                            ↓
                                       QA Analyst
                                       (Score + Feedback)
                                            ↓
                                      Orquestrador
                                     (Aprovação Final)
```

### Tipos de Output por Plataforma

| Plataforma | Conteúdo Curto | Conteúdo Longo |
|------------|----------------|----------------|
| **Instagram** | Imagem única + legenda | Carrossel (até 10 slides) |
| **LinkedIn** | Imagem única + texto | PDF anexado (carrossel nativo) |

### Diferenciadores-Chave

- **Contexto tech-first:** Treinado e otimizado para linguagem e cultura dev
- **End-to-end automatizado:** Da pesquisa ao post pronto com assets visuais
- **Multi-formato:** Adapta não só o texto, mas o formato visual para cada caso
- **Quality Gate:** QA Analyst garante padrão mínimo antes de entregar ao usuário
- **Curadoria inteligente:** Baseado em fontes reais e tendências verificadas

---

## Usuários-Alvo

### Segmento Primário: Desenvolvedores de Software

#### Perfil Demográfico

| Atributo | Descrição |
|----------|-----------|
| **Idade** | 22-40 anos |
| **Ocupação** | Dev Junior a Senior, Tech Leads, Freelancers |
| **Localização** | Brasil (foco inicial), expansível para LATAM |
| **Renda** | R$ 4.000 - R$ 25.000/mês |
| **Idioma** | Português (conteúdo bilíngue PT/EN como diferencial futuro) |

#### Comportamentos Atuais

- Consome conteúdo tech no Twitter/X, Dev.to, Hacker News, Reddit
- Tem perfil no LinkedIn mas posta raramente (1x/mês ou menos)
- Instagram pessoal, raramente usa para conteúdo profissional
- Sabe que deveria postar mais, mas sempre adia
- Quando posta, não sabe medir se teve resultado

#### Pontos de Dor Específicos

- "Não sei o que postar" — bloqueio criativo constante
- "Não tenho tempo" — trabalho consome 8-12h/dia
- "Não sei fazer imagem bonita" — não domina design/Canva
- "Meu post não engaja" — frustra e desmotiva continuar
- "Não sou bom com palavras" — síndrome do impostor ao escrever

#### Objetivos que Buscam

- Construir autoridade técnica no nicho
- Aumentar visibilidade para recrutadores
- Fazer networking com outros devs
- Conseguir freelas ou propostas melhores de emprego
- Compartilhar conhecimento sem gastar horas

#### Persona Representativa

> **Lucas, 28 anos, Dev Pleno**
>
> Trabalha remoto em uma startup, ganha R$ 12k/mês. Sabe que precisa de presença online para crescer na carreira, mas depois de 8h codando, a última coisa que quer é pensar em "o que postar". Já tentou manter consistência no LinkedIn 3 vezes, desistiu em todas. Segue devfluencers e pensa "queria ter tempo pra isso".

---

## Objetivos e Métricas de Sucesso

### Objetivos de Negócio

| Objetivo | Métrica | Meta |
|----------|---------|------|
| Validar product-market fit | Usuários ativos semanais | 50 usuários em 3 meses |
| Gerar receita recorrente | MRR (Monthly Recurring Revenue) | R$ 5.000 em 6 meses |
| Construir base engajada | Taxa de retenção mensal | > 60% |
| Escalar aquisição | Custo de aquisição (CAC) | < R$ 50/usuário |

### Métricas de Sucesso do Usuário

- **Tempo economizado:** Usuário gasta < 15 min/semana para ter 3+ posts prontos
- **Consistência:** Usuário mantém frequência de posts por > 4 semanas consecutivas
- **Qualidade percebida:** Score médio de aprovação do usuário > 4/5
- **Engajamento resultante:** Aumento de 30% em interações nas redes do usuário
- **Satisfação:** NPS > 40

### KPIs Operacionais

| KPI | Definição | Meta |
|-----|-----------|------|
| **Taxa de Aprovação** | % de posts gerados aprovados pelo usuário sem edição | > 70% |
| **Score Médio QA** | Nota média do agente QA nos outputs | > 8/10 |
| **Tempo de Geração** | Tempo médio do pipeline completo (pesquisa → post pronto) | < 5 min |
| **Cobertura de Formatos** | % de posts com assets visuais (imagem/carrossel/PDF) | 100% |
| **Uptime do Sistema** | Disponibilidade da plataforma | > 99% |

### Marcos de Validação (Milestones)

| Fase | Marco | Critério de Sucesso |
|------|-------|---------------------|
| **Alpha** | MVP funcional | Pipeline completo rodando end-to-end |
| **Beta Fechado** | 20 usuários testando | 10+ usuários ativos após 2 semanas |
| **Beta Aberto** | 100 usuários | NPS > 30, taxa aprovação > 60% |
| **Lançamento** | Produto comercial | 50 usuários pagantes, MRR R$ 2.500 |

---

## Escopo do MVP

### Estratégia de Validação: Dogfooding + Custo Zero

O MVP será desenvolvido para uso pessoal do próprio criador, utilizando **exclusivamente IAs gratuitas** dentro de seus limites. Esta abordagem permite:

- Validar viabilidade técnica com custo zero
- Testar se é possível entregar qualidade com ferramentas free-tier
- Iterar rapidamente sem pressão de usuários externos ou custos de API
- Decidir se vale investir em APIs pagas apenas após validação

### Restrição Técnica: IAs Gratuitas

| Função | Opções Gratuitas Disponíveis |
|--------|------------------------------|
| **LLM (texto)** | Claude Free, ChatGPT Free, Gemini Free, Llama (local), Groq |
| **Geração de Imagem** | Leonardo.ai (free tier), Ideogram, Bing Image Creator, Stable Diffusion (local) |
| **Pesquisa/Scraping** | APIs públicas, RSS feeds, web scraping |
| **Orquestração** | LangChain, CrewAI, AutoGen (open source) |

### Arquitetura de Geração Visual (HTML/CSS)

```
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE DE CARROSSEL/PDF                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Designer de Imagens                                     │
│     └─→ Gera imagem de fundo (IA gratuita)                  │
│                                                             │
│  2. Redator                                                 │
│     └─→ Gera conteúdo: tópico, explicação, código, etc.     │
│                                                             │
│  3. Criador de Carrossel/PDF                                │
│     ├─→ Monta template HTML/CSS                             │
│     ├─→ Insere imagem de fundo                              │
│     ├─→ Insere conteúdo (texto, código, exemplos)           │
│     ├─→ Renderiza HTML → Imagens (screenshot/puppeteer)     │
│     └─→ Compila imagens → PDF (se LinkedIn)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura do Slide (HTML/CSS)

| Elemento | Descrição |
|----------|-----------|
| **Background** | Imagem gerada pela IA como fundo |
| **Overlay** | Camada semi-transparente para legibilidade |
| **Título** | Tópico principal do slide |
| **Conteúdo** | Explicação, bullet points |
| **Código** | Syntax highlighting para exemplos de código |
| **Footer** | Branding/handle do autor |

### Exemplo de Carrossel (10 slides)

| Slide | Conteúdo |
|-------|----------|
| 1 | Capa: Título chamativo + imagem de fundo |
| 2 | Problema/Contexto: "Você já passou por isso?" |
| 3-7 | Conteúdo principal: explicação + exemplos de código |
| 8 | Dica prática ou resumo |
| 9 | Call-to-action: "Salva pra depois" |
| 10 | Encerramento: "Me segue para mais conteúdo" |

### Vantagens da Abordagem HTML/CSS

- ✅ **Controle total** sobre layout e design
- ✅ **Sem custo de IA** para design (apenas para imagem de fundo)
- ✅ **Templates reutilizáveis** — cria uma vez, usa sempre
- ✅ **Syntax highlighting** nativo para código
- ✅ **Consistência visual** entre posts
- ✅ **Fácil iteração** — ajusta CSS e regenera

### Stack Técnico para Geração

| Etapa | Ferramenta |
|-------|------------|
| Template | HTML + CSS (Tailwind ou custom) |
| Renderização | Puppeteer / Playwright (headless browser) |
| Screenshot | html-to-image / Puppeteer screenshot |
| PDF | Puppeteer PDF ou jsPDF |
| Syntax Highlight | Prism.js / Highlight.js |

### Features Core (Must Have)

| Feature | Descrição | Viável no Free Tier? |
|---------|-----------|---------------------|
| **Pesquisa de Tendências** | Busca trending topics em fontes tech | ✅ Scraping/RSS |
| **Geração de Tópicos** | Sugere tópicos baseado na pesquisa | ✅ LLM gratuito |
| **Geração de Texto** | Copy para Instagram e LinkedIn | ✅ LLM gratuito |
| **Geração de Imagem de Fundo** | Imagem visual para o post | ✅ Leonardo/Ideogram free |
| **Geração de Carrossel (Instagram)** | Até 10 slides para conteúdo longo | ✅ LLM + gerador de imagem |
| **Geração de PDF (LinkedIn)** | Documento formatado | ✅ Programático (sem IA) |
| **QA Scoring** | Avalia qualidade e dá score | ✅ LLM gratuito |

### Fora do Escopo do MVP

- ❌ APIs pagas (OpenAI, Anthropic, Midjourney)
- ❌ Interface web/app
- ❌ Autenticação e multi-usuário
- ❌ Publicação automática
- ❌ Alta escala (respeitar rate limits)

### Limitações Aceitas no MVP

- Rate limits das ferramentas gratuitas (poucos requests/dia)
- Qualidade de imagem pode ser inferior a Midjourney/DALL-E 3
- Tempo de geração pode ser maior (sem prioridade de API)
- Possível necessidade de rodar modelos localmente

### Critérios de Sucesso do MVP (Validação Pessoal)

> O MVP será considerado viável quando:
>
> 1. Conseguir gerar 3+ posts/semana usando apenas IAs gratuitas
> 2. Qualidade aceitável para publicar sem vergonha
> 3. Não estourar limites gratuitos com uso normal
> 4. Tempo gasto < 30 min/semana
> 5. Se funcionar, aí sim considerar upgrade para APIs pagas

---

## Visão Pós-MVP

### Fase 2: Expansão de Funcionalidades

*Após validação pessoal bem-sucedida*

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Múltiplos Templates** | Diferentes estilos visuais para variar posts | Alta |
| **Personalização de Voz** | Sistema aprende o tom/estilo do usuário | Alta |
| **Agendamento Básico** | Fila de posts para a semana | Média |
| **Interface Web Simples** | Dashboard para gerenciar conteúdo | Média |
| **Publicação Automática** | Integração com APIs do Instagram/LinkedIn | Média |
| **Analytics Básico** | Tracking de posts publicados vs engajamento | Baixa |

### Fase 3: Produto Comercial

*Se houver demanda validada*

| Feature | Descrição |
|---------|-----------|
| **Multi-tenancy** | Suporte a múltiplos usuários com contas separadas |
| **Planos de Assinatura** | Free tier limitado + planos pagos |
| **APIs Premium** | Upgrade para OpenAI/Anthropic/Midjourney para qualidade superior |
| **Múltiplos Idiomas** | Suporte a inglês e espanhol |
| **Times/Agências** | Colaboração e múltiplos perfis por conta |
| **White-label** | Oferecer como serviço para agências |

### Visão de Longo Prazo (1-2 anos)

> **"O dev que posta como um influenciador, sem virar um"**
>
> Uma plataforma onde qualquer desenvolvedor consegue manter presença profissional consistente nas redes sociais, construindo autoridade técnica e abrindo portas para oportunidades — tudo isso investindo menos de 1 hora por mês.

### Oportunidades de Expansão

| Direção | Potencial |
|---------|-----------|
| **Verticais** | Expandir para outros nichos técnicos (designers, data scientists, PMs) |
| **Plataformas** | Twitter/X, YouTube Shorts, TikTok, Medium, Dev.to |
| **Formatos** | Vídeos curtos, threads, newsletters automáticas |
| **B2B** | Ferramenta para empresas de tech gerarem conteúdo employer branding |
| **Marketplace** | Templates premium criados pela comunidade |
| **API** | Oferecer como serviço para outras ferramentas |

### Decisões Adiadas para Pós-MVP

| Decisão | Por que adiar |
|---------|---------------|
| Modelo de pricing | Primeiro validar se há willingness to pay |
| Stack de infra (cloud) | MVP local, depois decide AWS/Vercel/etc |
| Escolha de IA paga | Primeiro testar gratuitas, depois comparar custo-benefício |
| Estrutura legal | Só se virar negócio real |

---

## Considerações Técnicas

### Requisitos de Plataforma

| Aspecto | Especificação |
|---------|---------------|
| **Ambiente de Execução** | Local (máquina do desenvolvedor) |
| **Sistema Operacional** | Linux (Ubuntu) — ambiente atual |
| **Runtime** | Node.js 18+ ou Python 3.10+ |
| **Dependências Pesadas** | Puppeteer/Playwright (headless browser) |
| **GPU** | Opcional — útil se rodar Stable Diffusion local |

### Stack Tecnológico (MVP)

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Linguagem** | TypeScript/Node.js ou Python | Ecossistema rico para IA/automação |
| **Orquestração de Agentes** | CrewAI / LangGraph / AutoGen | Open source, gratuito |
| **LLM (texto)** | Groq (Llama) / Gemini Free / Claude Free | APIs gratuitas com bons limites |
| **Geração de Imagem** | Leonardo.ai Free / Ideogram / SDXL local | Qualidade aceitável no free tier |
| **Renderização HTML** | Puppeteer / Playwright | Screenshot de HTML → imagem |
| **Geração PDF** | Puppeteer PDF / PDFKit | Converte slides em documento |
| **Syntax Highlighting** | Shiki / Prism.js | Código bonito nos slides |
| **Templates** | HTML + Tailwind CSS | Rápido de estilizar |

### Arquitetura de Agentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORQUESTRADOR                             │
│                   (Coordena fluxo e retry)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌─────────────┐       ┌─────────────┐         ┌─────────────┐
│ PESQUISADOR │──────▶│  GERADOR    │────────▶│   CURADOR   │
│             │       │ DE TÓPICOS  │         │ DE CONTEÚDO │
└─────────────┘       └─────────────┘         └─────────────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │   REDATOR   │
                                              └─────────────┘
                                                     │
                      ┌─────────────────────────────┼────────┐
                      ▼                             ▼        ▼
               ┌─────────────┐              ┌───────────┐ ┌──────┐
               │  DESIGNER   │              │ CARROSSEL │ │ PDF  │
               │ DE IMAGENS  │              │  BUILDER  │ │MAKER │
               └─────────────┘              └───────────┘ └──────┘
                      │                            │         │
                      └────────────────┬───────────┴─────────┘
                                       ▼
                                ┌─────────────┐
                                │ QA ANALYST  │
                                │  (Scoring)  │
                                └─────────────┘
                                       │
                                       ▼
                                  [OUTPUT]
                           Imagens + PDF + Score
```

### Integrações Necessárias

| Integração | Propósito | Método |
|------------|-----------|--------|
| **Fontes de Tendências** | Dev.to, HN, Reddit, Twitter | RSS / Scraping / APIs públicas |
| **LLM API** | Geração de texto | REST API (Groq/Gemini) |
| **Geração de Imagem** | Background dos posts | REST API (Leonardo/Ideogram) |
| **File System** | Salvar outputs | Local (fs) |

### Considerações de Segurança

| Aspecto | Abordagem MVP |
|---------|---------------|
| **API Keys** | Variáveis de ambiente (.env) |
| **Dados sensíveis** | Nenhum — uso pessoal |
| **Rate Limiting** | Respeitar limites das APIs gratuitas |
| **Logs** | Local, sem dados sensíveis |

### Estrutura de Diretórios (Proposta)

```
social-content-agent/
├── src/
│   ├── agents/
│   │   ├── researcher.ts
│   │   ├── topic-generator.ts
│   │   ├── curator.ts
│   │   ├── writer.ts
│   │   ├── image-designer.ts
│   │   ├── carousel-builder.ts
│   │   ├── pdf-maker.ts
│   │   └── qa-analyst.ts
│   ├── templates/
│   │   ├── carousel/
│   │   │   ├── slide.html
│   │   │   └── styles.css
│   │   └── pdf/
│   ├── services/
│   │   ├── llm.ts
│   │   ├── image-gen.ts
│   │   └── renderer.ts
│   └── orchestrator.ts
├── output/
│   └── [generated content]
├── .env
└── package.json
```

---

## Restrições e Premissas

### Restrições

| Tipo | Restrição | Impacto |
|------|-----------|---------|
| **Orçamento** | R$ 0 (zero) para MVP | Apenas ferramentas gratuitas e open source |
| **Tempo** | Projeto paralelo (noites/finais de semana) | Desenvolvimento incremental, sem deadline fixo |
| **Recursos** | Desenvolvedor solo (você) | Escopo precisa ser realista para 1 pessoa |
| **Infraestrutura** | Máquina local apenas | Sem custos de cloud/hosting |
| **APIs** | Limites de free tier | ~50-100 requests/dia dependendo do serviço |

### Limites Conhecidos das IAs Gratuitas

| Serviço | Limite Free Tier (estimado) |
|---------|----------------------------|
| **Groq** | 30 req/min, 14.4k tokens/min |
| **Gemini Free** | 60 req/min, 1M tokens/dia |
| **Claude Free** | ~30 mensagens/dia (web) |
| **Leonardo.ai** | 150 tokens/dia (~30-50 imagens/mês) |
| **Ideogram** | 25 imagens/dia |
| **Bing Image Creator** | 15 boosts/dia, depois lento |

### Premissas Assumidas

| # | Premissa | Risco se Falsa |
|---|----------|----------------|
| 1 | IAs gratuitas entregam qualidade aceitável para posts | MVP inviável, precisaria pagar |
| 2 | Rate limits são suficientes para 3-5 posts/semana | Precisaria alternar entre serviços |
| 3 | HTML/CSS renderizado fica profissional | Precisaria investir em design |
| 4 | Puppeteer roda bem na máquina local | Precisaria otimizar ou usar cloud |
| 5 | Pesquisa de tendências via scraping é viável | Precisaria APIs pagas ou alternativas |
| 6 | O problema (falta de tempo/criatividade) é real para mim | Projeto não resolve dor real |
| 7 | Conteúdo gerado por IA engaja igual a conteúdo manual | Pode precisar mais edição humana |
| 8 | LinkedIn aceita PDF como carrossel | Formato pode mudar/ser descontinuado |

### Dependências Externas

| Dependência | Risco | Mitigação |
|-------------|-------|-----------|
| APIs de LLM gratuitas | Podem descontinuar ou reduzir limites | Manter alternativas mapeadas |
| APIs de geração de imagem | Free tier pode acabar | Stable Diffusion local como backup |
| Fontes de tendências (Dev.to, HN) | Podem bloquear scraping | Usar RSS feeds oficiais |
| Puppeteer/Playwright | Atualizações podem quebrar | Versão fixa no package.json |

### O que NÃO estamos assumindo

- ❌ Que haverá usuários além de você no curto prazo
- ❌ Que o projeto virará um negócio
- ❌ Que a qualidade será perfeita desde o início
- ❌ Que todas as features funcionarão na primeira tentativa
- ❌ Que você terá tempo consistente para desenvolver

---

## Riscos e Questões em Aberto

### Riscos Principais

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| 1 | **Qualidade de imagem gratuita insuficiente** | Média | Alto | Testar múltiplos serviços, ter Stable Diffusion local como backup |
| 2 | **Rate limits impedem uso regular** | Média | Alto | Rotacionar entre serviços, cachear resultados |
| 3 | **Conteúdo gerado soa genérico/artificial** | Alta | Médio | Refinar prompts, adicionar etapa de humanização |
| 4 | **Pipeline muito lento (>10 min)** | Média | Médio | Paralelizar agentes, otimizar prompts |
| 5 | **Complexidade técnica subestimada** | Média | Alto | Começar com 2-3 agentes, expandir incrementalmente |
| 6 | **Perda de motivação (projeto solo)** | Média | Alto | Marcos pequenos, usar o próprio sistema para se motivar |
| 7 | **Serviços gratuitos descontinuados** | Baixa | Alto | Manter lista de alternativas atualizada |
| 8 | **Código nos slides não renderiza bem** | Baixa | Médio | Testar syntax highlighting cedo |

### Questões em Aberto

| # | Questão | Impacto na Decisão |
|---|---------|-------------------|
| 1 | Qual framework de orquestração usar (CrewAI vs LangGraph vs AutoGen)? | Define arquitetura base |
| 2 | TypeScript ou Python para implementação? | Define ecossistema de libs |
| 3 | Qual serviço de imagem gratuito tem melhor qualidade? | Precisa testar antes de decidir |
| 4 | Como lidar com tópicos que o LLM não conhece (muito recentes)? | Pode precisar de RAG ou context injection |
| 5 | Quantos slides é o ideal para carrossel de código? | Testar engajamento real |
| 6 | Qual tom funciona melhor: técnico-sério ou casual-memes? | Testar com posts reais |
| 7 | Como garantir que código nos exemplos está correto? | QA agent precisa validar sintaxe |
| 8 | Vale a pena gerar versão PT-BR e EN do mesmo post? | Depende do público-alvo desejado |

### Áreas que Precisam de Pesquisa

| Área | O que Investigar | Como |
|------|------------------|------|
| **Benchmarking de LLMs gratuitos** | Comparar qualidade Groq vs Gemini vs outros | Testes práticos com prompts reais |
| **Geradores de imagem free tier** | Leonardo vs Ideogram vs Bing vs SDXL | Gerar 10 imagens em cada, comparar |
| **Frameworks de agentes** | CrewAI vs LangGraph vs AutoGen | POC simples com cada um |
| **Renderização HTML→Imagem** | Puppeteer vs Playwright vs outras libs | Testar qualidade e performance |
| **Formatos de carrossel que engajam** | Analisar posts virais de devs | Pesquisa manual em perfis de sucesso |
| **Melhores fontes de tendências tech** | Dev.to, HN, Reddit, Twitter, newsletters | Mapear e testar scraping/RSS |

### Decisões a Tomar Antes de Codar

| Decisão | Opções | Critério de Escolha |
|---------|--------|---------------------|
| **Linguagem** | TypeScript vs Python | Familiaridade + ecossistema |
| **Framework de agentes** | CrewAI vs LangGraph | Facilidade + documentação |
| **LLM principal** | Groq vs Gemini | Qualidade + limites |
| **Gerador de imagem** | Leonardo vs Ideogram | Qualidade + limites |
| **Estrutura de prompts** | Um mega-prompt vs chain of prompts | Testar qualidade |

---

## Apêndices

### A. Referências e Inspirações

| Tipo | Recurso | Link/Descrição |
|------|---------|----------------|
| **Frameworks de Agentes** | CrewAI | https://github.com/joaomdmoura/crewAI |
| | LangGraph | https://github.com/langchain-ai/langgraph |
| | AutoGen | https://github.com/microsoft/autogen |
| **LLMs Gratuitos** | Groq | https://groq.com |
| | Google Gemini | https://ai.google.dev |
| **Geração de Imagem** | Leonardo.ai | https://leonardo.ai |
| | Ideogram | https://ideogram.ai |
| **Renderização** | Puppeteer | https://pptr.dev |
| **Syntax Highlight** | Shiki | https://shiki.style |

### B. Perfis de Devs para Inspiração

*Estudar formato, tom e frequência de posts*

| Perfil | Plataforma | O que Observar |
|--------|------------|----------------|
| @filipedeschamps | Instagram/LinkedIn | Carrosséis técnicos |
| @levelsio | Twitter/LinkedIn | Indie hacker content |
| @akaborga | LinkedIn | Posts sobre carreira dev |
| @saborit | LinkedIn | Conteúdo .NET em português |
| Fireship | YouTube/Shorts | Formato rápido e técnico |

### C. Ferramentas Similares (Referência)

| Ferramenta | O que Faz | Diferença do Nosso |
|------------|-----------|-------------------|
| **Taplio** | Posts para LinkedIn com IA | Pago, não foca em devs |
| **Postwise** | Threads para Twitter | Pago, não gera imagens |
| **Copy.ai** | Copywriting genérico | Não é específico para social |
| **Canva AI** | Design com IA | Requer trabalho manual |
| **Buffer/Hootsuite** | Agendamento | Não gera conteúdo |

### D. Recursos para Pesquisa Futura

- [ ] Analisar 20 posts virais de devs brasileiros
- [ ] Documentar rate limits reais de cada serviço
- [ ] Criar benchmark de qualidade LLM para conteúdo tech
- [ ] Testar geradores de imagem com prompts de fundo tech
- [ ] Mapear RSS feeds de fontes tech

---

## Próximos Passos

### Ações Imediatas

| # | Ação | Objetivo | Prioridade |
|---|------|----------|------------|
| 1 | **Escolher linguagem (TS vs Python)** | Definir stack base | 🔴 Alta |
| 2 | **POC de framework de agentes** | Testar CrewAI vs LangGraph com exemplo simples | 🔴 Alta |
| 3 | **Testar LLMs gratuitos** | Comparar Groq vs Gemini para geração de posts | 🔴 Alta |
| 4 | **Testar geradores de imagem** | Leonardo vs Ideogram vs Bing para fundos tech | 🔴 Alta |
| 5 | **Criar template HTML/CSS base** | Um slide de carrossel funcional | 🟡 Média |
| 6 | **Testar Puppeteer screenshot** | Validar HTML → Imagem | 🟡 Média |
| 7 | **Mapear fontes de tendências** | Listar RSS/APIs de Dev.to, HN, etc | 🟡 Média |
| 8 | **Definir estrutura do projeto** | Setup inicial do repositório | 🟡 Média |

### Sequência de Desenvolvimento Sugerida

```
FASE 0: PESQUISA E DECISÕES (1-2 semanas)
├── Testar frameworks de agentes
├── Testar LLMs gratuitos
├── Testar geradores de imagem
└── Decisão final de stack

FASE 1: AGENTES DE CONTEÚDO (2-3 semanas)
├── Agente Pesquisador
├── Agente Gerador de Tópicos
├── Agente Curador
└── Agente Redator

FASE 2: AGENTES VISUAIS (2-3 semanas)
├── Template HTML/CSS
├── Agente Designer de Imagens
├── Agente Carrossel Builder
└── Agente PDF Maker

FASE 3: QUALIDADE E ORQUESTRAÇÃO (1-2 semanas)
├── Agente QA Analyst
├── Orquestrador
└── Pipeline end-to-end

FASE 4: VALIDAÇÃO PESSOAL (ongoing)
├── Usar para gerar posts reais
├── Publicar e medir engajamento
└── Iterar baseado em feedback
```

### Handoff para Próxima Fase

> Este Project Brief fornece contexto completo para o projeto **Social Content Agent**.
>
> **Próximo passo recomendado:**
> Criar PRD detalhado com @pm para especificar cada agente, seus inputs/outputs, e fluxos de interação.
>
> **Alternativa (mais rápido):**
> Pular PRD e ir direto para FASE 0 (pesquisa de stack) se preferir validar tecnicamente antes de documentar mais.

---

*Documento gerado com auxílio do Atlas (Analyst Agent) — Synkra AIOS*
