---
task: Create Game System
responsavel: "@lua-scripter"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - system_name: Nome do sistema (ex: combat, inventory, quest)
  - system_type: Tipo (client, server, shared)
  - features: Lista de funcionalidades
Saida: |
  - scripts: Scripts criados
  - modules: Módulos gerados
  - remotes: RemoteEvents/Functions configurados
  - documentation: Documentação do sistema
Checklist:
  - "[ ] Definir escopo do sistema"
  - "[ ] Criar estrutura de pastas"
  - "[ ] Implementar módulo principal"
  - "[ ] Configurar comunicação client-server"
  - "[ ] Adicionar tratamento de erros"
  - "[ ] Documentar API pública"
  - "[ ] Criar testes básicos"
---

# *create-game-system

Cria um sistema de jogo completo para Roblox seguindo boas práticas.

## Uso

```
@lua-scripter
*create-game-system combat
*create-game-system inventory --type shared
```

## Elicitação

```
? Nome do sistema: combat-system
? Tipo de sistema:
  > Server (lógica no servidor)
    Client (UI e efeitos locais)
    Shared (módulos compartilhados)
? Funcionalidades principais:
  [ ] Dano e vida
  [ ] Habilidades/Skills
  [ ] Cooldowns
  [ ] Efeitos de status
  [ ] Combos
? Precisa de persistência (DataStore)? (y/N)
? Incluir sistema de eventos? (Y/n)
```

## Estrutura Gerada

```
ServerScriptService/
└── Systems/
    └── CombatSystem/
        ├── init.lua           # Entry point
        ├── CombatManager.lua  # Lógica principal
        ├── DamageCalculator.lua
        └── Config.lua         # Configurações

ReplicatedStorage/
└── Modules/
    └── Combat/
        ├── CombatTypes.lua    # Types/Interfaces
        └── CombatUtils.lua    # Utilitários

ReplicatedStorage/
└── Remotes/
    └── Combat/
        ├── DealDamage.lua     # RemoteEvent
        └── GetStats.lua       # RemoteFunction
```

## Template: Módulo Principal

```lua
--[[
    CombatSystem
    Gerencia toda a lógica de combate do jogo

    @author Squad Roblox Game Studio
    @version 1.0.0
]]

local CombatSystem = {}
CombatSystem.__index = CombatSystem

-- Services
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Dependencies
local Config = require(script.Config)
local DamageCalculator = require(script.DamageCalculator)

-- Private
local activeEntities = {}

-- Constructor
function CombatSystem.new()
    local self = setmetatable({}, CombatSystem)
    self:_init()
    return self
end

function CombatSystem:_init()
    -- Setup remotes
    self:_setupRemotes()
    -- Connect events
    self:_connectEvents()
end

-- Public API
function CombatSystem:DealDamage(attacker, target, amount)
    -- Validate
    if not attacker or not target then
        warn("[CombatSystem] Invalid attacker or target")
        return false
    end

    -- Calculate final damage
    local finalDamage = DamageCalculator:Calculate(attacker, target, amount)

    -- Apply damage
    local success, err = pcall(function()
        -- Implementation
    end)

    if not success then
        warn("[CombatSystem] Error dealing damage:", err)
        return false
    end

    return true, finalDamage
end

function CombatSystem:GetEntityStats(entity)
    return activeEntities[entity] or nil
end

-- Private methods
function CombatSystem:_setupRemotes()
    -- Create RemoteEvents folder if needed
    local remotesFolder = ReplicatedStorage:FindFirstChild("Remotes")
    if not remotesFolder then
        remotesFolder = Instance.new("Folder")
        remotesFolder.Name = "Remotes"
        remotesFolder.Parent = ReplicatedStorage
    end
end

function CombatSystem:_connectEvents()
    Players.PlayerAdded:Connect(function(player)
        self:_registerPlayer(player)
    end)

    Players.PlayerRemoving:Connect(function(player)
        self:_unregisterPlayer(player)
    end)
end

function CombatSystem:_registerPlayer(player)
    activeEntities[player] = {
        health = Config.DEFAULT_HEALTH,
        maxHealth = Config.DEFAULT_HEALTH,
        defense = Config.DEFAULT_DEFENSE,
    }
end

function CombatSystem:_unregisterPlayer(player)
    activeEntities[player] = nil
end

-- Cleanup
function CombatSystem:Destroy()
    -- Cleanup connections and data
    activeEntities = {}
end

return CombatSystem
```

## Próximos Passos

Após criar o sistema:

1. Testar no Roblox Studio
2. Integrar com outros sistemas
3. Adicionar UI com `@ui-ux-designer`
4. Balancear com `@game-designer`
