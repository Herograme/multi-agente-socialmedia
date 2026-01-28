# UI Accessibility Checklist

Checklist de acessibilidade e usabilidade para interfaces de jogos Roblox.

**Responsavel:** @ui-ux-designer
**Revisores:** @game-designer, @lua-scripter
**Score minimo para aprovacao:** 70% (itens criticos sao obrigatorios)

---

## Principios de Acessibilidade

> "Um jogo acessivel alcanca mais jogadores e cria experiencias melhores para todos."

Este checklist cobre:
- Acessibilidade visual
- Acessibilidade motora
- Usabilidade geral
- Responsividade mobile

---

## 1. Contrast Ratios (15 pontos)

### 1.1 Text Contrast (10 pontos)
- [ ] **Texto principal tem ratio >= 4.5:1** - WCAG AA para texto normal (3 pts)
  - Cores verificadas: ________________
  - Tool usado: ________________
- [ ] **Texto grande tem ratio >= 3:1** - WCAG AA para texto >= 18pt (2 pts)
- [ ] **Texto sobre imagens tem background** - Sombra ou overlay para legibilidade (2 pts)
- [ ] **Texto de UI critica tem ratio >= 7:1** - WCAG AAA para info importante (2 pts)
- [ ] **Placeholder text legivel** - Nao muito claro em inputs (1 pt)

### 1.2 UI Element Contrast (5 pontos)
- [ ] **Botoes distinguiveis do fundo** - Borda ou contraste claro (2 pts)
- [ ] **Estados de botao visiveis** - Hover, pressed, disabled distintos (2 pts)
- [ ] **Icones tem contraste suficiente** - Reconheciveis em qualquer fundo (1 pt)

**Score Contrast:** ____/15

---

## 2. Touch Targets (15 pontos)

### 2.1 Tamanho Minimo (10 pontos)
- [ ] **Botoes principais >= 48x48dp** - Minimo recomendado (3 pts)
  - _44x44 e minimo absoluto, 48x48 e ideal_
- [ ] **Botoes secundarios >= 44x44dp** - Minimo absoluto (2 pts)
- [ ] **Espacamento entre targets >= 8dp** - Evita toque acidental (3 pts)
- [ ] **Icones clicaveis tem padding** - Area de toque maior que icone visual (2 pts)

### 2.2 Posicionamento (5 pontos)
- [ ] **Botoes frequentes em "thumb zone"** - Alcancaveis com polegar (2 pts)
- [ ] **Acoes destrutivas longe de acoes comuns** - Evita erro acidental (2 pts)
- [ ] **Botao de fechar (X) acessivel** - Nao escondido ou muito pequeno (1 pt)

**Score Touch Targets:** ____/15

---

## 3. Color-Blind Friendly (15 pontos)

### 3.1 Nao Depender Apenas de Cor (10 pontos)
- [ ] **Informacao critica tem mais que cor** - Icone, texto, ou pattern (4 pts)
  - Ex: Erro = vermelho + icone X + texto "Erro"
- [ ] **Diferencas de estado nao sao so cor** - Forma ou posicao muda tambem (3 pts)
- [ ] **Graficos/mapas tem patterns** - Alem de cores diferentes (2 pts)
- [ ] **Links tem underline alem de cor** - Identificaveis sem cor (1 pt)

### 3.2 Paletas Testadas (5 pontos)
- [ ] **Testado para Deuteranopia** - Verde-vermelho (2 pts)
- [ ] **Testado para Protanopia** - Vermelho-verde (2 pts)
- [ ] **Testado para Tritanopia** - Azul-amarelo (1 pt)

_Tools: Coblis, Color Oracle, Sim Daltonism_

**Score Color-Blind:** ____/15

---

## 4. Font Sizes (15 pontos)

### 4.1 Tamanhos Base (10 pontos)
- [ ] **Body text >= 14pt** - Legivel em mobile (3 pts)
  - Body atual: ____ pt
- [ ] **Headers claramente maiores** - Hierarquia visual clara (2 pts)
  - H1: ____ pt, H2: ____ pt, H3: ____ pt
- [ ] **Texto minimo >= 12pt** - Nenhum texto menor (2 pts)
- [ ] **Numeros importantes >= 16pt** - Currency, HP, scores (2 pts)
- [ ] **Texto em botoes >= 14pt** - Legivel rapidamente (1 pt)

### 4.2 Escalabilidade (5 pontos)
- [ ] **UI escala com diferentes resolucoes** - Nao fica minusculo em 4K (2 pts)
- [ ] **Option de texto grande disponivel** - Setting para aumentar fonts (2 pts)
- [ ] **Texto nao corta em nenhuma resolucao** - Truncation com "..." se necessario (1 pt)

**Score Font Sizes:** ____/15

---

## 5. Information Hierarchy (15 pontos)

### 5.1 Visual Hierarchy (10 pontos)
- [ ] **Informacao mais importante e mais proeminente** - Tamanho, cor, posicao (3 pts)
- [ ] **Agrupamento logico de elementos** - Relacionados ficam juntos (2 pts)
- [ ] **Espacamento cria separacao clara** - Whitespace intencional (2 pts)
- [ ] **Fluxo de leitura natural** - Esquerda-direita, cima-baixo (2 pts)
- [ ] **Focal points claros** - Olho sabe para onde ir primeiro (1 pt)

### 5.2 Cognitive Load (5 pontos)
- [ ] **Maximo 5-7 items por grupo** - Nao sobrecarrega memoria (2 pts)
- [ ] **Informacao progressiva** - Detalhes em camadas (2 pts)
- [ ] **Iconografia consistente** - Mesmos icones para mesmas acoes (1 pt)

