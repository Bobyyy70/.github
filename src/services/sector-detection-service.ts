import { IndustrySector, INDUSTRY_SECTORS, VideoSource, SearchResult, PluginSettings } from '../types';
import { LLMService } from './llm-service';
import { Notice } from 'obsidian';

export interface SectorDetectionResult {
    sector: IndustrySector;
    confidence: number;
    reasoning?: string;
}

/**
 * Service pour détecter automatiquement le secteur d'activité d'une vidéo
 */
export class SectorDetectionService {
    private llmService: LLMService;

    constructor(private settings: PluginSettings) {
        this.llmService = new LLMService(settings);
    }

    /**
     * Détecte le secteur d'une vidéo basé sur ses métadonnées
     */
    async detectSector(video: VideoSource | SearchResult): Promise<SectorDetectionResult> {
        // Si la détection est désactivée, retourner le secteur par défaut
        if (!this.settings.enableSectorDetection) {
            return {
                sector: this.settings.defaultSector,
                confidence: 0,
                reasoning: 'Détection automatique désactivée'
            };
        }

        // D'abord essayer la détection par mots-clés (rapide)
        const keywordResult = this.detectByKeywords(video);
        if (keywordResult.confidence > 0.8) {
            return keywordResult;
        }

        // Si pas assez confiant, utiliser le LLM
        try {
            const llmResult = await this.detectByLLM(video);

            // Si le LLM est plus confiant, utiliser son résultat
            if (llmResult.confidence > keywordResult.confidence) {
                return llmResult;
            }

            return keywordResult;
        } catch (error) {
            console.error('Erreur détection LLM:', error);
            // En cas d'erreur, fallback sur la détection par mots-clés
            return keywordResult;
        }
    }

    /**
     * Détection rapide par mots-clés
     */
    private detectByKeywords(video: VideoSource | SearchResult): SectorDetectionResult {
        const text = `${video.title} ${video.description || ''}`.toLowerCase();

        let bestMatch: IndustrySector = this.settings.defaultSector;
        let bestScore = 0;

        // Parcourir tous les secteurs et compter les mots-clés correspondants
        for (const [sectorKey, sectorInfo] of Object.entries(INDUSTRY_SECTORS)) {
            const sector = sectorKey as IndustrySector;

            // Ignorer les secteurs non activés
            if (!this.settings.enabledSectors.includes(sector)) {
                continue;
            }

            let score = 0;
            for (const keyword of sectorInfo.keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    score++;
                }
            }

            // Normaliser le score
            const normalizedScore = sectorInfo.keywords.length > 0
                ? score / sectorInfo.keywords.length
                : 0;

            if (normalizedScore > bestScore) {
                bestScore = normalizedScore;
                bestMatch = sector;
            }
        }

        return {
            sector: bestMatch,
            confidence: Math.min(bestScore, 1),
            reasoning: 'Détection par mots-clés'
        };
    }

    /**
     * Détection avancée par LLM
     */
    private async detectByLLM(video: VideoSource | SearchResult): Promise<SectorDetectionResult> {
        const sectorsInfo = this.settings.enabledSectors
            .map(sector => `- ${sector}: ${INDUSTRY_SECTORS[sector].label}`)
            .join('\n');

        const systemPrompt = `Tu es un expert en catégorisation de contenu vidéo.
Ton rôle est d'analyser les métadonnées d'une vidéo et de déterminer son secteur d'activité.

Secteurs disponibles:
${sectorsInfo}

Réponds UNIQUEMENT au format JSON suivant:
{
  "sector": "sector-id",
  "confidence": 0.95,
  "reasoning": "Explication courte"
}

Le confidence doit être entre 0 et 1.`;

        const prompt = `Analyse cette vidéo et détermine son secteur:

Titre: ${video.title}
Description: ${video.description || 'Pas de description'}
Auteur: ${video.author || 'Inconnu'}

Retourne uniquement le JSON demandé.`;

        try {
            const response = await this.llmService.generateCompletion(prompt, systemPrompt);

            // Extraire le JSON de la réponse
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Format de réponse invalide');
            }

            const result = JSON.parse(jsonMatch[0]);

            // Valider le secteur retourné
            if (!this.settings.enabledSectors.includes(result.sector)) {
                result.sector = this.settings.defaultSector;
                result.confidence = 0.5;
            }

            return {
                sector: result.sector as IndustrySector,
                confidence: Math.max(0, Math.min(1, result.confidence)),
                reasoning: result.reasoning || 'Détecté par LLM'
            };
        } catch (error) {
            console.error('Erreur parsing LLM:', error);
            throw error;
        }
    }

    /**
     * Détecte les secteurs pour plusieurs vidéos en batch
     */
    async detectBatch(videos: (VideoSource | SearchResult)[]): Promise<Map<string, SectorDetectionResult>> {
        const results = new Map<string, SectorDetectionResult>();

        for (const video of videos) {
            const videoId = 'url' in video ? video.url : video.title;
            try {
                const result = await this.detectSector(video);
                results.set(videoId, result);
            } catch (error) {
                console.error(`Erreur détection secteur pour ${videoId}:`, error);
                results.set(videoId, {
                    sector: this.settings.defaultSector,
                    confidence: 0,
                    reasoning: 'Erreur de détection'
                });
            }
        }

        return results;
    }

    /**
     * Obtient le chemin de sortie basé sur le secteur
     */
    getSectorPath(sector: IndustrySector, baseFolder: string): string {
        if (!this.settings.organizeBySector) {
            return baseFolder;
        }

        const sectorInfo = INDUSTRY_SECTORS[sector];
        const sectorFolderName = `${sectorInfo.icon} ${sectorInfo.label}`;

        return `${baseFolder}/${sectorFolderName}`;
    }

    /**
     * Retourne une liste de suggestions de secteurs basée sur le contenu
     */
    async getSectorSuggestions(content: string, limit: number = 3): Promise<SectorDetectionResult[]> {
        const suggestions: SectorDetectionResult[] = [];

        // Analyser le contenu pour chaque secteur activé
        for (const sector of this.settings.enabledSectors) {
            const keywords = INDUSTRY_SECTORS[sector].keywords;
            let score = 0;

            for (const keyword of keywords) {
                if (content.toLowerCase().includes(keyword.toLowerCase())) {
                    score++;
                }
            }

            if (score > 0) {
                suggestions.push({
                    sector,
                    confidence: Math.min(score / keywords.length, 1),
                    reasoning: `${score} mots-clés trouvés`
                });
            }
        }

        // Trier par confiance décroissante
        suggestions.sort((a, b) => b.confidence - a.confidence);

        return suggestions.slice(0, limit);
    }

    /**
     * Formatte un secteur pour l'affichage
     */
    formatSector(sector: IndustrySector, includeIcon: boolean = true): string {
        const sectorInfo = INDUSTRY_SECTORS[sector];
        return includeIcon
            ? `${sectorInfo.icon} ${sectorInfo.label}`
            : sectorInfo.label;
    }
}
