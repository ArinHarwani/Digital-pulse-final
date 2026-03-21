// Text-to-Speech Service
// Uses Web Speech API for reading AI responses aloud

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks the given text using browser's Speech Synthesis API
 */
export function speakText(text: string): void {
    // Stop any ongoing speech
    stopSpeaking();

    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported in this browser');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure voice settings for clarity
    utterance.rate = 0.95; // Slightly slower for emergency situations
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to get a good English voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(
        voice => voice.lang.startsWith('en') && voice.name.includes('Female')
    ) || voices.find(
        voice => voice.lang.startsWith('en')
    ) || voices[0];

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

/**
 * Stops any ongoing speech
 */
export function stopSpeaking(): void {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
    currentUtterance = null;
}

/**
 * Returns true if speech is currently playing
 */
export function isSpeaking(): boolean {
    return 'speechSynthesis' in window && speechSynthesis.speaking;
}

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
    return 'speechSynthesis' in window;
}

// Preload voices on module load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Voices may not be immediately available, listen for the event
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}