**Score Hierarchy:** ____/15

---

## 6. Mobile Responsiveness (25 pontos)

### 6.1 Layout Adaptation (10 pontos)
- [ ] **UI se adapta a portrait e landscape** - Se suporta ambos (2 pts)
- [ ] **Elementos reposicionam para diferentes aspect ratios** - 16:9, 18:9, 4:3 (3 pts)
- [ ] **Safe zones respeitadas** - Notch, home indicator, etc (3 pts)
- [ ] **Nenhum elemento cortado nas bordas** - Em qualquer resolucao (2 pts)

### 6.2 Mobile-First Considerations (10 pontos)
- [ ] **HUD nao bloqueia gameplay** - Elementos em cantos (2 pts)
- [ ] **Menus full-screen em mobile** - Nao janelas pequenas (2 pts)
- [ ] **Scroll funciona suavemente** - Em listas e inventarios (2 pts)
- [ ] **Pinch-to-zoom desabilitado em UI** - Evita zoom acidental (2 pts)
- [ ] **Keyboard virtual nao cobre input** - Tela ajusta quando teclado abre (2 pts)

### 6.3 Touch Gestures (5 pontos)
- [ ] **Swipe funciona onde esperado** - Tabs, pages, inventario (2 pts)
- [ ] **Long-press para info adicional** - Tooltips adaptados para touch (2 pts)
- [ ] **Gestos sao descobriveis** - Indicadores visuais ou tutorial (1 pt)

**Score Mobile:** ____/25

---

## Checklist Rapido por Tela

Para cada tela principal, verificar:

### Main Menu
- [ ] Logo/titulo legivel
- [ ] Botoes com tamanho adequado
- [ ] Opcoes acessiveis
- [ ] Responsive em mobile

### HUD (In-Game)
- [ ] Info essencial visivel
- [ ] Nao bloqueia gameplay
- [ ] Contraste adequado sobre o jogo
- [ ] Touch-friendly em mobile

### Shop/Store
- [ ] Precos claramente visiveis
- [ ] Items distinguiveis
- [ ] Botao de compra destacado
- [ ] Confirmacao de compra clara

### Inventory
- [ ] Items identificaveis
- [ ] Categorias claras
- [ ] Scroll funcional
- [ ] Selection feedback

### Settings
- [ ] Toggles grandes o suficiente
- [ ] Sliders funcionais em touch
- [ ] Labels claras
- [ ] Save/Cancel obvios

---

## Calculo do Score

| Secao | Peso | Score | Max |
|-------|------|-------|-----|
| Contrast Ratios | 15% | | /15 |
| Touch Targets | 15% | | /15 |
| Color-Blind Friendly | 15% | | /15 |
| Font Sizes | 15% | | /15 |
| Information Hierarchy | 15% | | /15 |
| Mobile Responsiveness | 25% | | /25 |
| **TOTAL** | **100%** | | **/100** |

---

## Itens Criticos (Obrigatorios)

Os seguintes itens SAO OBRIGATORIOS independente do score:

- [ ] **CRITICO:** Texto principal legivel (>= 14pt, contraste >= 4.5:1)
- [ ] **CRITICO:** Botoes principais clicaveis em mobile (>= 44x44dp)
- [ ] **CRITICO:** Nenhum elemento corta fora da tela
- [ ] **CRITICO:** Informacao critica nao depende apenas de cor
- [ ] **CRITICO:** UI funcional em dispositivo mobile de teste

> Se qualquer item CRITICO falhar, a UI NAO esta pronta para launch.

---

## Criterios de Aprovacao

| Score | Status | Acao |
|-------|--------|------|
| 90-100% | **EXCELENTE** | UI exemplar, referencia para outros projetos |
| 80-89% | **MUITO BOM** | Aprovado, pequenos refinamentos opcionais |
| 70-79% | **ACEITAVEL** | Aprovado, melhorias recomendadas pos-launch |
| 50-69% | **PRECISA TRABALHO** | Revisar antes de launch |
| < 50% | **REPROVADO** | Redesign necessario |

---

## Ferramentas Recomendadas

### Contrast Checkers
- WebAIM Contrast Checker
- Contrast Ratio by Lea Verou
- Stark (Figma plugin)

### Color Blindness Simulators
- Coblis Color Blindness Simulator
- Color Oracle (desktop app)
- Sim Daltonism (Mac)

### Responsive Testing
- Roblox Studio Device Emulation
- Chrome DevTools Device Mode
- Real devices (iOS/Android)

### Design Review
- Figma Mirror (preview em mobile)
- Roblox Mobile App (teste real)

---

## Notas da Revisao

**Revisor:** ____________________
**Data:** ____________________
**Score Final:** ____/100
**Status:** [ ] APROVADO / [ ] REPROVADO

### Telas Testadas
1.
2.
3.
4.
5.

### Dispositivos Testados
- [ ] PC (resolucao: ____)
- [ ] iPhone (modelo: ____)
- [ ] iPad (modelo: ____)
- [ ] Android (modelo: ____)

### Issues Encontradas
1.
2.
3.

### Recomendacoes de Melhoria
1.
2.
3.

---

## Recursos Adicionais

### Roblox-Specific Guidelines
- [Roblox UI Best Practices](https://create.roblox.com/docs/building-and-visuals/ui)
- [Mobile Considerations](https://create.roblox.com/docs/building-and-visuals/ui/cross-platform-design)

### General Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

---

*Checklist v1.0 - Roblox Game Studio Squad - UI Accessibility*
