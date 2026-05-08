const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    // Fast & free model on Groq — swap to 'llama-3.3-70b-versatile' for higher quality
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }

  /**
   * Core chat wrapper — all methods go through here.
   * @param {Array}  messages     OpenAI-style message array
   * @param {string} systemPrompt System prompt injected as first message
   * @param {Object} options      Extra Groq chat params (temperature, max_tokens, …)
   */
  async chat(messages, systemPrompt, options = {}) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      ...options,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned an empty response');
    return content;
  }

  // ─── Triage ─────────────────────────────────────────────────────────────────

  async triageSymptoms(symptoms, patientAge, patientGender) {
    const specialties = [
      'Cardiology', 'Psychiatry', 'General Medicine', 'Neurology', 'Orthopedics',
      'Gynecology', 'Pediatrics', 'Dermatology', 'Gastroenterology', 'Endocrinology',
      'Ophthalmology', 'ENT', 'Pulmonology', 'Nephrology', 'Urology',
      'Rheumatology', 'Oncology', 'Hematology', 'Emergency Medicine', 'Radiology'
    ];

    const systemPrompt = `You are a medical triage AI assistant. Analyze symptoms and recommend the appropriate specialty. 
    You MUST choose the "recommendedSpecialty" ONLY from this list: [${specialties.join(', ')}].
    Respond ONLY with a valid JSON object.`;

    const userPrompt = `Patient: ${patientAge}yo ${patientGender}. Symptoms: ${symptoms.join(', ')}.
    JSON structure:
    {
      "recommendedSpecialty": "Must be from the list above",
      "appointmentType": "general|specialist|emergency|therapy",
      "priorityLevel": "low|medium|high|critical",
      "priorityScore": 1-10,
      "reasoning": "Brief explanation",
      "urgencyMessage": "Short patient alert",
      "redFlags": []
    }`;

    try {
      const raw = await this.chat([{ role: 'user', content: userPrompt }], systemPrompt, { temperature: 0.1, max_tokens: 512 });
      const cleaned = raw.replace(/```json|```/gi, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Triage AI error:', err);
      return { recommendedSpecialty: 'General Medicine', appointmentType: 'general', priorityLevel: 'medium', priorityScore: 5, reasoning: 'Fallback used.' };
    }
  }

  async therapistChat(conversationHistory, patientName) {
    const systemPrompt = `You are Dr. Aisha — a calm, professional, and compassionate AI therapist. 
    You provide steady emotional support. Avoid being overly dramatic; instead, be grounded and stable.

    BILINGUAL RULES (CRITICAL):
    - Many patients feel more comfortable with Urdu. 
    - If the patient speaks English, respond in English but MIX in warm Urdu/Roman-Urdu phrases (like "kaise hain aap?", "pareshan na hon", "bilkul sahi") to build a personal connection.
    - If they speak Urdu script or Roman Urdu, respond entirely in that same format.
    - NEVER ignore their language choice.

    CORE PRINCIPLES:
    - Validate first: "I hear that you're feeling..."
    - Be brief but warm (3-5 sentences).
    - Always address the patient as ${patientName}.
    - End with a gentle question.
    - If they seem in crisis, mention the 0317-4288665 (Umang) or 988 helpline.`;

    const messages = conversationHistory.map((m) => ({ role: m.role, content: m.content }));
    try {
      return await this.chat(messages, systemPrompt, { temperature: 0.7, max_tokens: 800 });
    } catch (err) {
      return "I'm having trouble connecting. If you need immediate help, please call 0317-4288665.";
    }
  }

  // ─── Mood Analysis ───────────────────────────────────────────────────────────

  async analyzeMood(conversationHistory) {
    const systemPrompt = `You are a psychological analysis AI. Analyze the patient's recent conversation and return a JSON object assessing their mood.
Respond EXACTLY with this JSON and NO OTHER TEXT:
{
  "primaryEmotion": "string (e.g. Anxious, Depressed, Neutral, Positive)",
  "riskLevel": "low|medium|high",
  "clinicalNotes": "1-2 sentence clinical observation"
}`;

    const messages = [{ role: 'user', content: JSON.stringify(conversationHistory) }];
    try {
      const raw = await this.chat(messages, systemPrompt, { temperature: 0, max_tokens: 256 });
      const cleaned = raw.replace(/```json|```/gi, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { primaryEmotion: 'Unknown', riskLevel: 'low', clinicalNotes: 'Mood analysis unavailable.' };
    }
  }

  // ─── Discharge Summary ───────────────────────────────────────────────────────

  async generateDischargeSummary(recordData) {
    const systemPrompt =
      'You are an expert medical AI assistant. Generate a clear, professional, and patient-friendly discharge summary based on the provided clinical record data. Use markdown formatting. Include sections for Diagnosis, Prescribed Medications, and Instructions/Care Plan. Keep it concise but comprehensive.';
    const messages = [{ role: 'user', content: JSON.stringify(recordData, null, 2) }];
    try {
      return await this.chat(messages, systemPrompt, { max_tokens: 1024 });
    } catch (err) {
      console.error('Discharge summary error:', err.message);
      return '## Discharge Summary\n\n*Unable to generate summary — AI service unavailable. Please refer to standard clinical protocols.*';
    }
  }

  // ─── Follow-up Suggestions ───────────────────────────────────────────────────

  async suggestFollowUps(diagnosis, notes) {
    const systemPrompt =
      'You are a medical AI assistant. Based on the diagnosis and clinical notes, suggest exactly 3 recommended follow-up actions or lifestyle changes. Return a JSON array of strings. NO OTHER TEXT.';
    const messages = [{ role: 'user', content: `Diagnosis: ${diagnosis}\nNotes: ${notes}` }];
    try {
      const raw = await this.chat(messages, systemPrompt, { temperature: 0.3, max_tokens: 256 });
      const cleaned = raw.replace(/```json|```/gi, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return ['Follow up with primary care physician', 'Rest and monitor symptoms', 'Contact your doctor if symptoms worsen'];
    }
  }

  // ─── Health Check ────────────────────────────────────────────────────────────

  async checkHealth() {
    if (!process.env.GROQ_API_KEY) {
      return { isOnline: false, provider: 'Groq', error: 'GROQ_API_KEY not set' };
    }
    try {
      // Lightweight ping — list available models
      const models = await this.client.models.list();
      return {
        isOnline: true,
        provider: 'Groq',
        model: this.model,
        availableModels: models.data?.map((m) => m.id) || [],
      };
    } catch (err) {
      return { isOnline: false, provider: 'Groq', error: err.message };
    }
  }
}

module.exports = new GroqService();
module.exports.GroqService = GroqService;
