import { LLMResponse, PluginSettings } from '../types';
import { Notice } from 'obsidian';

/**
 * Service pour interagir avec Ollama (modèles open source locaux)
 * Ollama permet d'exécuter des modèles comme Llama, Mistral, etc. localement
 */
export class OllamaService {
    constructor(private settings: PluginSettings) {}

    /**
     * Génère une complétion avec Ollama
     */
    async generateCompletion(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        try {
            const model = this.settings.ollamaModel || 'llama3.2';
            const endpoint = this.settings.ollamaEndpoint || 'http://localhost:11434';

            // Vérifier si Ollama est accessible
            const isAvailable = await this.checkAvailability();
            if (!isAvailable) {
                throw new Error('Ollama n\'est pas accessible. Assurez-vous qu\'il est installé et en cours d\'exécution.');
            }

            const messages = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });

            const response = await fetch(`${endpoint}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: false,
                    options: {
                        temperature: this.settings.temperature,
                        num_predict: 4096,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama API error: ${error}`);
            }

            const data = await response.json();

            return {
                content: data.message.content,
                tokensUsed: data.eval_count || 0,
                model: model
            };
        } catch (error) {
            console.error('Erreur Ollama:', error);
            new Notice(`❌ Erreur Ollama: ${error.message}`);
            throw error;
        }
    }

    /**
     * Vérifie si Ollama est accessible
     */
    async checkAvailability(): Promise<boolean> {
        try {
            const endpoint = this.settings.ollamaEndpoint || 'http://localhost:11434';
            const response = await fetch(`${endpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000) // Timeout de 3 secondes
            });

            return response.ok;
        } catch (error) {
            console.warn('Ollama non disponible:', error);
            return false;
        }
    }

    /**
     * Liste les modèles disponibles dans Ollama
     */
    async listModels(): Promise<string[]> {
        try {
            const endpoint = this.settings.ollamaEndpoint || 'http://localhost:11434';
            const response = await fetch(`${endpoint}/api/tags`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer la liste des modèles');
            }

            const data = await response.json();
            return data.models.map((model: any) => model.name);
        } catch (error) {
            console.error('Erreur récupération modèles Ollama:', error);
            return [];
        }
    }

    /**
     * Télécharge un modèle si non disponible
     */
    async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
        try {
            const endpoint = this.settings.ollamaEndpoint || 'http://localhost:11434';

            new Notice(`📥 Téléchargement du modèle ${modelName}...`);

            const response = await fetch(`${endpoint}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: modelName,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du modèle');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Impossible de lire le flux de téléchargement');
            }

            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;

                if (value) {
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.total && data.completed && onProgress) {
                                const progress = (data.completed / data.total) * 100;
                                onProgress(progress);
                            }
                        } catch (e) {
                            // Ignorer les lignes JSON invalides
                        }
                    }
                }
            }

            new Notice(`✅ Modèle ${modelName} téléchargé avec succès`);
        } catch (error) {
            console.error('Erreur téléchargement modèle:', error);
            new Notice(`❌ Erreur lors du téléchargement du modèle: ${error.message}`);
            throw error;
        }
    }

    /**
     * Génère des embeddings avec Ollama (pour recherche sémantique future)
     */
    async generateEmbeddings(text: string): Promise<number[]> {
        try {
            const endpoint = this.settings.ollamaEndpoint || 'http://localhost:11434';
            const model = this.settings.ollamaModel || 'llama3.2';

            const response = await fetch(`${endpoint}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: text
                })
            });

            if (!response.ok) {
                throw new Error('Erreur génération embeddings');
            }

            const data = await response.json();
            return data.embedding;
        } catch (error) {
            console.error('Erreur embeddings Ollama:', error);
            throw error;
        }
    }
}
