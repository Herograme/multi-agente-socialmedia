# Architecture Review Checklist

Checklist tecnico para revisao de arquitetura de jogos Roblox.

**Responsavel:** @lua-scripter
**Revisores:** @game-designer (validar que arquitetura suporta design)
**Score minimo para aprovacao:** 75%

---

## 1. Server-Side Authority (SSA) (20 pontos)

### 1.1 Autoridade do Servidor (12 pontos)
- [ ] **Toda logica de game e server-side** - Combate, economia, progressao no server (3 pts)
- [ ] **Cliente e apenas visual/input** - Client nao decide outcomes (3 pts)
- [ ] **Validacao de acoes no servidor** - Server verifica TODA acao do cliente (3 pts)
- [ ] **Estado autoritativo no servidor** - Server e source of truth (3 pts)

### 1.2 Comunicacao Client-Server (8 pontos)
- [ ] **RemoteEvents para acoes one-way** - Corretamente usados (2 pts)
- [ ] **RemoteFunctions para request-response** - Com timeout handling (2 pts)
- [ ] **Rate limiting implementado** - Previne spam de remotes (2 pts)
- [ ] **Payload validation** - Server valida todos os dados recebidos (2 pts)

**Score SSA:** ____/20

---

## 2. Security Patterns (20 pontos)

### 2.1 Anti-Exploit Measures (12 pontos)
- [ ] **Nenhum segredo no cliente** - API keys, formulas sensiveis no server (3 pts)
- [ ] **Sanity checks em todas entradas** - Valores dentro de ranges esperados (3 pts)
- [ ] **Teleport validation** - Posicao do jogador verificada server-side (2 pts)
- [ ] **Speed/fly detection** - Deteccao de movimento anomalo (2 pts)
- [ ] **Cooldown enforcement server-side** - Cooldowns nao confiam no cliente (2 pts)

### 2.2 Data Integrity (8 pontos)
- [ ] **Economia protegida** - Impossivel gerar moeda client-side (3 pts)
- [ ] **Inventario server-authoritative** - Items verificados no servidor (2 pts)
- [ ] **Progressao protegida** - XP/levels calculados server-side (2 pts)
- [ ] **Logging de acoes suspeitas** - Anomalias sao logadas (1 pt)

**Score Security:** ____/20

---

## 3. DataStore Patterns (20 pontos)

### 3.1 Data Structure (10 pontos)
- [ ] **Schema versionado** - DataVersion field para migrations (2.5 pts)
- [ ] **Keys bem estruturadas** - Formato consistente (UserId, prefixos) (2 pts)
- [ ] **Dados serializaveis** - Sem userdata, functions em saves (2 pts)
- [ ] **Tamanho de dados controlado** - Monitoramento de data size (2 pts)
- [ ] **Separacao de dados hot/cold** - Frequentes vs raramente acessados (1.5 pts)

### 3.2 Save/Load Reliability (10 pontos)
- [ ] **SessionLocking implementado** - Previne corrupcao de dados (3 pts)
- [ ] **Retry logic com backoff** - Handles DataStore failures (2 pts)
- [ ] **Auto-save periodico** - Saves regulares (5-10 min) (2 pts)
- [ ] **Save on leave** - BindToClose e PlayerRemoving handling (2 pts)
- [ ] **Fallback para falhas** - Comportamento graceful se DataStore falha (1 pt)

**Score DataStore:** ____/20

---

## 4. Performance Considerations (15 pontos)

### 4.1 Memory Management (8 pontos)
- [ ] **Connections limpas** - :Disconnect() em todos listeners (2 pts)
- [ ] **Instances destruidas** - :Destroy() quando nao mais necessarias (2 pts)
- [ ] **Object pooling para frequentes** - Reutilizacao de objetos (2 pts)
- [ ] **Sem memory leaks** - Verificado com Memory profiler (2 pts)

### 4.2 CPU Optimization (7 pontos)
- [ ] **Loops otimizados** - Sem loops O(n^2) desnecessarios (2 pts)
- [ ] **Debounce em eventos frequentes** - Cooldowns em rapid-fire events (2 pts)
- [ ] **Task scheduling** - Operacoes pesadas distribuidas em frames (2 pts)
- [ ] **Profiling realizado** - MicroProfiler usado para identificar bottlenecks (1 pt)

**Score Performance:** ____/15

---

## 5. Mobile Optimization (10 pontos)

### 5.1 Device Compatibility (5 pontos)
- [ ] **LOD system implementado** - Menor qualidade para mobile (1.5 pts)
- [ ] **Streaming habilitado** - StreamingEnabled = true com config (1.5 pts)
- [ ] **Physics simplificado** - Menos physics em low-end (1 pt)
- [ ] **Texture resolution scaling** - Texturas menores para mobile (1 pt)

