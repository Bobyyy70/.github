import { App, PluginSettingTab, Setting } from 'obsidian';
import VideoTranscriptionPlugin from './main';

export class VideoTranscriptionSettingTab extends PluginSettingTab {
    plugin: VideoTranscriptionPlugin;

    constructor(app: App, plugin: VideoTranscriptionPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: 'Video Transcription & Knowledge Extractor' });

        // Section API Keys
        containerEl.createEl('h2', { text: '🔑 Clés API' });

        new Setting(containerEl)
            .setName('YouTube API Key')
            .setDesc('Clé API pour rechercher des vidéos sur YouTube')
            .addText(text => text
                .setPlaceholder('Entrez votre clé API YouTube')
                .setValue(this.plugin.settings.youtubeApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.youtubeApiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('GitLab Token')
            .setDesc('Token d\'accès personnel GitLab')
            .addText(text => text
                .setPlaceholder('Entrez votre token GitLab')
                .setValue(this.plugin.settings.gitlabToken)
                .onChange(async (value) => {
                    this.plugin.settings.gitlabToken = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Clé API OpenAI pour GPT-4 et Whisper')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openaiApiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Anthropic API Key')
            .setDesc('Clé API Anthropic pour Claude')
            .addText(text => text
                .setPlaceholder('sk-ant-...')
                .setValue(this.plugin.settings.anthropicApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.anthropicApiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Google AI API Key')
            .setDesc('Clé API Google pour Gemini')
            .addText(text => text
                .setPlaceholder('Entrez votre clé API Google AI')
                .setValue(this.plugin.settings.googleAiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.googleAiApiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('HuggingFace API Key')
            .setDesc('Clé API HuggingFace pour modèles open source')
            .addText(text => text
                .setPlaceholder('hf_...')
                .setValue(this.plugin.settings.huggingfaceApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.huggingfaceApiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        // Section Modèles Open Source
        containerEl.createEl('h2', { text: '🌟 Modèles Open Source (Local & Gratuit)' });
        containerEl.createEl('p', {
            text: '💡 Utilisez des modèles locaux avec Ollama (100% gratuit et privé) ou HuggingFace',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Utiliser des modèles locaux')
            .setDesc('Privilégier Ollama pour des modèles gratuits et privés')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useLocalModels)
                .onChange(async (value) => {
                    this.plugin.settings.useLocalModels = value;
                    if (value) {
                        this.plugin.settings.llmProvider = 'ollama';
                    }
                    await this.plugin.saveSettings();
                    this.display(); // Rafraîchir l'affichage
                })
            );

        new Setting(containerEl)
            .setName('Endpoint Ollama')
            .setDesc('URL de l\'API Ollama (par défaut: http://localhost:11434)')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.ollamaEndpoint)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaEndpoint = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Modèle Ollama')
            .setDesc('Nom du modèle Ollama à utiliser (ex: llama3.2, mistral, codellama)')
            .addText(text => text
                .setPlaceholder('llama3.2')
                .setValue(this.plugin.settings.ollamaModel)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaModel = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Modèle HuggingFace')
            .setDesc('Modèle HuggingFace à utiliser (ex: meta-llama/Meta-Llama-3-8B-Instruct)')
            .addText(text => text
                .setPlaceholder('meta-llama/Meta-Llama-3-8B-Instruct')
                .setValue(this.plugin.settings.huggingfaceModel)
                .onChange(async (value) => {
                    this.plugin.settings.huggingfaceModel = value;
                    await this.plugin.saveSettings();
                })
            );

        // Section LLM
        containerEl.createEl('h2', { text: '🤖 Configuration LLM' });

        new Setting(containerEl)
            .setName('Provider de transcription')
            .setDesc('Quel service utiliser pour la transcription')
            .addDropdown(dropdown => dropdown
                .addOption('openai', 'OpenAI (Whisper)')
                .addOption('google', 'Google AI')
                .addOption('anthropic', 'Anthropic')
                .setValue(this.plugin.settings.transcriptionProvider)
                .onChange(async (value: any) => {
                    this.plugin.settings.transcriptionProvider = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Provider LLM')
            .setDesc('Quel LLM utiliser pour générer les notes')
            .addDropdown(dropdown => dropdown
                .addOption('ollama', '🌟 Ollama (Local, Gratuit)')
                .addOption('huggingface', '🤗 HuggingFace (Open Source)')
                .addOption('openai', 'OpenAI (GPT-4)')
                .addOption('google', 'Google AI (Gemini)')
                .addOption('anthropic', 'Anthropic (Claude)')
                .setValue(this.plugin.settings.llmProvider)
                .onChange(async (value: any) => {
                    this.plugin.settings.llmProvider = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Modèle LLM')
            .setDesc('Modèle spécifique à utiliser (ex: gpt-4-turbo-preview, claude-3-opus-20240229, gemini-pro)')
            .addText(text => text
                .setPlaceholder('gpt-4-turbo-preview')
                .setValue(this.plugin.settings.llmModel)
                .onChange(async (value) => {
                    this.plugin.settings.llmModel = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Température')
            .setDesc('Créativité du modèle (0 = déterministe, 1 = créatif)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.temperature)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.temperature = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Langue de transcription')
            .setDesc('Langue par défaut pour les transcriptions')
            .addText(text => text
                .setPlaceholder('fr')
                .setValue(this.plugin.settings.transcriptionLanguage)
                .onChange(async (value) => {
                    this.plugin.settings.transcriptionLanguage = value;
                    await this.plugin.saveSettings();
                })
            );

        // Section Chemins
        containerEl.createEl('h2', { text: '📁 Chemins des dossiers' });

        new Setting(containerEl)
            .setName('Dossier de sortie des notes')
            .setDesc('Où sauvegarder les transcriptions complètes')
            .addText(text => text
                .setPlaceholder('Notes/Video Transcriptions')
                .setValue(this.plugin.settings.notesOutputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.notesOutputFolder = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Dossier notes atomiques')
            .setDesc('Où sauvegarder les notes atomiques')
            .addText(text => text
                .setPlaceholder('Notes/Atomic Ideas')
                .setValue(this.plugin.settings.atomicNotesFolder)
                .onChange(async (value) => {
                    this.plugin.settings.atomicNotesFolder = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Dossier résumés')
            .setDesc('Où sauvegarder les résumés')
            .addText(text => text
                .setPlaceholder('Notes/Summaries')
                .setValue(this.plugin.settings.summariesFolder)
                .onChange(async (value) => {
                    this.plugin.settings.summariesFolder = value;
                    await this.plugin.saveSettings();
                })
            );

        // Section Options
        containerEl.createEl('h2', { text: '⚙️ Options de génération' });

        new Setting(containerEl)
            .setName('Générer notes atomiques')
            .setDesc('Créer automatiquement des notes atomiques depuis la transcription')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.generateAtomicNotes)
                .onChange(async (value) => {
                    this.plugin.settings.generateAtomicNotes = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Générer résumé')
            .setDesc('Créer automatiquement un résumé de la vidéo')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.generateSummary)
                .onChange(async (value) => {
                    this.plugin.settings.generateSummary = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Générer cas d\'utilisation')
            .setDesc('Proposer des cas d\'utilisation guidés')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.generateUseCases)
                .onChange(async (value) => {
                    this.plugin.settings.generateUseCases = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Nombre max de notes atomiques')
            .setDesc('Maximum de notes atomiques à générer par vidéo')
            .addSlider(slider => slider
                .setLimits(5, 50, 5)
                .setValue(this.plugin.settings.maxAtomicNotesPerVideo)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxAtomicNotesPerVideo = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Inclure timestamps')
            .setDesc('Inclure les timestamps dans les notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.includeTimestamps)
                .onChange(async (value) => {
                    this.plugin.settings.includeTimestamps = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Inclure tags')
            .setDesc('Inclure des tags automatiques dans les notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.includeTags)
                .onChange(async (value) => {
                    this.plugin.settings.includeTags = value;
                    await this.plugin.saveSettings();
                })
            );

        // Footer
        containerEl.createEl('hr');
        const footer = containerEl.createDiv({ cls: 'settings-footer' });
        footer.createEl('p', {
            text: '💡 Astuce: Assurez-vous d\'avoir configuré au moins une clé API pour utiliser le plugin.'
        });
        footer.createEl('p', {
            text: '📚 Documentation complète disponible dans le README.md'
        });
    }
}
