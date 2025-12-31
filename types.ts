
export type Language = 'en' | 'pt';

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface SavedPrompt {
  id: string;
  persona: string;
  task: string;
  context: string;
  tone: string;
  format: string;
  generatedText: string;
  timestamp: number;
}

export type ToneOption = 'Professional' | 'Creative' | 'Cinematic' | 'Academic' | 'Technical' | 'Casual';

export interface PromptFormState {
  persona: string;
  task: string;
  context: string;
  tone: ToneOption;
  format: string;
  camera?: string;
  lighting?: string;
  render?: string;
  files: FileData[];
}