### 5.2 Input Handling (5 pontos)
- [ ] **Touch controls funcionais** - UI responsiva ao toque (2 pts)
- [ ] **Screen size adaptation** - UI escala para diferentes telas (1.5 pts)
- [ ] **Virtual joystick** - Controles touch intuitivos (1.5 pts)

**Score Mobile:** ____/10

---

## 6. Code Organization (15 pontos)

### 6.1 Project Structure (8 pontos)
- [ ] **Folders bem organizadas** - ServerScriptService, ReplicatedStorage, etc corretos (2 pts)
- [ ] **Naming conventions** - PascalCase para modules, camelCase para variaveis (2 pts)
- [ ] **Separacao de concerns** - Modulos com responsabilidade unica (2 pts)
- [ ] **Nenhum script em Workspace** - Logica em Services apropriados (2 pts)

### 6.2 Code Quality (7 pontos)
- [ ] **Modules reutilizaveis** - Codigo DRY (2 pts)
- [ ] **Error handling consistente** - pcall/xpcall onde necessario (2 pts)
- [ ] **Documentacao em codigo** - Comentarios em logica complexa (1.5 pts)
- [ ] **Type annotations** - Usando --!strict ou type annotations (1.5 pts)

**Score Code Organization:** ____/15

---

## Diagramas Obrigatorios

Para aprovacao, a arquitetura deve incluir:

### Obrigatorio
- [ ] **Diagrama de comunicacao Client-Server** - Mostra RemoteEvents/Functions
- [ ] **Diagrama de fluxo de dados** - Como dados fluem no sistema
- [ ] **Estrutura de DataStore** - Schema dos dados salvos

### Recomendado
- [ ] **Diagrama de modulos** - Dependencias entre scripts
- [ ] **State machine diagrams** - Para sistemas complexos
- [ ] **Sequence diagrams** - Para fluxos criticos

---

## Calculo do Score

| Secao | Peso | Score | Ponderado |
|-------|------|-------|-----------|
| Server-Side Authority | 20% | /20 | |
| Security Patterns | 20% | /20 | |
| DataStore Patterns | 20% | /20 | |
| Performance | 15% | /15 | |
| Mobile Optimization | 10% | /10 | |
| Code Organization | 15% | /15 | |
| **TOTAL** | **100%** | **/100** | |

---

## Criterios de Aprovacao

| Score | Status | Acao |
|-------|--------|------|
| 90-100% | **EXCELENTE** | Arquitetura solida, pronto para desenvolvimento |
| 75-89% | **APROVADO** | Pode prosseguir com melhorias durante dev |
| 60-74% | **REVISAO NECESSARIA** | Refazer secoes criticas antes de prosseguir |
| < 60% | **REPROVADO** | Arquitetura precisa redesign |

---

## Critical Failures (Reprovacao Automatica)

Se QUALQUER item abaixo for verdadeiro, a arquitetura e REPROVADA:

- [ ] **Logica de economia no cliente** - Moedas/items decididos client-side
- [ ] **Sem validacao server-side** - Server confia cegamente no cliente
- [ ] **DataStore sem error handling** - Pode perder dados de jogadores
- [ ] **Segredos expostos no cliente** - API keys, formulas no ReplicatedStorage

---

## Code Review Checklist Rapido

Para cada script, verificar:

```lua
-- SERVER SCRIPTS (ServerScriptService)
[ ] Toda logica de game aqui
[ ] Validacao de RemoteEvents
[ ] DataStore handling
[ ] Error logging

-- CLIENT SCRIPTS (StarterPlayerScripts, StarterGui)
[ ] Apenas UI e input
[ ] Nenhuma decisao de game
[ ] Nao confia em valores locais
[ ] Requests ao server para acoes

-- MODULES (ReplicatedStorage)
[ ] Utilidades compartilhadas
[ ] Types/Interfaces
[ ] Constants
[ ] SEM logica de negocio sensivel
```

---

## Notas da Revisao

**Revisor:** ____________________
**Data:** ____________________
**Score Final:** ____/100
**Status:** [ ] APROVADO / [ ] REVISAO NECESSARIA / [ ] REPROVADO

### Pontos Fortes da Arquitetura
1.
2.
3.

### Riscos Identificados
1.
2.
3.

### Melhorias Obrigatorias
1.
2.
3.

### Melhorias Recomendadas
1.
2.
3.

---

*Checklist v1.0 - Roblox Game Studio Squad - Arquitetura Tecnica*
