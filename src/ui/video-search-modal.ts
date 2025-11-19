import { App, Modal, Setting, Notice } from 'obsidian';
import { SearchResult, PluginSettings, IndustrySector, INDUSTRY_SECTORS } from '../types';
import { VideoSearchService } from '../services/video-search-service';
import { VideoProcessorService } from '../services/video-processor-service';
import { SectorDetectionService } from '../services/sector-detection-service';

export class VideoSearchModal extends Modal {
    private searchService: VideoSearchService;
    private processorService: VideoProcessorService;
    private sectorService: SectorDetectionService;
    private searchResults: SearchResult[] = [];
    private filteredResults: SearchResult[] = [];
    private resultsContainer: HTMLElement;
    private selectedSector: IndustrySector | 'all' = 'all';

    constructor(
        app: App,
        private settings: PluginSettings
    ) {
        super(app);
        this.searchService = new VideoSearchService(settings);
        this.processorService = new VideoProcessorService(app, settings);
        this.sectorService = new SectorDetectionService(settings);
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

        // Filtre par secteur d'activité
        if (this.settings.enableSectorDetection) {
            const sectorDropdown = new Setting(searchContainer)
                .setName('Secteur d\'activité')
                .setDesc('Filtrer par domaine (détection automatique)')
                .addDropdown(dropdown => {
                    dropdown.addOption('all', '📂 Tous les secteurs');

                    for (const sector of this.settings.enabledSectors) {
                        const sectorInfo = INDUSTRY_SECTORS[sector];
                        dropdown.addOption(sector, `${sectorInfo.icon} ${sectorInfo.label}`);
                    }

                    dropdown.setValue('all');
                    dropdown.onChange(value => {
                        this.selectedSector = value as IndustrySector | 'all';
                        this.filterResults();
                    });

                    return dropdown;
                });
        }

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

            // Détecter les secteurs pour chaque résultat
            if (this.settings.enableSectorDetection && this.searchResults.length > 0) {
                new Notice('🔍 Détection des secteurs...');
                for (const result of this.searchResults) {
                    const detection = await this.sectorService.detectSector(result);
                    result.sector = detection.sector;
                    result.sectorConfidence = detection.confidence;
                }
            }

            this.resultsContainer.empty();

            if (this.searchResults.length === 0) {
                this.resultsContainer.createEl('p', {
                    text: 'Aucun résultat trouvé',
                    cls: 'no-results'
                });
                return;
            }

            new Notice(`✅ ${this.searchResults.length} résultats trouvés`);

            // Appliquer le filtre de secteur
            this.filterResults();
        } catch (error) {
            console.error('Erreur de recherche:', error);
            this.resultsContainer.empty();
            this.resultsContainer.createEl('p', {
                text: '❌ Erreur lors de la recherche',
                cls: 'error-message'
            });
        }
    }

    filterResults() {
        this.resultsContainer.empty();

        // Filtrer par secteur si un secteur spécifique est sélectionné
        this.filteredResults = this.selectedSector === 'all'
            ? this.searchResults
            : this.searchResults.filter(r => r.sector === this.selectedSector);

        if (this.filteredResults.length === 0) {
            this.resultsContainer.createEl('p', {
                text: `Aucun résultat pour le secteur sélectionné`,
                cls: 'no-results'
            });
            return;
        }

        this.filteredResults.forEach((result, index) => {
            this.createResultCard(result, index);
        });
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

        // Badge de secteur
        if (result.sector && this.settings.enableSectorDetection) {
            const sectorBadge = metadata.createEl('span', {
                cls: 'sector-badge'
            });
            const sectorInfo = INDUSTRY_SECTORS[result.sector];
            sectorBadge.textContent = ` • ${sectorInfo.icon} ${sectorInfo.label}`;

            // Ajouter l'indicateur de confiance si disponible
            if (result.sectorConfidence) {
                const confidence = Math.round(result.sectorConfidence * 100);
                sectorBadge.title = `Confiance: ${confidence}%`;
                if (result.sectorConfidence < 0.5) {
                    sectorBadge.addClass('low-confidence');
                }
            }
        }

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
