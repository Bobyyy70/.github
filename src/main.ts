import { Plugin, Notice, addIcon } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from './types';
import { VideoSearchModal } from './ui/video-search-modal';
import { VideoTranscriptionSettingTab } from './settings-tab';

// Icône personnalisée pour le plugin
const VIDEO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="23 7 16 12 23 17 23 7"></polygon>
  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
</svg>`;

export default class VideoTranscriptionPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        console.log('Chargement du plugin Video Transcription & Knowledge Extractor');

        // Charger les paramètres
        await this.loadSettings();

        // Ajouter l'icône personnalisée
        addIcon('video-transcription', VIDEO_ICON);

        // Ajouter le ruban (ribbon) avec l'icône
        this.addRibbonIcon('video-transcription', 'Rechercher et transcrire une vidéo', (evt: MouseEvent) => {
            this.openSearchModal();
        });

        // Ajouter les commandes
        this.addCommand({
            id: 'open-video-search',
            name: 'Rechercher et transcrire une vidéo',
            callback: () => {
                this.openSearchModal();
            }
        });

        this.addCommand({
            id: 'process-video-from-clipboard',
            name: 'Traiter la vidéo depuis le presse-papier',
            callback: async () => {
                await this.processFromClipboard();
            }
        });

        this.addCommand({
            id: 'quick-youtube-search',
            name: 'Recherche rapide YouTube',
            callback: () => {
                this.openSearchModal();
            }
        });

        // Ajouter l'onglet de paramètres
        this.addSettingTab(new VideoTranscriptionSettingTab(this.app, this));

        // Vérifier les API keys au démarrage
        this.checkApiKeys();

        new Notice('✅ Video Transcription & Knowledge Extractor chargé avec succès !');
    }

    onunload() {
        console.log('Déchargement du plugin Video Transcription & Knowledge Extractor');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    openSearchModal() {
        // Vérifier qu'au moins une clé API est configurée
        if (!this.hasAnyApiKey()) {
            new Notice('⚠️ Veuillez configurer au moins une clé API dans les paramètres');
            return;
        }

        new VideoSearchModal(this.app, this.settings).open();
    }

    async processFromClipboard() {
        try {
            // Lire le presse-papier
            const clipboardText = await navigator.clipboard.readText();

            if (!clipboardText || !this.isValidUrl(clipboardText)) {
                new Notice('⚠️ Le presse-papier ne contient pas une URL valide');
                return;
            }

            // Vérifier que c'est une URL de vidéo supportée
            if (!this.isSupportedVideoUrl(clipboardText)) {
                new Notice('⚠️ URL non supportée. Utilisez YouTube, GitLab ou Vimeo.');
                return;
            }

            new Notice(`🎬 Traitement de la vidéo depuis le presse-papier...`);

            // Importer dynamiquement les services nécessaires
            const { VideoSearchService } = await import('./services/video-search-service');
            const { VideoProcessorService } = await import('./services/video-processor-service');

            const searchService = new VideoSearchService(this.settings);
            const processorService = new VideoProcessorService(this.app, this.settings);

            const videoSource = await searchService.getVideoInfo(clipboardText);
            await processorService.processVideo(videoSource);
        } catch (error) {
            console.error('Erreur traitement presse-papier:', error);
            new Notice('❌ Erreur lors du traitement de la vidéo depuis le presse-papier');
        }
    }

    checkApiKeys() {
        const warnings: string[] = [];

        if (!this.settings.youtubeApiKey) {
            warnings.push('YouTube API Key manquante');
        }

        if (!this.settings.openaiApiKey && !this.settings.anthropicApiKey && !this.settings.googleAiApiKey) {
            warnings.push('Aucune clé LLM configurée (OpenAI, Anthropic ou Google AI)');
        }

        if (warnings.length > 0) {
            console.warn('Video Transcription - Avertissements de configuration:');
            warnings.forEach(w => console.warn(`- ${w}`));

            // Ne pas afficher de notification pour ne pas être trop intrusif
            // L'utilisateur verra les avertissements dans les paramètres
        }
    }

    hasAnyApiKey(): boolean {
        return !!(
            this.settings.youtubeApiKey ||
            this.settings.gitlabToken ||
            this.settings.openaiApiKey ||
            this.settings.anthropicApiKey ||
            this.settings.googleAiApiKey
        );
    }

    isValidUrl(text: string): boolean {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    }

    isSupportedVideoUrl(url: string): boolean {
        const supportedDomains = [
            'youtube.com',
            'youtu.be',
            'gitlab.com',
            'vimeo.com'
        ];

        return supportedDomains.some(domain => url.includes(domain));
    }
}
