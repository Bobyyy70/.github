import { SearchResult, VideoSource, PluginSettings } from '../types';
import { Notice } from 'obsidian';

export class VideoSearchService {
    constructor(private settings: PluginSettings) {}

    async search(query: string, platform: 'youtube' | 'gitlab' | 'all' = 'all', maxResults: number = 10): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        try {
            if (platform === 'youtube' || platform === 'all') {
                const youtubeResults = await this.searchYouTube(query, maxResults);
                results.push(...youtubeResults);
            }

            if (platform === 'gitlab' || platform === 'all') {
                const gitlabResults = await this.searchGitLab(query, maxResults);
                results.push(...gitlabResults);
            }

            return results;
        } catch (error) {
            console.error('Erreur de recherche:', error);
            new Notice('❌ Erreur lors de la recherche de vidéos');
            throw error;
        }
    }

    private async searchYouTube(query: string, maxResults: number): Promise<SearchResult[]> {
        if (!this.settings.youtubeApiKey) {
            new Notice('⚠️ Clé API YouTube manquante dans les paramètres');
            return [];
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `part=snippet&q=${encodeURIComponent(query)}&` +
                `type=video&maxResults=${maxResults}&` +
                `key=${this.settings.youtubeApiKey}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Récupérer les détails des vidéos (durée, statistiques)
            const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=contentDetails,statistics&id=${videoIds}&` +
                `key=${this.settings.youtubeApiKey}`
            );

            const detailsData = await detailsResponse.json();

            return data.items.map((item: any, index: number) => {
                const details = detailsData.items[index];
                return {
                    id: item.id.videoId,
                    platform: 'youtube' as const,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.high.url,
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    duration: this.parseYouTubeDuration(details.contentDetails.duration),
                    author: item.snippet.channelTitle,
                    publishedAt: new Date(item.snippet.publishedAt),
                    viewCount: parseInt(details.statistics.viewCount)
                };
            });
        } catch (error) {
            console.error('Erreur YouTube:', error);
            new Notice('❌ Erreur lors de la recherche YouTube');
            return [];
        }
    }

    private parseYouTubeDuration(duration: string): number {
        // Convertit le format ISO 8601 (PT1H2M3S) en secondes
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');

        return hours * 3600 + minutes * 60 + seconds;
    }

    private async searchGitLab(query: string, maxResults: number): Promise<SearchResult[]> {
        if (!this.settings.gitlabToken) {
            new Notice('⚠️ Token GitLab manquant dans les paramètres');
            return [];
        }

        try {
            // GitLab ne stocke pas directement les vidéos, mais on peut chercher
            // dans les repositories qui contiennent des vidéos ou des liens vers des vidéos
            // Cette implémentation est un exemple - à adapter selon vos besoins

            const response = await fetch(
                `https://gitlab.com/api/v4/search?scope=blobs&search=${encodeURIComponent(query + ' video')}`,
                {
                    headers: {
                        'PRIVATE-TOKEN': this.settings.gitlabToken
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`GitLab API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Filtrer et transformer les résultats en format SearchResult
            // Cette partie dépend fortement de votre cas d'usage GitLab
            return [];
        } catch (error) {
            console.error('Erreur GitLab:', error);
            new Notice('⚠️ Erreur lors de la recherche GitLab');
            return [];
        }
    }

    async getVideoInfo(url: string): Promise<VideoSource> {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return await this.getYouTubeInfo(url);
        } else if (url.includes('gitlab.com')) {
            return await this.getGitLabInfo(url);
        } else {
            throw new Error('Plateforme non supportée');
        }
    }

    private async getYouTubeInfo(url: string): Promise<VideoSource> {
        const videoId = this.extractYouTubeId(url);
        if (!videoId) {
            throw new Error('URL YouTube invalide');
        }

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?` +
            `part=snippet,contentDetails&id=${videoId}&` +
            `key=${this.settings.youtubeApiKey}`
        );

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.statusText}`);
        }

        const data = await response.json();
        const video = data.items[0];

        return {
            platform: 'youtube',
            url,
            title: video.snippet.title,
            description: video.snippet.description,
            duration: this.parseYouTubeDuration(video.contentDetails.duration),
            thumbnail: video.snippet.thumbnails.high.url,
            author: video.snippet.channelTitle,
            publishedAt: new Date(video.snippet.publishedAt)
        };
    }

    private extractYouTubeId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    private async getGitLabInfo(url: string): Promise<VideoSource> {
        // Implémentation pour GitLab - à adapter selon vos besoins
        return {
            platform: 'gitlab',
            url,
            title: 'GitLab Video',
            description: 'Video from GitLab repository'
        };
    }
}
