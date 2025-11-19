# 🎬 Video Transcription & Knowledge Extractor

> **Plugin Obsidian haut de gamme pour transformer des vidéos en connaissances structurées**

Un plugin Obsidian premium qui permet de rechercher, télécharger et transcrire des vidéos depuis YouTube, GitLab et d'autres plateformes, puis de générer automatiquement des notes atomiques enrichies avec l'IA.

---

## ✨ Fonctionnalités

### 🔍 Recherche Multi-Plateforme
- **YouTube** : Recherche et récupération de vidéos avec métadonnées complètes
- **GitLab** : Accès aux vidéos hébergées sur GitLab
- **Vimeo** : Support prévu pour d'autres plateformes
- Interface de recherche intuitive avec prévisualisation

### 🤖 Intelligence Artificielle
- **Multi-LLM** : Support de OpenAI (GPT-4), Anthropic (Claude), et Google AI (Gemini)
- **Transcription automatique** : Utilisation de Whisper API ou sous-titres YouTube
- **Génération intelligente** : Notes atomiques, résumés, cas d'utilisation

### 📝 Génération de Notes Automatique

#### Notes Atomiques (Zettelkasten)
- Extraction automatique des idées principales
- Une idée = Une note
- Tags et concepts reliés automatiques
- Timestamps pour retrouver le contexte dans la vidéo

#### Résumés Structurés
- Vue d'ensemble concise
- Points clés extraits
- Concepts techniques identifiés
- Ressources liées suggérées

#### Cas d'Utilisation Guidés
- Scénarios pratiques d'application
- Étapes détaillées
- Niveaux de difficulté
- Prérequis identifiés

### 🎯 Organisation dans Obsidian
- Création automatique de dossiers structurés
- Liens bidirectionnels entre les notes
- Métadonnées YAML complètes
- Intégration parfaite avec le graphe Obsidian

---

## 🚀 Installation

### Méthode 1 : Installation manuelle (Développement)

1. Clonez ce dépôt dans votre dossier de plugins Obsidian :
```bash
cd /chemin/vers/votre/vault/.obsidian/plugins/
git clone https://github.com/Bobyyy70/.github.git video-transcription-knowledge
cd video-transcription-knowledge
```

2. Installez les dépendances :
```bash
npm install
```

3. Compilez le plugin :
```bash
npm run build
```

4. Activez le plugin dans Obsidian :
   - Paramètres → Plugins communautaires
   - Désactivez le mode restreint
   - Activez "Video Transcription & Knowledge Extractor"

### Méthode 2 : Via BRAT (Beta Reviewers Auto-update Tester)

1. Installez le plugin BRAT depuis les plugins communautaires
2. Ajoutez ce dépôt : `Bobyyy70/.github`
3. Le plugin sera automatiquement installé et mis à jour

---

## ⚙️ Configuration

### 1. Clés API Requises

#### YouTube API (Obligatoire pour YouTube)
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. Activez l'API YouTube Data v3
4. Créez des identifiants (Clé API)
5. Copiez la clé dans les paramètres du plugin

