export function detectLanguage(text) {
  if (!text) return 'en'
  
  // Check for Urdu/Arabic script characters (Unicode range)
  const urduPattern = /[\u0600-\u06FF\u0750-\u077F]/
  if (urduPattern.test(text)) return 'ur-script'
  
  // Common Roman Urdu words
  const romanUrduWords = [
    'mujhe', 'meri', 'mera', 'aap', 'hai', 'hain', 'nahi',
    'kya', 'kuch', 'bohat', 'bahut', 'dil', 'ghar', 'kaam',
    'zyada', 'thoda', 'abhi', 'phir', 'lekin', 'aur', 'main',
    'hum', 'tum', 'yeh', 'woh', 'kal', 'aaj', 'raha', 'rahi',
    'neend', 'khana', 'paani', 'dard', 'takleef', 'pareshan'
  ]
  
  const lowerText = text.toLowerCase()
  const urduWordCount = romanUrduWords.filter(word => 
    lowerText.includes(word)
  ).length
  
  if (urduWordCount >= 2) return 'ur-roman'
  if (urduWordCount === 1) return 'mixed'
  return 'en'
}

export function getTextDirection(text) {
  const lang = detectLanguage(text)
  return lang === 'ur-script' ? 'rtl' : 'ltr'
}

export function getInputPlaceholder(selectedLang) {
  return selectedLang === 'ur-PK'
    ? 'یہاں لکھیں یا بات کرنے کے لیے مائیک تھامیں...'
    : 'Type here or hold mic to speak...'
}
