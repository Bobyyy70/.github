# 🌟 Guide d'installation Ollama pour modèles Open Source

## Qu'est-ce qu'Ollama ?

**Ollama** est un outil qui vous permet d'exécuter des modèles de langage open source **directement sur votre ordinateur**, **gratuitement** et **en privé**.

### Avantages d'Ollama :
- ✅ **100% Gratuit** : Aucun coût d'API
- ✅ **Privé** : Vos données ne quittent jamais votre ordinateur
- ✅ **Rapide** : Pas de latence réseau, tout est local
- ✅ **Modèles puissants** : Llama 3.2, Mistral, CodeLlama, et bien d'autres
- ✅ **Facile à utiliser** : Installation simple en quelques minutes

---

## 📥 Installation d'Ollama

### Windows

1. Téléchargez l'installateur : [ollama.com/download/windows](https://ollama.com/download/windows)
2. Exécutez le fichier `.exe`
3. Suivez les instructions d'installation
4. Ollama sera automatiquement lancé en arrière-plan

### macOS

1. Téléchargez l'installateur : [ollama.com/download/mac](https://ollama.com/download/mac)
2. Ouvrez le fichier `.dmg`
3. Glissez Ollama dans votre dossier Applications
4. Lancez Ollama depuis vos Applications

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 🚀 Télécharger des modèles

Une fois Ollama installé, ouvrez un terminal et téléchargez vos modèles préférés :

### Llama 3.2 (Recommandé - Excellent rapport qualité/performance)
```bash
ollama pull llama3.2
```

### Mistral (Très bon pour le français)
```bash
ollama pull mistral
```

### CodeLlama (Spécialisé pour le code)
```bash
ollama pull codellama
```

### Autres modèles populaires
```bash
# Llama 3.1 (Plus puissant, mais plus lourd)
ollama pull llama3.1

# Gemma 2 (De Google)
ollama pull gemma2

# Qwen 2.5 (Excellent pour les langues asiatiques)
ollama pull qwen2.5
```

**Liste complète des modèles** : [ollama.com/library](https://ollama.com/library)

---

## ⚙️ Configuration dans le plugin

1. Ouvrez Obsidian
2. Allez dans **Paramètres** → **Video Transcription & Knowledge Extractor**
3. Dans la section **🌟 Modèles Open Source**, configurez :
   - **Utiliser des modèles locaux** : ✅ Activé
   - **Endpoint Ollama** : `http://localhost:11434` (par défaut)
   - **Modèle Ollama** : `llama3.2` (ou le modèle que vous avez téléchargé)

4. Dans la section **🤖 Configuration LLM** :
   - **Provider LLM** : Sélectionnez `🌟 Ollama (Local, Gratuit)`

---

## ✅ Vérifier qu'Ollama fonctionne

### Test dans le terminal

```bash
ollama run llama3.2
```

Vous devriez voir une interface de chat. Tapez une question et le modèle répondra.

Pour quitter : `/bye`

### Test avec curl

```bash
curl http://localhost:11434/api/tags
```

Devrait retourner la liste des modèles installés au format JSON.

---

## 🎯 Modèles recommandés par cas d'usage

### Pour l'analyse de vidéos (Usage général)
```bash
ollama pull llama3.2        # Équilibré, rapide
```

### Pour le français
```bash
ollama pull mistral         # Excellent en français
ollama pull vigogne         # Spécialement entraîné pour le français
```

### Pour du contenu technique/code
```bash
ollama pull codellama       # Spécialisé programmation
ollama pull deepseek-coder  # Excellent pour le code
```

### Pour la performance maximale (nécessite GPU puissant)
```bash
ollama pull llama3.1:70b    # Très puissant mais lourd
```

---

## 📊 Comparaison des modèles

| Modèle | Taille | RAM requise | Vitesse | Qualité | Meilleur pour |
|--------|--------|-------------|---------|---------|---------------|
| llama3.2 | ~2 GB | 8 GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Usage général |
| mistral | ~4 GB | 8 GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Français |
| llama3.1 | ~4.7 GB | 16 GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | Qualité max |
| codellama | ~3.8 GB | 8 GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Code |
| gemma2 | ~1.6 GB | 4 GB | ⚡⚡⚡⚡ | ⭐⭐⭐ | Petit/rapide |

---

## 🔧 Commandes utiles Ollama

```bash
# Lister les modèles installés
ollama list

# Supprimer un modèle
ollama rm llama3.2

# Mettre à jour un modèle
ollama pull llama3.2

# Voir les détails d'un modèle
ollama show llama3.2

# Arrêter Ollama (si besoin)
# Sur macOS/Linux
pkill ollama

# Sur Windows : Gestionnaire des tâches → Arrêter le processus Ollama
```

---

## 💡 Astuces pour de meilleures performances

### 1. Utiliser un GPU
Si vous avez une carte graphique NVIDIA, Ollama l'utilisera automatiquement pour accélérer les inférences.

### 2. Augmenter le contexte
Pour analyser de longues transcriptions :
```bash
# Créer un Modelfile personnalisé
echo 'FROM llama3.2
PARAMETER num_ctx 8192' > Modelfile

ollama create llama3.2-large -f Modelfile
```

### 3. Ajuster la température
Dans les paramètres du plugin, réglez la température :
- **0.3-0.5** : Réponses plus précises et factuelles
- **0.7-0.9** : Réponses plus créatives

---

## ❓ Dépannage

### Ollama ne démarre pas
```bash
# Vérifier que le port 11434 n'est pas déjà utilisé
lsof -i :11434  # macOS/Linux
netstat -ano | findstr :11434  # Windows
```

### Erreur "model not found"
```bash
# Télécharger à nouveau le modèle
ollama pull llama3.2
```

### Performances lentes
- Vérifiez que vous avez assez de RAM
- Utilisez un modèle plus petit (gemma2, llama3.2)
- Fermez les autres applications gourmandes

### Erreur de connexion dans le plugin
- Vérifiez que l'endpoint est correct : `http://localhost:11434`
- Vérifiez qu'Ollama est bien démarré
- Testez avec : `curl http://localhost:11434/api/tags`

---

## 🌐 Ressources supplémentaires

- **Site officiel** : [ollama.com](https://ollama.com)
- **Bibliothèque de modèles** : [ollama.com/library](https://ollama.com/library)
- **GitHub** : [github.com/ollama/ollama](https://github.com/ollama/ollama)
- **Discord** : [discord.gg/ollama](https://discord.gg/ollama)

---

## 🎉 C'est tout !

Vous pouvez maintenant utiliser des modèles de langage puissants **gratuitement** et **en privé** directement depuis Obsidian !

Pour toute question, consultez la documentation du plugin ou ouvrez une issue sur GitHub.

**Bon apprentissage avec vos vidéos ! 📚🎬**
