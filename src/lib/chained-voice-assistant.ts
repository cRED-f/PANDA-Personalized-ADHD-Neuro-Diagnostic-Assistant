import { OpenAIService } from "./openai-service";

export interface ChainedVoiceConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  temperature?: number;
  instructions?: string;
  getConversationHistory?: () => Promise<
    Array<{
      role: "user" | "assistant";
      content: string;
    }>
  >;
}

export interface ChainedVoiceEvents {
  onTranscript: (text: string, isFinal: boolean) => void;
  onResponse: (text: string, audioUrl?: string) => void;
  onResponseComplete: (text: string) => void; // New event when response is fully processed and spoken
  onError: (error: string) => void;
  onStatusChange: (
    status:
      | "idle"
      | "recording"
      | "transcribing"
      | "thinking"
      | "speaking"
      | "error"
  ) => void;
  onAudioReady: (audioUrl: string) => void;
}

export class ChainedVoiceAssistant {
  private config: ChainedVoiceConfig;
  private events: ChainedVoiceEvents;
  private openAIService: OpenAIService;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private currentStatus:
    | "idle"
    | "recording"
    | "transcribing"
    | "thinking"
    | "speaking"
    | "error" = "idle";

  constructor(config: ChainedVoiceConfig, events: ChainedVoiceEvents) {
    this.config = config;
    this.events = events;
    this.openAIService = new OpenAIService(config.apiKey);
  }

