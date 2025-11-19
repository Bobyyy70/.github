import { AtomicNote, VideoSummary, Transcription, UseCase, PluginSettings } from '../types';
import { LLMService } from './llm-service';
import { Notice } from 'obsidian';

export class NotesGeneratorService {
    private llmService: LLMService;

    constructor(settings: PluginSettings) {
        this.llmService = new LLMService(settings);
    }

    async generateAtomicNotes(
        transcription: Transcription,
        videoTitle: string,
        maxNotes: number
    ): Promise<AtomicNote[]> {
        try {
            new Notice('🧠 Génération des notes atomiques...');

            const systemPrompt = `Tu es un expert en création de notes atomiques pour la méthode Zettelkasten.
Ton rôle est d'extraire des idées indépendantes et autonomes depuis une transcription de vidéo.

Chaque note atomique doit:
- Contenir une seule idée claire et complète
- Être compréhensible sans contexte additionnel
- Avoir un titre descriptif
- Inclure des tags pertinents
- Lister les concepts reliés

Réponds au format JSON strict suivant:
{
  "atomicNotes": [
    {
      "title": "Titre de l'idée",
      "content": "Contenu détaillé de l'idée (markdown supporté)",
      "tags": ["tag1", "tag2"],
      "relatedConcepts": ["concept1", "concept2"],
      "timestamp": 123
    }
  ]
}`;

            const prompt = `Transcription de la vidéo "${videoTitle}":

${transcription.text}

---

Extrais maximum ${maxNotes} notes atomiques les plus importantes et pertinentes de cette transcription.
Pour chaque segment important, inclus le timestamp (en secondes) approximatif.`;

            const response = await this.llmService.generateCompletion(prompt, systemPrompt);

            // Parse la réponse JSON
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Format de réponse invalide du LLM');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const atomicNotes: AtomicNote[] = parsed.atomicNotes.map((note: any) => ({
                ...note,
                sourceVideo: videoTitle,
                createdAt: new Date()
            }));

            new Notice(`✅ ${atomicNotes.length} notes atomiques générées`);
            return atomicNotes;
        } catch (error) {
            console.error('Erreur génération notes atomiques:', error);
            new Notice('❌ Erreur lors de la génération des notes atomiques');
            throw error;
        }
    }

    async generateSummary(
        transcription: Transcription,
        videoTitle: string
    ): Promise<VideoSummary> {
        try {
            new Notice('📝 Génération du résumé...');

            const systemPrompt = `Tu es un expert en synthèse de contenu éducatif et technique.
Ton rôle est de créer des résumés structurés de vidéos pour faciliter l'apprentissage.

Réponds au format JSON strict suivant:
{
  "title": "Titre du résumé",
  "overview": "Vue d'ensemble en 2-3 phrases",
  "keyPoints": ["point clé 1", "point clé 2", ...],
  "mainTopics": ["sujet 1", "sujet 2", ...],
  "technicalConcepts": ["concept technique 1", "concept technique 2", ...],
  "relatedResources": ["ressource 1", "ressource 2", ...]
}`;

            const prompt = `Transcription de la vidéo "${videoTitle}":

${transcription.text}

---

Crée un résumé complet et structuré de cette vidéo.`;

            const response = await this.llmService.generateCompletion(prompt, systemPrompt);

            // Parse la réponse JSON
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Format de réponse invalide du LLM');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Générer les cas d'utilisation
            const useCases = await this.generateUseCases(transcription, videoTitle);

            const summary: VideoSummary = {
                ...parsed,
                useCases
            };

            new Notice('✅ Résumé généré');
            return summary;
        } catch (error) {
            console.error('Erreur génération résumé:', error);
            new Notice('❌ Erreur lors de la génération du résumé');
            throw error;
        }
    }

    async generateUseCases(
        transcription: Transcription,
        videoTitle: string
    ): Promise<UseCase[]> {
        try {
            const systemPrompt = `Tu es un expert en pédagogie et applications pratiques.
Ton rôle est de proposer des cas d'utilisation concrets et guidés basés sur le contenu d'une vidéo.

Réponds au format JSON strict suivant:
{
  "useCases": [
    {
      "title": "Titre du cas d'utilisation",
      "description": "Description détaillée",
      "difficulty": "beginner|intermediate|advanced",
      "steps": ["étape 1", "étape 2", ...],
      "requiredKnowledge": ["prérequis 1", "prérequis 2", ...]
    }
  ]
}`;

            const prompt = `Transcription de la vidéo "${videoTitle}":

${transcription.text.substring(0, 3000)}...

---

Propose 3-5 cas d'utilisation pratiques et guidés basés sur cette vidéo.
Chaque cas d'utilisation doit être concret et actionnable.`;

            const response = await this.llmService.generateCompletion(prompt, systemPrompt);

            // Parse la réponse JSON
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Format de réponse invalide du LLM');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.useCases;
        } catch (error) {
            console.error('Erreur génération cas d\'utilisation:', error);
            return [];
        }
    }

    formatAtomicNoteAsMarkdown(note: AtomicNote): string {
        const timestamp = note.timestamp ? this.formatTimestamp(note.timestamp) : '';
        const timestampLine = timestamp ? `\n> ⏱️ Timestamp: ${timestamp}\n` : '';

        return `---
title: ${note.title}
tags: ${note.tags.map(t => `#${t}`).join(', ')}
source: "[[${note.sourceVideo}]]"
created: ${note.createdAt.toISOString()}
type: atomic-note
---

# ${note.title}
${timestampLine}
${note.content}

## Concepts reliés

${note.relatedConcepts.map(c => `- [[${c}]]`).join('\n')}

---
*Note atomique générée automatiquement depuis la vidéo "${note.sourceVideo}"*
`;
    }

    formatSummaryAsMarkdown(summary: VideoSummary, videoUrl: string): string {
        return `---
title: ${summary.title}
type: video-summary
url: ${videoUrl}
created: ${new Date().toISOString()}
---

# ${summary.title}

## 📋 Vue d'ensemble

${summary.overview}

## 🔑 Points clés

${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 🎯 Sujets principaux

${summary.mainTopics.map(t => `- ${t}`).join('\n')}

## 🔧 Concepts techniques

${summary.technicalConcepts.map(c => `- \`${c}\``).join('\n')}

## 💡 Cas d'utilisation

${summary.useCases.map((uc, i) => `
### ${i + 1}. ${uc.title} (${uc.difficulty})

${uc.description}

**Étapes:**
${uc.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}

**Prérequis:**
${uc.requiredKnowledge.map(k => `- ${k}`).join('\n')}
`).join('\n')}

## 🔗 Ressources liées

${summary.relatedResources.map(r => `- ${r}`).join('\n')}

---
*Résumé généré automatiquement*
`;
    }

    private formatTimestamp(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}
