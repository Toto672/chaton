# Pi Tooling

Ce projet s'appuie sur **Pi Coding Agent** pour éviter de reconstruire une stack IA complète côté application.

Référence officielle:  
- https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent

## Qu'est-ce que Pi

Pi est un agent de code en CLI (terminal) qui:
- gère les sessions de conversation,
- sélectionne un provider + modèle,
- exécute des outils (read/bash/edit/write, etc.),
- expose des commandes utiles comme `--list-models`.

Dans notre environnement local, la commande utilisée est:
- `~/.pi/agent/bin/pi`

## Comment Pi fonctionne (vue pratique)

1. Pi charge sa configuration utilisateur depuis `~/.pi/agent/`.
2. Pi construit le registre des modèles disponibles (providers + modèles).
3. Pi applique éventuellement un **scope** de modèles via `enabledModels`.
4. Pi lance son mode interactif ou exécute une commande one-shot.

Fichiers importants:
- `~/.pi/agent/models.json`: définition providers/modèles personnalisés.
- `~/.pi/agent/settings.json`: préférences globales, dont `enabledModels` (scope).
- `~/.pi/agent/bin/pi`: binaire/wrapper CLI exécuté par l'app.

## Modèles scoped vs tous les modèles

Pi distingue:
- **Tous les modèles**: ce que retourne la commande `pi --list-models`.
- **Scoped models**: sous-ensemble défini dans `settings.json > enabledModels`.

Convention de clé modèle dans `enabledModels`:
- `provider/modelId`
- Exemple: `openai-codex/gpt-5.3-codex`

## Commandes utiles

- Lister les modèles:
  - `~/.pi/agent/bin/pi --list-models`
- Lancer Pi en interactif:
  - `~/.pi/agent/bin/pi`
- Exécuter un prompt et sortir:
  - `~/.pi/agent/bin/pi -p "ton prompt"`

## Intégration attendue dans ce dashboard

- Le sélecteur affiche par défaut les modèles **scoped**.
- Le bouton `more` affiche **tous** les modèles.
- L'étoile ajoute/supprime un modèle du scope en modifiant réellement:
  - `~/.pi/agent/settings.json` -> `enabledModels`.

Ce comportement doit rester la source de vérité (pas de scope purement UI).
