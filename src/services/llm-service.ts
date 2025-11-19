import { LLMResponse, PluginSettings } from '../types';
import { Notice } from 'obsidian';

export class LLMService {
    constructor(private settings: PluginSettings) {}

    async generateCompletion(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        try {
            switch (this.settings.llmProvider) {
                case 'openai':
                    return await this.openAICompletion(prompt, systemPrompt);
                case 'google':
                    return await this.googleAICompletion(prompt, systemPrompt);
                case 'anthropic':
                    return await this.anthropicCompletion(prompt, systemPrompt);
                default:
                    throw new Error(`Provider LLM non supporté: ${this.settings.llmProvider}`);
            }
        } catch (error) {
            console.error('Erreur LLM:', error);
            new Notice('❌ Erreur lors de la génération de contenu avec le LLM');
            throw error;
        }
    }

    private async openAICompletion(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.openaiApiKey}`
            },
            body: JSON.stringify({
                model: this.settings.llmModel || 'gpt-4-turbo-preview',
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ],
                temperature: this.settings.temperature
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage.total_tokens,
            model: data.model
        };
    }

    private async googleAICompletion(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.llmModel || 'gemini-pro'}:generateContent?key=${this.settings.googleAiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: this.settings.temperature,
                        maxOutputTokens: 8192,
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google AI API error: ${error}`);
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;

        return {
            content,
            tokensUsed: data.usageMetadata?.totalTokenCount || 0,
            model: this.settings.llmModel || 'gemini-pro'
        };
    }

    private async anthropicCompletion(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.settings.anthropicApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.settings.llmModel || 'claude-3-opus-20240229',
                max_tokens: 4096,
                temperature: this.settings.temperature,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
            model: data.model
        };
    }

    async transcribeAudio(audioPath: string): Promise<string> {
        if (this.settings.transcriptionProvider === 'openai') {
            return await this.openAITranscription(audioPath);
        }
        throw new Error('Seul OpenAI est supporté pour la transcription audio pour le moment');
    }

    private async openAITranscription(audioPath: string): Promise<string> {
        // Note: Dans un plugin Obsidian réel, vous devriez lire le fichier audio
        // et l'envoyer à l'API Whisper d'OpenAI
        // Cette implémentation est simplifiée

        new Notice('⚠️ La transcription audio nécessite une implémentation backend complète');

        // Simulation pour démonstration
        return "Transcription placeholder - Nécessite l'intégration complète de Whisper API";
    }
}
