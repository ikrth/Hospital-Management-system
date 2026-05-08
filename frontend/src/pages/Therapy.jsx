import React, { useMemo, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Send, 
  Calendar, 
  Activity, 
  Info, 
  Brain, 
  History,
  Plus,
  TrendingUp,
  MessageCircle,
  X,
  Heart,
  Mic,
  LogOut,
  Volume2
} from 'lucide-react'
import SpeechRecognition from 'react-speech-recognition'
import VoiceInput from '../components/ai/VoiceInput'
import { detectLanguage, getTextDirection, getInputPlaceholder } from '../utils/languageDetect'
import { useTherapist } from '../hooks/useAI'
import { 
  triageSymptoms, 
  analyzeMood, 
  getTherapySessions,
  getTherapySessionById,
  therapistChat,
  saveTherapySession
} from '../api/ai'
import { getDoctors, getDoctorSlots } from '../api/doctors'
import { createAppointment } from '../api/appointments'
import { getMyProfile } from '../api/patients'
import { Button, Input, Card, Badge, Skeleton } from '../components/common'
import { useAuthStore } from '../store/authStore'

export default function Therapy() {
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [moodAnalysis, setMoodAnalysis] = useState(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const chatEndRef = useRef(null)
  const [isSending, setIsSending] = useState(false)
  const { user } = useAuthStore()

  const [lastAIReply, setLastAIReply] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('ur-PK')
  const [moodScore, setMoodScore] = useState(5)
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false)

  // Voice availability check on page load
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice features require Google Chrome', {
        duration: 5000,
        icon: '🎤'
      })
    }
    
    const checkUrduVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const hasUrduVoice = voices.some(v => v.lang.includes('ur'))
      if (!hasUrduVoice && voices.length > 0) {
        console.info('No Urdu TTS voice found — using default voice')
      }
    }
    
    window.speechSynthesis.onvoiceschanged = checkUrduVoice
    checkUrduVoice()
    
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      if (SpeechRecognition) SpeechRecognition.stopListening()
    }
  }, [])

  const modelName = import.meta.env.VITE_GROQ_MODEL || 'Groq · Llama 3.1'

  // Fetch session list
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getTherapySessions()
        setSessions(res.data?.data || res.data || [])
      } catch (err) {
        console.error('Failed to fetch sessions')
      }
    }
    fetchSessions()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, isSending])

  const crisisDetected = useMemo(() => {
    const text = history
      .filter((msg) => msg.role === 'assistant')
      .map((msg) => msg.content)
      .join(' ')
      .toLowerCase()
    return text.includes('crisis') || text.includes('988') || text.includes('emergency')
  }, [history])

  const onSend = async (textToSend = message) => {
    const text = typeof textToSend === 'string' ? textToSend : message;
    if (!text.trim() || isSending) return
    
    const userMessage = { role: 'user', content: text.trim() }
    setHistory(prev => [...prev, userMessage])
    if (text === message) setMessage('')
    setIsSending(true)

    try {
      const res = await therapistChat({ message: userMessage.content, sessionId })
      const { reply, sessionId: newSessionId, session } = res.data?.data || res.data
      
      setSessionId(newSessionId)
      setHistory(session.messages)
      setLastAIReply(reply)
      
      if (session.dominantMood) {
        setMoodAnalysis({
          primaryEmotion: session.dominantMood,
          riskLevel: session.riskLevel,
          clinicalNotes: "Based on ongoing session analysis."
        })
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const startNewSession = () => {
    setSessionId(null)
    setHistory([])
    setMoodAnalysis(null)
    setShowHistory(false)
    setLastAIReply('')
  }

  const handleEndSession = async (save) => {
    if (save) {
      try {
        await saveTherapySession({ conversationHistory: history, moodScore })
        toast.success(
          <div className="flex flex-col gap-1">
            <span>Session saved to your wellness history</span>
            <a href="/wellness" className="text-xs font-bold text-teal-600 underline">View your Wellness Insights →</a>
          </div>
        )
      } catch (err) {
        toast.error('Failed to save session')
        return
      }
    } else {
      toast.success('Session ended')
    }
    startNewSession()
    setIsEndSessionModalOpen(false)
    setMoodScore(5)
  }

  const loadSession = async (id) => {
    setIsLoadingHistory(true)
    try {
      const res = await getTherapySessionById(id)
      const data = res.data?.data || res.data
      setSessionId(data._id)
      setHistory(data.messages)
      if (data.dominantMood) {
        setMoodAnalysis({
          primaryEmotion: data.dominantMood,
          riskLevel: data.riskLevel,
          clinicalNotes: "Loaded from previous session."
        })
      }
      setShowHistory(false)
    } catch (err) {
      toast.error('Failed to load session')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[var(--bg-primary)]">
      
      {/* History Sidebar (Desktop) */}
      <div className={cn(
        "hidden lg:flex flex-col w-72 border-r border-[var(--border)] bg-[var(--bg-secondary)] transition-all",
        showHistory ? "w-72" : "w-0 overflow-hidden border-none"
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-sm">Past Sessions</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}><X size={16} /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sessions.map(s => (
            <button 
              key={s._id}
              onClick={() => loadSession(s._id)}
              className={cn(
                "w-full text-left p-3 rounded-xl hover:bg-[var(--bg-primary)] transition-all group",
                sessionId === s._id ? "bg-[var(--bg-primary)] ring-1 ring-[var(--accent)]" : ""
              )}
            >
              <p className="text-xs font-bold truncate">{s.messages[0]?.content || 'New Session'}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[var(--text-muted)]">{new Date(s.updatedAt).toLocaleDateString()}</span>
                {s.dominantMood && <Badge variant="teal" size="sm" className="text-[8px]">{s.dominantMood}</Badge>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] transition-colors"
            >
              <History size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                <Activity size={18} className="text-[var(--accent)]" /> AI Therapy
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Session ID: {sessionId?.slice(-6) || 'New'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {history.length > 2 && (
              <Button variant="secondary" size="sm" icon={LogOut} onClick={() => setIsEndSessionModalOpen(true)}>End Session</Button>
            )}
            {moodAnalysis && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/20">
                <TrendingUp size={14} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--accent)]">{moodAnalysis.primaryEmotion}</span>
              </div>
            )}
            <Button variant="secondary" size="sm" icon={Plus} onClick={startNewSession}>New Chat</Button>
          </div>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {/* Disclaimer */}
          <div className="max-w-2xl mx-auto p-4 bg-amber-100 dark:bg-yellow-900/10 border border-amber-300 dark:border-yellow-800/30 rounded-2xl flex gap-3">
            <Info className="text-amber-700 dark:text-yellow-400 shrink-0 mt-1" size={18} />
            <p className="text-xs text-amber-900 dark:text-yellow-200/80 leading-relaxed">
              <strong>Professional Disclaimer:</strong> This AI provides emotional support and coping strategies. It is <strong>not</strong> a medical device or a licensed therapist. If you are in crisis, call <strong>0317-4288665</strong> immediately.
            </p>
          </div>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-[var(--accent-light)] text-[var(--accent)] rounded-2xl flex items-center justify-center">
                <Heart size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">How are you feeling today?</h2>
                <p className="text-[var(--text-secondary)] max-w-sm mx-auto">I'm here to listen and support you. You can talk to me about anything that's on your mind.</p>
              </div>
            </div>
          )}

          {history.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", isUser ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                  isUser 
                    ? "bg-[var(--accent)] text-white rounded-br-sm" 
                    : "bg-[var(--bg-secondary)] border border-[var(--border)] rounded-bl-sm"
                )}>
                  {msg.content}
                  {!isUser && (
                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel()
                        const u = new SpeechSynthesisUtterance(msg.content)
                        u.lang = selectedLanguage
                        
                        // Find a female voice
                        const voices = window.speechSynthesis.getVoices()
                        const langCode = selectedLanguage.split('-')[0]
                        const femaleVoice = voices.find(v => 
                          v.lang.includes(langCode) && 
                          ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'aisha', 'saman'].some(kw => v.name.toLowerCase().includes(kw))
                        )
                        
                        if (femaleVoice) {
                          u.voice = femaleVoice
                        } else {
                          // Fallback: slightly higher pitch if specific female voice isn't found
                          u.pitch = 1.2 
                        }

                        u.rate = 0.9
                        window.speechSynthesis.speak(u)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 -right-8 p-1 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      title="Read aloud"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-5 py-4 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[var(--bg-primary)] border-t sticky bottom-0 z-20">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                voiceMode 
                  ? "bg-teal-600 text-white" 
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]"
              )}
            >
              <Mic size={14} />
              {voiceMode ? "Voice Mode ON" : "Enable Voice Mode"}
            </button>
            
            {voiceMode && (
              <span className="text-xs text-[var(--text-muted)]">
                Hold mic to speak • AI will respond in your language
              </span>
            )}
          </div>
          <div className="p-6 max-w-3xl mx-auto flex gap-3 relative">
            {voiceMode ? (
              <VoiceInput
                onTranscript={(text) => onSend(text)}
                aiText={lastAIReply}
                disabled={isSending}
                selectedLang={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
            ) : (
              <>
                <textarea
                  dir={getTextDirection(message)}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onSend()
                    }
                  }}
                  placeholder={getInputPlaceholder(selectedLanguage)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all resize-none min-h-[52px] max-h-32"
                  rows={1}
                />
                <Button 
                  variant="primary" 
                  className="h-12 w-12 p-0 flex items-center justify-center shrink-0 rounded-xl"
                  onClick={() => onSend()}
                  disabled={!message.trim() || isSending}
                >
                  <Send size={18} />
                </Button>
              </>
            )}
          </div>
          <p className="text-center text-[10px] text-[var(--text-muted)] pb-4 font-medium uppercase tracking-widest">
            AI Assistant · {modelName} · Confidential Chat
          </p>
        </div>
      </div>

      {isEndSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full border border-[var(--border)] shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold mb-2">End Therapy Session</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              How are you feeling right now?
            </p>
            
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Mood Score: {moodScore}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                <span>😔 Very low</span>
                <span>😐 Neutral</span>
                <span>😊 Great</span>
              </div>
            </div>
            
            <p className="text-xs text-[var(--text-muted)] mb-6">
              This helps track your wellness progress over time.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => handleEndSession(false)}>Skip & End</Button>
              <Button variant="primary" onClick={() => handleEndSession(true)}>Save & End</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
