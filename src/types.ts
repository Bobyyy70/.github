// Types pour le plugin Video Transcription & Knowledge Extractor

export interface PluginSettings {
    // API Keys
    youtubeApiKey: string;
    gitlabToken: string;
    openaiApiKey: string;
    anthropicApiKey: string;
    googleAiApiKey: string;
    huggingfaceApiKey: string;

    // Paramètres de transcription
    transcriptionProvider: 'openai' | 'google' | 'anthropic' | 'ollama';
    transcriptionLanguage: string;

    // Paramètres de génération de notes
    llmProvider: 'openai' | 'google' | 'anthropic' | 'ollama' | 'huggingface';
    llmModel: string;
    temperature: number;

    // Paramètres Open Source
    ollamaEndpoint: string;
    ollamaModel: string;
    huggingfaceModel: string;
    useLocalModels: boolean;

    // Chemins des dossiers
    videoDownloadFolder: string;
    notesOutputFolder: string;
    atomicNotesFolder: string;
    summariesFolder: string;

    // Options de génération
    generateAtomicNotes: boolean;
    generateSummary: boolean;
    generateUseCases: boolean;
    maxAtomicNotesPerVideo: number;

    // Options de nommage
    noteNamingPattern: string;
    includeTimestamps: boolean;
    includeTags: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    youtubeApiKey: '',
    gitlabToken: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    googleAiApiKey: '',
    huggingfaceApiKey: '',

    transcriptionProvider: 'openai',
    transcriptionLanguage: 'fr',

    llmProvider: 'ollama',
    llmModel: 'gpt-4-turbo-preview',
    temperature: 0.7,

    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    huggingfaceModel: 'meta-llama/Meta-Llama-3-8B-Instruct',
    useLocalModels: true,

    videoDownloadFolder: 'Videos',
    notesOutputFolder: 'Notes/Video Transcriptions',
    atomicNotesFolder: 'Notes/Atomic Ideas',
    summariesFolder: 'Notes/Summaries',

    generateAtomicNotes: true,
    generateSummary: true,
    generateUseCases: true,
    maxAtomicNotesPerVideo: 20,

    noteNamingPattern: '{{title}} - {{date}}',
    includeTimestamps: true,
    includeTags: true,
};

export interface VideoSource {
    platform: 'youtube' | 'gitlab' | 'vimeo' | 'custom';
    url: string;
    title: string;
    description?: string;
    duration?: number;
    thumbnail?: string;
    author?: string;
    publishedAt?: Date;
}

export interface SearchResult {
    id: string;
    platform: 'youtube' | 'gitlab' | 'vimeo';
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    duration: number;
    author: string;
    publishedAt: Date;
    viewCount?: number;
}

export interface Transcription {
    text: string;
    segments: TranscriptionSegment[];
    language: string;
    duration: number;
}

export interface TranscriptionSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    confidence?: number;
}

export interface AtomicNote {
    title: string;
    content: string;
    tags: string[];
    relatedConcepts: string[];
    timestamp?: number;
    sourceVideo: string;
    createdAt: Date;
}

export interface VideoSummary {
    title: string;
    overview: string;
    keyPoints: string[];
    mainTopics: string[];
    technicalConcepts: string[];
    useCases: UseCase[];
    relatedResources: string[];
}

export interface UseCase {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    steps: string[];
    requiredKnowledge: string[];
}

export interface ProcessingJob {
    id: string;
    videoSource: VideoSource;
    status: 'pending' | 'downloading' | 'transcribing' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    results?: ProcessingResults;
}

export interface ProcessingResults {
    transcription: Transcription;
    atomicNotes: AtomicNote[];
    summary: VideoSummary;
    mainNotePath: string;
    atomicNotesPaths: string[];
    summaryPath: string;
}

export interface LLMResponse {
    content: string;
    tokensUsed: number;
    model: string;
}

export interface PlatformProvider {
    name: string;
    search(query: string, maxResults: number): Promise<SearchResult[]>;
    getVideoInfo(url: string): Promise<VideoSource>;
    downloadVideo(url: string, outputPath: string): Promise<string>;
    extractAudio(videoPath: string, audioPath: string): Promise<string>;
}