#### OpenAI API (Recommandé)
1. Créez un compte sur [OpenAI](https://platform.openai.com/)
2. Générez une clé API
3. Collez-la dans les paramètres du plugin
4. **Services utilisés** :
   - Whisper : Transcription audio
   - GPT-4 : Génération de notes et résumés

#### Anthropic API (Alternative)
1. Créez un compte sur [Anthropic](https://console.anthropic.com/)
2. Générez une clé API
3. Collez-la dans les paramètres
4. **Modèles** : Claude 3 Opus, Sonnet, Haiku

#### Google AI API (Alternative)
1. Accédez à [Google AI Studio](https://makersuite.google.com/)
2. Générez une clé API
3. Utilisez Gemini Pro pour la génération

### 2. Paramètres du Plugin

#### Configuration LLM
- **Provider de transcription** : OpenAI (Whisper recommandé)
- **Provider LLM** : Choisissez votre modèle préféré
- **Température** : 0.7 pour un bon équilibre créativité/précision
- **Langue** : Code langue (ex: `fr`, `en`)

#### Chemins des Dossiers
```
Notes/Video Transcriptions  → Transcriptions complètes
Notes/Atomic Ideas          → Notes atomiques
Notes/Summaries             → Résumés de vidéos
```

#### Options de Génération
- ✅ **Générer notes atomiques** : Recommandé
- ✅ **Générer résumé** : Recommandé
- ✅ **Générer cas d'utilisation** : Selon besoin
- **Nombre max de notes atomiques** : 10-20 recommandé

---

## 📖 Guide d'Utilisation

### 🔍 Méthode 1 : Recherche Intégrée

1. Cliquez sur l'icône 🎬 dans la barre latérale
2. Ou utilisez la commande `Ctrl/Cmd + P` → "Rechercher et transcrire une vidéo"
3. Entrez vos mots-clés de recherche
4. Choisissez la plateforme (YouTube, GitLab, ou toutes)
5. Cliquez sur "Rechercher"
6. Sélectionnez la vidéo souhaitée dans les résultats
7. Cliquez sur "Traiter cette vidéo"

### 🔗 Méthode 2 : URL Directe

1. Ouvrez le modal de recherche
2. Collez l'URL de la vidéo dans le champ "URL directe"
3. Cliquez sur "Traiter cette vidéo"

### 📋 Méthode 3 : Depuis le Presse-papier

1. Copiez une URL de vidéo YouTube/GitLab
2. Utilisez la commande "Traiter la vidéo depuis le presse-papier"
3. Le plugin traite automatiquement l'URL

### 🎯 Résultat du Traitement

Le plugin crée automatiquement :

1. **Note principale** (`Notes/Video Transcriptions/Titre de la vidéo.md`)
   - Métadonnées complètes
   - Transcription intégrale
   - Liens vers les notes atomiques et le résumé

2. **Notes atomiques** (`Notes/Atomic Ideas/Idée principale.md`)
   - Une note par concept important
   - Tags automatiques
   - Concepts reliés
   - Timestamp pour retrouver dans la vidéo

3. **Résumé** (`Notes/Summaries/Titre - Résumé.md`)
   - Vue d'ensemble
   - Points clés
   - Cas d'utilisation guidés
   - Ressources liées

---

## 🎨 Exemples de Notes Générées

### Note Atomique Exemple
```markdown
---
title: Architecture de microservices avec Kubernetes
tags: #kubernetes, #microservices, #devops
source: "[[Introduction à Kubernetes - Tutoriel complet]]"
created: 2024-01-15T10:30:00Z
type: atomic-note
---

# Architecture de microservices avec Kubernetes

> ⏱️ Timestamp: 12:45

Kubernetes permet d'orchestrer des conteneurs Docker en clusters...

## Concepts reliés

- [[Conteneurisation Docker]]
- [[Service Mesh]]
- [[CI/CD Pipeline]]

---
*Note atomique générée automatiquement depuis la vidéo "Introduction à Kubernetes"*
```

### Résumé Exemple
```markdown
---
title: Introduction à Kubernetes - Résumé
type: video-summary
url: https://youtube.com/watch?v=...
created: 2024-01-15T10:30:00Z
---

# Introduction à Kubernetes - Résumé

## 📋 Vue d'ensemble

Cette vidéo présente les concepts fondamentaux de Kubernetes...

## 🔑 Points clés

1. Kubernetes est un orchestrateur de conteneurs
2. Architecture maître-nœud
3. Pods comme unité de déploiement de base
...

## 💡 Cas d'utilisation

### 1. Déployer une application web scalable (intermediate)

Déploiement d'une application Node.js avec auto-scaling...

**Étapes:**
1. Créer un Dockerfile
2. Builder l'image Docker
3. Créer un manifeste Kubernetes
...
```

---

## 🏗️ Architecture du Plugin

```
src/
├── main.ts                          # Point d'entrée du plugin
├── types.ts                         # Définitions TypeScript
├── settings-tab.ts                  # Interface de paramètres
├── services/
│   ├── llm-service.ts              # Intégration LLM (OpenAI, Anthropic, Google)
│   ├── video-search-service.ts     # Recherche multi-plateforme
│   ├── video-processor-service.ts  # Orchestration du traitement
│   └── notes-generator-service.ts  # Génération de notes atomiques
└── ui/
    └── video-search-modal.ts       # Interface de recherche
```

---

## 🛠️ Développement

### Prérequis
- Node.js 18+
- npm ou yarn
- TypeScript

### Scripts disponibles
```bash
npm run dev       # Mode développement avec watch
npm run build     # Build de production
npm run version   # Bump de version
```

### Contribuer

Les contributions sont les bienvenues ! Veuillez :

1. Forker le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pusher vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 🔮 Roadmap

### Version 1.1
- [ ] Support de Vimeo complet
- [ ] Téléchargement réel des vidéos
- [ ] Transcription locale avec Whisper
- [ ] Export en PDF des notes

### Version 1.2
- [ ] Support de Twitch
- [ ] Détection automatique de chapitres
- [ ] Génération de mindmaps
- [ ] Intégration avec Anki

### Version 2.0
- [ ] Mode batch pour traiter plusieurs vidéos
- [ ] IA pour suggérer des connexions entre notes
- [ ] Détection de personnes et concepts
- [ ] Dashboard de statistiques

---

## ❓ FAQ

### Le plugin nécessite-t-il une connexion internet ?
Oui, pour accéder aux APIs (YouTube, OpenAI, etc.).

### Les vidéos sont-elles téléchargées localement ?
Dans cette version, non. La transcription se fait via les APIs.

### Puis-je utiliser mon propre modèle LLM ?
Oui, le code est modulaire. Vous pouvez ajouter d'autres providers.

### Combien coûte l'utilisation des APIs ?
- YouTube API : Gratuit (quotas)
- OpenAI : ~$0.006 par minute de vidéo (Whisper) + GPT-4
- Anthropic : Variable selon le modèle Claude
- Google AI : Gratuit pour Gemini Pro (limites)

### Le plugin fonctionne-t-il hors ligne ?
Non, les APIs nécessitent une connexion internet.

---

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [Obsidian](https://obsidian.md/) pour l'excellente plateforme
- [OpenAI](https://openai.com/) pour Whisper et GPT-4
- [Anthropic](https://anthropic.com/) pour Claude
- [Google](https://ai.google.dev/) pour Gemini
- Matthew Berman pour le concept Abstract AI

---

## 📧 Contact

**ZenitoGR** - zenito@zengod.gr

Lien du projet : [https://github.com/Bobyyy70/.github](https://github.com/Bobyyy70/.github)

---

## 🌟 Support

Si vous trouvez ce plugin utile, n'hésitez pas à :
- ⭐ Mettre une étoile au projet
- 🐛 Signaler des bugs
- 💡 Proposer de nouvelles fonctionnalités
- 📖 Améliorer la documentation

---

**Créé avec ❤️ par ZenitoGR**

*Abstract AI Collab - Transformez vos vidéos en connaissances structurées*
