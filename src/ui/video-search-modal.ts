import { App, Modal, Setting, Notice } from 'obsidian';
import { SearchResult, PluginSettings } from '../types';
import { VideoSearchService } from '../services/video-search-service';
import { VideoProcessorService } from '../services/video-processor-service';

export class VideoSearchModal extends Modal {
    private searchService: VideoSearchService;
    private processorService: VideoProcessorService;
    private searchResults: SearchResult[] = [];
    private resultsContainer: HTMLElement;

    constructor(
        app: App,
        private settings: PluginSettings
    ) {
        super(app);
        this.searchService = new VideoSearchService(settings);
        this.processorService = new VideoProcessorService(app, settings);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '🎬 Recherche de vidéos' });

        // Zone de recherche
        const searchContainer = contentEl.createDiv({ cls: 'video-search-container' });

        let searchQuery = '';
        let platform: 'youtube' | 'gitlab' | 'all' = 'all';

        new Setting(searchContainer)
            .setName('Recherche')
            .setDesc('Entrez vos mots-clés de recherche')
            .addText(text => text
                .setPlaceholder('Ex: Claude AI tutorial, React hooks, etc.')
                .onChange(value => {
                    searchQuery = value;
                })
            );

        new Setting(searchContainer)
            .setName('Plateforme')
            .setDesc('Choisissez la plateforme de recherche')
            .addDropdown(dropdown => dropdown
                .addOption('all', '🌐 Toutes les plateformes')
                .addOption('youtube', '📺 YouTube')
                .addOption('gitlab', '🦊 GitLab')
                .setValue('all')
                .onChange(value => {
                    platform = value as 'youtube' | 'gitlab' | 'all';
                })
            );

        new Setting(searchContainer)
            .addButton(button => button
                .setButtonText('🔍 Rechercher')
                .setCta()
                .onClick(async () => {
                    if (!searchQuery.trim()) {
                        new Notice('⚠️ Veuillez entrer une recherche');
                        return;
                    }
                    await this.performSearch(searchQuery, platform);
                })
            );

        // Ou entrer une URL directement
        contentEl.createEl('h3', { text: '🔗 Ou entrez une URL directement' });

        let directUrl = '';
        new Setting(contentEl)
            .setName('URL de la vidéo')
            .setDesc('Collez l\'URL d\'une vidéo YouTube, GitLab, etc.')
            .addText(text => text
                .setPlaceholder('https://www.youtube.com/watch?v=...')
                .onChange(value => {
                    directUrl = value;
                })
            );

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('▶️ Traiter cette vidéo')
                .setCta()
                .onClick(async () => {
                    if (!directUrl.trim()) {
                        new Notice('⚠️ Veuillez entrer une URL');
                        return;
                    }
                    await this.processDirectUrl(directUrl);
                })
            );

        // Conteneur pour les résultats
        contentEl.createEl('h3', { text: '📋 Résultats de recherche' });
        this.resultsContainer = contentEl.createDiv({ cls: 'search-results-container' });
    }

    async performSearch(query: string, platform: 'youtube' | 'gitlab' | 'all') {
        try {
            new Notice('🔍 Recherche en cours...');
            this.resultsContainer.empty();
            this.resultsContainer.createEl('p', { text: 'Recherche en cours...' });

            this.searchResults = await this.searchService.search(query, platform, 10);

            this.resultsContainer.empty();

            if (this.searchResults.length === 0) {
                this.resultsContainer.createEl('p', {
                    text: 'Aucun résultat trouvé',
                    cls: 'no-results'
                });
                return;
            }

            new Notice(`✅ ${this.searchResults.length} résultats trouvés`);

            this.searchResults.forEach((result, index) => {
                this.createResultCard(result, index);
            });
        } catch (error) {
            console.error('Erreur de recherche:', error);
            this.resultsContainer.empty();
            this.resultsContainer.createEl('p', {
                text: '❌ Erreur lors de la recherche',
                cls: 'error-message'
            });
        }
    }

    createResultCard(result: SearchResult, index: number) {
        const card = this.resultsContainer.createDiv({ cls: 'video-result-card' });

        // Thumbnail
        if (result.thumbnail) {
            const img = card.createEl('img', {
                cls: 'video-thumbnail'
            });
            img.src = result.thumbnail;
        }

        const infoContainer = card.createDiv({ cls: 'video-info' });

        // Titre
        infoContainer.createEl('h4', {
            text: result.title,
            cls: 'video-title'
        });

        // Métadonnées
        const metadata = infoContainer.createDiv({ cls: 'video-metadata' });
        metadata.createEl('span', {
            text: `${result.platform.toUpperCase()} • `,
            cls: 'platform-badge'
        });
        metadata.createEl('span', {
            text: `${result.author} • `,
            cls: 'author'
        });
        metadata.createEl('span', {
            text: this.formatDuration(result.duration),
            cls: 'duration'
        });

        // Description
        if (result.description) {
            infoContainer.createEl('p', {
                text: result.description.substring(0, 150) + '...',
                cls: 'video-description'
            });
        }

        // Bouton d'action
        const actionButton = card.createEl('button', {
            text: '▶️ Traiter cette vidéo',
            cls: 'process-button'
        });

        actionButton.addEventListener('click', async () => {
            await this.processSearchResult(result);
        });
    }

    async processSearchResult(result: SearchResult) {
        try {
            this.close();
            new Notice(`🎬 Traitement de: ${result.title}`);

            const videoSource = await this.searchService.getVideoInfo(result.url);
            await this.processorService.processVideo(videoSource);
        } catch (error) {
            console.error('Erreur traitement vidéo:', error);
            new Notice('❌ Erreur lors du traitement de la vidéo');
        }
    }

    async processDirectUrl(url: string) {
        try {
            this.close();
            new Notice('🎬 Récupération des informations de la vidéo...');

            const videoSource = await this.searchService.getVideoInfo(url);
            await this.processorService.processVideo(videoSource);
        } catch (error) {
            console.error('Erreur traitement URL:', error);
            new Notice('❌ Erreur lors du traitement de l\'URL');
        }
    }

    formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
