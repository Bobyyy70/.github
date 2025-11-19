import {
    VideoSource,
    Transcription,
    ProcessingResults,
    PluginSettings,
    TranscriptionSegment,
    INDUSTRY_SECTORS
} from '../types';
import { LLMService } from './llm-service';
import { NotesGeneratorService } from './notes-generator-service';
import { SectorDetectionService } from './sector-detection-service';
import { App, Notice, TFile } from 'obsidian';

export class VideoProcessorService {
    private llmService: LLMService;
    private notesGenerator: NotesGeneratorService;
    private sectorDetection: SectorDetectionService;

    constructor(
        private app: App,
        private settings: PluginSettings
    ) {
        this.llmService = new LLMService(settings);
        this.notesGenerator = new NotesGeneratorService(settings);
        this.sectorDetection = new SectorDetectionService(settings);
    }

    async processVideo(videoSource: VideoSource): Promise<ProcessingResults> {
        try {
            new Notice(`🎬 Traitement de la vidéo: ${videoSource.title}`);

            // Étape 0: Détecter le secteur d'activité
            if (this.settings.enableSectorDetection && !videoSource.sector) {
                const detection = await this.sectorDetection.detectSector(videoSource);
                videoSource.sector = detection.sector;
                videoSource.sectorConfidence = detection.confidence;

                const sectorInfo = INDUSTRY_SECTORS[detection.sector];
                new Notice(`📂 Secteur détecté: ${sectorInfo.icon} ${sectorInfo.label}`);
            }

            // Étape 1: Récupérer/Générer la transcription
            const transcription = await this.getTranscription(videoSource);

            // Étape 2: Générer les notes atomiques
            let atomicNotes = [];
            let atomicNotesPaths = [];

            if (this.settings.generateAtomicNotes) {
                atomicNotes = await this.notesGenerator.generateAtomicNotes(
                    transcription,
                    videoSource.title,
                    this.settings.maxAtomicNotesPerVideo
                );

                // Sauvegarder les notes atomiques
                atomicNotesPaths = await this.saveAtomicNotes(atomicNotes, videoSource);
            }

            // Étape 3: Générer le résumé
            let summary = null;
            let summaryPath = '';

            if (this.settings.generateSummary) {
                summary = await this.notesGenerator.generateSummary(
                    transcription,
                    videoSource.title
                );

                // Ajouter le secteur au résumé
                if (videoSource.sector) {
                    summary.sector = videoSource.sector;
                    summary.sectorConfidence = videoSource.sectorConfidence;
                }

                summaryPath = await this.saveSummary(summary, videoSource);
            }

            // Étape 4: Créer la note principale avec la transcription complète
            const mainNotePath = await this.saveMainNote(
                videoSource,
                transcription,
                atomicNotesPaths,
                summaryPath
            );

            new Notice('✅ Traitement terminé avec succès !');

            return {
                transcription,
                atomicNotes,
                summary,
                mainNotePath,
                atomicNotesPaths,
                summaryPath
            };
        } catch (error) {
            console.error('Erreur lors du traitement de la vidéo:', error);
            new Notice('❌ Erreur lors du traitement de la vidéo');
            throw error;
        }
    }

    private async getTranscription(videoSource: VideoSource): Promise<Transcription> {
        new Notice('🎤 Génération de la transcription...');

        // Pour YouTube, on peut utiliser l'API YouTube pour obtenir les sous-titres
        // ou utiliser Whisper pour transcrire l'audio

        if (videoSource.platform === 'youtube') {
            // Essayer d'abord les sous-titres automatiques YouTube
            const youtubeTranscription = await this.getYouTubeSubtitles(videoSource.url);
            if (youtubeTranscription) {
                return youtubeTranscription;
            }
        }

        // Sinon, utiliser le LLM pour simuler une transcription
        // Dans une version complète, vous utiliseriez Whisper API
        return await this.simulateTranscription(videoSource);
    }

    private async getYouTubeSubtitles(url: string): Promise<Transcription | null> {
        try {
            // Cette fonction nécessiterait l'utilisation d'une bibliothèque comme
            // youtube-transcript ou l'API YouTube pour récupérer les sous-titres
            // Pour l'instant, retourner null pour utiliser la simulation
            return null;
        } catch (error) {
            console.error('Erreur récupération sous-titres YouTube:', error);
            return null;
        }
    }

    private async simulateTranscription(videoSource: VideoSource): Promise<Transcription> {
        // Dans une implémentation réelle, ici vous utiliseriez Whisper API
        // Pour la démo, nous générons une transcription simulée basée sur la description

        const systemPrompt = `Tu es un assistant qui génère des transcriptions simulées pour des démos.
Basé sur le titre et la description d'une vidéo, génère une transcription réaliste et détaillée.
La transcription doit être structurée en segments avec timestamps.`;

        const prompt = `Vidéo: ${videoSource.title}
Description: ${videoSource.description || 'Pas de description'}

Génère une transcription simulée détaillée de 1000-1500 mots qui pourrait correspondre à cette vidéo.
Inclus du contenu technique pertinent et structuré.`;

        const response = await this.llmService.generateCompletion(prompt, systemPrompt);

        // Créer des segments simulés (tous les 30 secondes par exemple)
        const words = response.content.split(' ');
        const segments: TranscriptionSegment[] = [];
        const wordsPerSegment = 50;

        for (let i = 0; i < words.length; i += wordsPerSegment) {
            const segmentWords = words.slice(i, i + wordsPerSegment);
            const segmentId = Math.floor(i / wordsPerSegment);
            const start = segmentId * 30;
            const end = start + 30;

            segments.push({
                id: segmentId,
                start,
                end,
                text: segmentWords.join(' '),
                confidence: 0.95
            });
        }

        return {
            text: response.content,
            segments,
            language: this.settings.transcriptionLanguage,
            duration: videoSource.duration || segments.length * 30
        };
    }

