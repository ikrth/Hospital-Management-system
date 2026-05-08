import { useState, useEffect } from 'react'
import SpeechRecognition, { 
  useSpeechRecognition 
} from 'react-speech-recognition'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { cn } from '../../utils/cn'

const SUPPORTED_LANGUAGES = [
  { code: 'ur-PK', label: 'اردو', flag: '🇵🇰' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
]

export default function VoiceInput({ onTranscript, aiText, disabled, selectedLang, onLanguageChange }) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  // Auto-send when listening stops
  useEffect(() => {
    if (!listening && transcript.trim().length > 0) {
      onTranscript(transcript)
      resetTranscript()
    }
  }, [listening, transcript, onTranscript, resetTranscript])

  const speakText = (text) => {
    if (!text) return
    window.speechSynthesis.cancel()
    
    // Find a female voice
    const voices = window.speechSynthesis.getVoices()
    const langCode = selectedLang.split('-')[0]
    const femaleVoice = voices.find(v => 
      v.lang.includes(langCode) && 
      ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'aisha', 'saman'].some(kw => v.name.toLowerCase().includes(kw))
    )

    const sentences = text.match(/[^।.!?]+[।.!?]+/g) || [text]
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence)
      u.lang = selectedLang
      u.rate = 0.9
      u.pitch = femaleVoice ? 1.0 : 1.2 // slightly higher pitch if no female voice found
      u.volume = 1.0
      if (femaleVoice) u.voice = femaleVoice
      
      if (i === 0) u.onstart = () => setIsSpeaking(true)
      if (i === sentences.length - 1) u.onend = () => setIsSpeaking(false)
      u.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(u)
    })
  }

  // Auto-speak AI reply
  useEffect(() => {
    if (aiText && autoSpeak && aiText.trim()) {
      speakText(aiText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiText])

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    if (disabled || isSpeaking) return
    resetTranscript()
    SpeechRecognition.startListening({
      language: selectedLang,
      continuous: false
    })
  }

  const handleMouseUp = (e) => {
    e.preventDefault()
    SpeechRecognition.stopListening()
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-3 text-red-500 bg-red-50 border border-red-200 rounded-xl text-sm text-center">
        Voice input requires Google Chrome
      </div>
    )
  }

  return (
    <div className="flex flex-row gap-2 items-center w-full">
      {/* A) Language selector pills */}
      <div className="flex rounded-xl border border-[var(--border)] overflow-hidden shrink-0">
        {SUPPORTED_LANGUAGES.map(lang => (
          <button
            key={lang.code}
            disabled={disabled || listening}
            onClick={() => onLanguageChange(lang.code)}
            className={cn(
              "px-3 py-2 text-sm transition-colors",
              selectedLang === lang.code
                ? "bg-teal-600 text-white"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>

      {/* B) Mic button (hold to speak) */}
      <div className="relative shrink-0 flex flex-col items-center">
        <button
          disabled={disabled || isSpeaking}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={cn(
            "p-3 rounded-xl transition-all select-none touch-none",
            listening
              ? "bg-red-500 text-white animate-pulse scale-110 ring-4 ring-red-300"
              : "bg-teal-600 text-white hover:bg-teal-700",
            (disabled || isSpeaking) && "opacity-50 cursor-not-allowed"
          )}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
          
          {/* F) Voice status indicator */}
          {!listening && (
            <div className={cn(
              "absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full",
              selectedLang === 'ur-PK' ? "bg-green-400" : "bg-blue-400"
            )} />
          )}
        </button>
        <span className={cn(
          "absolute -bottom-5 whitespace-nowrap text-xs",
          listening ? "text-red-500 animate-pulse font-medium" : "text-[var(--text-muted)]"
        )}>
          {listening ? "Listening..." : "Hold to speak"}
        </span>
      </div>

      {/* C) Stop speaking button */}
      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          title="Stop AI voice"
          className="p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 animate-pulse shrink-0"
        >
          <VolumeX size={20} />
        </button>
      )}

      {/* D) Auto-speak toggle button */}
      {!isSpeaking && (
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          title={autoSpeak ? "AI voice ON" : "AI voice OFF"}
          className={cn(
            "p-3 rounded-xl transition-all shrink-0",
            autoSpeak
              ? "bg-teal-50 dark:bg-teal-950 text-teal-600"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
          )}
        >
          <Volume2 size={20} />
        </button>
      )}

      {/* E) Live transcript preview */}
      {listening && transcript && (
        <span className="text-sm italic text-[var(--text-muted)] max-w-xs truncate animate-fade-in ml-2">
          "{transcript}"
        </span>
      )}
    </div>
  )
}