  private updateStatus(status: typeof this.currentStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.events.onStatusChange(status);
    }
  }

  async startRecording(): Promise<void> {
    try {
      this.updateStatus("recording");

      // Get microphone access with enhanced audio quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100, // Higher sample rate for better quality
          channelCount: 1, // Mono for speech recognition
          sampleSize: 16, // 16-bit samples
        },
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          await this.processRecording();
        } catch (error) {
          console.error("Audio processing failed:", error);
          this.events.onError(
            `Audio processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          this.updateStatus("error");
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        this.events.onError("Recording error occurred");
        this.updateStatus("error");
      };

      // Start recording with smaller intervals for better quality
      this.mediaRecorder.start(250); // Collect data every 250ms for better audio quality
      this.isRecording = true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.events.onError("Failed to access microphone");
      this.updateStatus("error");
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    this.isRecording = false;

    if (this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }

    // Stop all tracks to release microphone
    const stream = this.mediaRecorder.stream;
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  private async processRecording(): Promise<void> {
    try {
      if (this.audioChunks.length === 0) {
        this.updateStatus("idle");
        return;
      }

      // Step 1: Create audio blob
      const audioBlob = new Blob(this.audioChunks, {
        type: this.getSupportedMimeType(),
      });

      // Step 2: Speech-to-Text (Transcription)
      this.updateStatus("transcribing");

      const transcript = await this.transcribeAudio(audioBlob);

      if (!transcript || transcript.trim().length === 0) {
        this.updateStatus("idle");
        return;
      }

      this.events.onTranscript(transcript, true);

      // Step 3: LLM Processing (Text-to-Text)
      this.updateStatus("thinking");

      const aiResponse = await this.generateResponse(transcript);

      if (!aiResponse || aiResponse.trim().length === 0) {
        this.updateStatus("idle");
        return;
      }

      // Step 4: Text-to-Speech (Audio Synthesis)
      this.updateStatus("speaking");

      const audioUrl = await this.synthesizeSpeech(aiResponse);

      if (audioUrl) {
        this.events.onAudioReady(audioUrl);

        // Play the audio
        await this.playAudio(audioUrl);
      }

      // Only notify about the response after audio has finished playing
      this.events.onResponseComplete(aiResponse);

      this.updateStatus("idle");
    } catch (error) {
      console.error("Processing error:", error);

      // Clean up audio chunks to prevent accumulation
      this.audioChunks = [];

      // Provide more specific error messages
      let errorMessage = "Processing failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.events.onError(errorMessage);
      this.updateStatus("error");

      // Auto-recover from error state after a short delay
      setTimeout(() => {
        if (this.currentStatus === "error") {
          this.updateStatus("idle");
        }
      }, 3000);
    }
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Check if audio blob is valid
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("No audio data recorded. Please try speaking again.");
      }

      if (audioBlob.size < 2000) {
        throw new Error(
          "Audio recording too short. Please hold the button longer and speak clearly."
        );
      }

      // Determine correct file extension and name based on actual MIME type
      let fileName = "recording.webm";
      const mimeType = audioBlob.type;

      if (mimeType.includes("opus") || mimeType.includes("webm")) {
        fileName = "recording.webm";
      } else if (mimeType.includes("wav")) {
        fileName = "recording.wav";
      } else if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
        fileName = "recording.m4a";
      } else if (mimeType.includes("ogg")) {
        fileName = "recording.ogg";
      }

      console.log(
        `🔊 Audio blob details: size=${audioBlob.size} bytes, type=${mimeType}, duration=~${(audioBlob.size / 16000).toFixed(1)}s`
      );

      // Convert blob to File for OpenAI API with correct type
      const audioFile = new File([audioBlob], fileName, {
        type: mimeType,
      });

      const result = await this.openAIService.transcribeAudio(audioFile);

      if (!result || !result.text) {
        console.log("⚠️ Empty transcription result:", result);
        throw new Error(
          "Speech not recognized. Please speak clearly and try again."
        );
      }

      const transcriptText = result.text.trim();
      console.log(
        `📝 Transcription result: "${transcriptText}" (${transcriptText.length} characters)`
      );

      if (transcriptText.length < 2) {
        throw new Error(
          "Speech too short or unclear. Please speak longer and more clearly."
        );
      }

      return transcriptText;
    } catch (error) {
      console.error("Transcription failed:", error);

      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("connection")
        ) {
          throw new Error(
            "Network connection issue. Please check your internet and try again."
          );
        } else if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          throw new Error(
            "Service temporarily unavailable. Please try again in a moment."
          );
        } else if (
          error.message.includes("format") ||
          error.message.includes("codec")
        ) {
          throw new Error(
            "Audio format not supported. Please try recording again."
          );
        } else {
          throw error; // Preserve the original error message
        }
      }

      throw new Error(
        "Speech-to-text failed. Please speak clearly and try again."
      );
    }
  }

  private async generateResponse(transcript: string): Promise<string> {
    try {
      const systemPrompt =
        this.config.instructions || this.getDefaultInstructions();

      // Build conversation messages
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      // Add conversation history if available
      if (this.config.getConversationHistory) {
        const history = await this.config.getConversationHistory();
        messages.push(...history);
      }

      // Add current user message
      messages.push({
        role: "user",
        content: transcript,
      });

      const response = await this.openAIService.generateChatCompletion(
        messages,
        this.config.model || "gpt-4.1"
      );

      const aiResponse = response.choices[0]?.message?.content || "";

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error("AI did not generate a response. Please try again.");
      }

      return aiResponse.trim();
    } catch (error) {
      console.error("LLM processing failed:", error);
      if (error instanceof Error) {
        throw error; // Preserve specific error messages
      }
      throw new Error(
        "AI response generation failed. Please check your connection and try again."
      );
    }
  }

  private async synthesizeSpeech(text: string): Promise<string | null> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error("No text to synthesize");
      }

      const audioBuffer = await this.openAIService.generateSpeech(
        text,
        this.config.voice || "alloy",
        "gpt-4o-mini-tts"
      );

      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error("No audio data received from text-to-speech");
      }

      // Create blob URL for playback
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      return audioUrl;
    } catch (error) {
      console.error("Speech synthesis failed:", error);
      if (error instanceof Error) {
        throw error; // Preserve specific error messages
      }
      throw new Error(
        "Text-to-speech failed. Please check your connection and try again."
      );
    }
  }

  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Clean up
        resolve();
      };

      audio.onerror = (error) => {
        console.error("Audio playback failed:", error);
        URL.revokeObjectURL(audioUrl); // Clean up
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch(reject);
    });
  }

  private getSupportedMimeType(): string {
    // Prioritize formats that work best with OpenAI Whisper
    const mimeTypes = [
      "audio/webm;codecs=opus", // Best for speech recognition
      "audio/wav", // High quality, good for speech
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log(`🎙️ Using audio format: ${mimeType}`);
        return mimeType;
      }
    }

    console.log("🎙️ Using fallback audio format: audio/webm");
    return "audio/webm"; // Fallback
  }

  private getDefaultInstructions(): string {
    return `# Dr. PANDA: ADHD and Autism Assessment Specialist

You are Dr. PANDA, an ADHD and Autism specialist conducting natural conversation assessments. Your primary objective is comprehensive behavioral pattern assessment through empathetic dialogue to differentiate between ADHD and Autism using concise, varied responses.

## Conversation Focus
- **Stay Assessment-Focused:** This is strictly an ADHD/Autism behavioral assessment
- If user discusses irrelevant topics, politely redirect: "I understand, but let's focus on [child's name]'s behaviors so I can help you better. Let me ask about..."
- If user asks unrelated questions, respond: "That's a great question, but I'm here specifically to learn about [child's name]'s daily behaviors. Can we talk about..."

## Core Mission
Conduct thorough behavioral assessments through natural conversation to gather comprehensive data for accurate ADHD/Autism differential diagnosis. Build detailed conversations systematically while maintaining warmth and empathy.

## Assessment Workflow

### Stage 1: Initial Greeting
1. Start with: "Hello! I'm Dr. PANDA. How are you feeling today?"
2. Wait for their response before proceeding

### Stage 2: Understanding Their Concern
1. After greeting response, ask: "What brings you here today?" or similar variants
2. Listen carefully - never assume it's about a child
3. Ask follow-up questions to fully understand their concern
4. Only proceed when they mention child concerns

### Stage 3: Collecting Personal Information
Only after child concerns are mentioned, collect:
- Child's name
- Child's age  
- Child's grade
- Your relationship to the child

### Stage 4: Systematic Behavioral Assessment
Explore all 33 behavioral items (27 ADHD behaviors + 6 Autism differential areas):

#### ADHD Behaviors (27 total)
**Oppositional (6):** Angry/resentful, Argues adults, Loses temper, Irritable, Defies requests, Deliberately annoys

**Cognition (6):** Homework difficulty, Fails assignments, Needs supervision, Avoids sustained effort, Trouble concentrating class, Doesn't follow instructions

**Hyperactivity (6):** Always on go/motor, Hard control public, Runs/climbs excessive, Restless/squirming, Difficulty waiting, Difficulty leisure

**ADHD Index (9):** Inattentive/distracted, Short attention, Fidgets/squirms, Messy/disorganized, Attends if interested, Distractibility problems, Distracted instructions, Leaves seat, Easily frustrated

#### Autism Differential Areas (6 total)
1. **Social Interaction:** ADHD wants to socialize but has impulse control issues vs. Autism struggles with social cues and making friends
2. **Communication:** ADHD talks normally but may interrupt vs. Autism may have delayed speech or communication difficulties
3. **Repetitive Behaviors:** ADHD doesn't need routines vs. Autism often has strict routines and repetitive behaviors
4. **Sensory Sensitivities:** ADHD finds it hard to ignore distractions vs. Autism has strong reactions to sensory stimuli
5. **Emotional Regulation:** ADHD has brief emotional struggles vs. Autism has intense, longer-lasting reactions to change
6. **Developmental Delay:** ADHD typically no delays except attention/impulse vs. Autism often has early speech/social/motor delays

### Stage 5: Completion
Only when all 33 items are thoroughly explored, provide warm goodbye.

## Question Strategy for Each Behavioral Item
For each behavior/area, ask maximum 3 focused questions:
1. **Frequency:** "How often does this happen?"
2. **Examples:** "Can you tell me about a time this happened?"
3. **Context/Impact:** "Where does this happen most?" or "How does this affect your family?"

After 3 questions, mark behavior complete and move to next item.

## Communication Guidelines

### Response Structure (Maximum 3 sentences total)
1. **Human warmth/empathy** (1 sentence - simple, caring words)
2. **Brief reflection** (1 sentence - repeat what they said simply)  
3. **Focused question** (1 question using everyday language)

### Language Requirements
- Use everyday conversational language
- Talk like speaking to a neighbor or friend
- Avoid medical or technical terms
- Ensure any parent would understand
- Use the child's name throughout

### Natural Transitions
Use simple transitions between behaviors:
- "You mentioned [name] has trouble focusing. I'm also curious about how he gets along with other kids..."
- "That helps me understand his energy level. Another thing I'd like to know is how [name] talks and communicates..."

## Critical Rules
2. **Assessment Focus:** Politely redirect any off-topic conversations back to behavioral assessment
3. **Complete Assessment:** All 33 items must be explored before ending
4. **Question Limit:** Maximum 3 questions per behavioral item
5. **Sequential Stages:** Follow conversation stages in strict order
6. **Simple Language:** Use only everyday conversational terms
7. **Concise Responses:** Maximum 3 sentences per response
8. **Child Focus:** Use child's name throughout assessment
9. **Warm Tone:** Maintain empathetic, caring demeanor
10. **Persistent Questioning:** If user doesn't answer a question, gently ask the same question again until they explicitly say they don't want to talk about it. Use phrases like "I understand this might be difficult to talk about, but it would really help me understand [name] better if you could tell me about..." Only move on when they clearly indicate they don't want to discuss that topic.

## Completion Requirements
**Do not offer goodbye until:**
- All 27 ADHD behaviors explored (3 questions each maximum)
- All 6 Autism differential areas explored (3 questions each maximum)
- Total of 33 items thoroughly assessed

## Final Goodbye (Only when assessment complete)
"Thank you so much for sharing all these details about [name] with me today - I can really see how much you love and care about him. All the information you've given me about his behavior and daily life will be really helpful in understanding [name]'s unique strengths and challenges. I hope our conversation has been helpful for you too, and I wish you and [name] all the best. Take care!"

## Boundaries
- This is an assessment conversation, not therapy
- Do not provide medical diagnoses
- Encourage professional evaluation when appropriate
- If crisis/self-harm mentioned, direct to immediate professional help
- Redirect off-topic conversations back to behavioral assessment
- Stay focused on the child's daily behaviors and challenges`;
  }

  // Public methods
  getStatus(): typeof this.currentStatus {
    return this.currentStatus;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      if (this.mediaRecorder) {
        const stream = this.mediaRecorder.stream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        this.mediaRecorder = null;
      }

      this.audioChunks = [];
      this.updateStatus("idle");
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }

  // Method to reset from error state
  resetFromError(): void {
    if (this.currentStatus === "error") {
      this.audioChunks = [];
      this.updateStatus("idle");
    }
  }
}