    private async saveAtomicNotes(atomicNotes: any[], videoSource: VideoSource): Promise<string[]> {
        const paths: string[] = [];

        // Déterminer le dossier basé sur le secteur
        const baseFolder = videoSource.sector
            ? this.sectorDetection.getSectorPath(videoSource.sector, this.settings.atomicNotesFolder)
            : this.settings.atomicNotesFolder;

        for (const note of atomicNotes) {
            const markdown = this.notesGenerator.formatAtomicNoteAsMarkdown(note);
            const fileName = this.sanitizeFileName(note.title);
            const filePath = `${baseFolder}/${fileName}.md`;

            await this.createNote(filePath, markdown);
            paths.push(filePath);
        }

        return paths;
    }

    private async saveSummary(summary: any, videoSource: VideoSource): Promise<string> {
        const markdown = this.notesGenerator.formatSummaryAsMarkdown(summary, videoSource.url);
        const fileName = this.sanitizeFileName(`${videoSource.title} - Résumé`);

        // Déterminer le dossier basé sur le secteur
        const baseFolder = videoSource.sector
            ? this.sectorDetection.getSectorPath(videoSource.sector, this.settings.summariesFolder)
            : this.settings.summariesFolder;

        const filePath = `${baseFolder}/${fileName}.md`;

        await this.createNote(filePath, markdown);
        return filePath;
    }

    private async saveMainNote(
        videoSource: VideoSource,
        transcription: Transcription,
        atomicNotesPaths: string[],
        summaryPath: string
    ): Promise<string> {
        const markdown = this.formatMainNote(
            videoSource,
            transcription,
            atomicNotesPaths,
            summaryPath
        );

        const fileName = this.sanitizeFileName(videoSource.title);

        // Déterminer le dossier basé sur le secteur
        const baseFolder = videoSource.sector
            ? this.sectorDetection.getSectorPath(videoSource.sector, this.settings.notesOutputFolder)
            : this.settings.notesOutputFolder;

        const filePath = `${baseFolder}/${fileName}.md`;

        await this.createNote(filePath, markdown);
        return filePath;
    }

    private formatMainNote(
        videoSource: VideoSource,
        transcription: Transcription,
        atomicNotesPaths: string[],
        summaryPath: string
    ): string {
        const atomicNotesSection = atomicNotesPaths.length > 0
            ? `\n## 💡 Notes atomiques générées\n\n${atomicNotesPaths.map(p => `- [[${p.replace('.md', '')}]]`).join('\n')}`
            : '';

        const summarySection = summaryPath
            ? `\n## 📋 Résumé\n\n[[${summaryPath.replace('.md', '')}]]`
            : '';

        return `---
title: ${videoSource.title}
type: video-transcription
platform: ${videoSource.platform}
url: ${videoSource.url}
author: ${videoSource.author || 'Inconnu'}
duration: ${transcription.duration}s
language: ${transcription.language}
created: ${new Date().toISOString()}
---

# ${videoSource.title}

## 📺 Informations

- **Plateforme:** ${videoSource.platform}
- **URL:** [Voir la vidéo](${videoSource.url})
- **Auteur:** ${videoSource.author || 'Inconnu'}
- **Durée:** ${this.formatDuration(transcription.duration)}
- **Date de publication:** ${videoSource.publishedAt?.toLocaleDateString() || 'Inconnue'}

## 📝 Description

${videoSource.description || 'Pas de description disponible'}
${summarySection}
${atomicNotesSection}

## 📄 Transcription complète

${transcription.text}

## ⏱️ Transcription segmentée

${transcription.segments.map(seg => `
### [${this.formatTimestamp(seg.start)} - ${this.formatTimestamp(seg.end)}]

${seg.text}
`).join('\n')}

---
*Transcription générée automatiquement le ${new Date().toLocaleDateString()}*
`;
    }

    private async createNote(filePath: string, content: string): Promise<void> {
        try {
            // Créer les dossiers parents si nécessaire
            const folders = filePath.split('/');
            folders.pop(); // Retirer le nom du fichier
            let currentPath = '';

            for (const folder of folders) {
                currentPath += (currentPath ? '/' : '') + folder;
                const folderExists = await this.app.vault.adapter.exists(currentPath);
                if (!folderExists) {
                    await this.app.vault.createFolder(currentPath);
                }
            }

            // Créer ou mettre à jour le fichier
            const fileExists = await this.app.vault.adapter.exists(filePath);
            if (fileExists) {
                const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
                await this.app.vault.modify(file, content);
            } else {
                await this.app.vault.create(filePath, content);
            }
        } catch (error) {
            console.error(`Erreur création note ${filePath}:`, error);
            throw error;
        }
    }

    private sanitizeFileName(name: string): string {
        return name
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    }

    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        return `${minutes}m ${secs}s`;
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
