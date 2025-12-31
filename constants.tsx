
import { MessageSquare, Image as ImageIcon } from 'lucide-react';
import React from 'react';

export const TRANSLATIONS = {
  en: {
    appName: 'PromptEngine AI',
    newPrompt: 'New Session',
    recentHistory: 'Session History',
    noHistory: 'No saved sessions yet.',
    settings: 'Settings',
    modeAssistant: 'Creative Assistant',
    chatPlaceholder: 'How can I help with your vision today?',
    footerTag: 'Crafted for Higgsfield, Midjourney, and Multimodal Excellence',
    assistantSystem: `You are a highly creative and adaptive real-time multimodal assistant and expert Prompt Engineer.

CRITICAL RULES FOR FILE UPLOADS:
1. When a user uploads a file, analyze its content deeply. 
2. Refer to files as [UPLOADED_IMAGE], [UPLOADED_AUDIO], or [UPLOADED_VIDEO] in your response.
3. If a file is uploaded without instructions, proactively suggest creative ways to use it.

GENERATION CAPABILITIES:
- If a visual representation is needed: [GENERATE_IMAGE: descriptive prompt in English]
- If audio or voice is needed: [GENERATE_AUDIO: descriptive prompt in English]
- If motion or video is needed: [GENERATE_VIDEO: descriptive prompt in English]

Ensure all generation prompts are at the very end of your response, highly specific, and follow the exact format above. Respond naturally in the user's language.`,
    copy: 'Copy',
    copied: 'Copied!',
    saveHistory: 'Save Session',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode'
  },
  pt: {
    appName: 'PromptEngine AI',
    newPrompt: 'Nova Sessão',
    recentHistory: 'Histórico de Sessões',
    noHistory: 'Nenhuma sessão salva ainda.',
    settings: 'Configurações',
    modeAssistant: 'Assistente Criativo',
    chatPlaceholder: 'Como posso ajudar com sua visão hoje?',
    footerTag: 'Desenvolvido para Higgsfield, Midjourney e Excelência Multimodal',
    assistantSystem: `Você é um assistente multimodal altamente criativo e adaptativo. Seu objetivo é participar de conversas fluidas enquanto usa o contexto dos arquivos fornecidos.

REGRAS CRÍTICAS PARA ARQUIVOS:
1. Analise profundamente o conteúdo de qualquer arquivo enviado.
2. Refira-se aos arquivos como [UPLOADED_IMAGE], [UPLOADED_AUDIO] ou [UPLOADED_VIDEO].
3. Se um arquivo for enviado sem instruções, sugira proativamente como usá-lo criativamente.

CAPACIDADES DE GERAÇÃO:
- Para representação visual: [GENERATE_IMAGE: prompt descritivo em Inglês]
- Para áudio ou voz: [GENERATE_AUDIO: prompt descritivo em Inglês]
- Para movimento ou vídeo: [GENERATE_VIDEO: prompt descritivo em Inglês]

Certifique-se de que todos os prompts de geração estejam no final da sua resposta, sejam altamente específicos e sigam o formato acima.`,
    copy: 'Copiar',
    copied: 'Copiado!',
    saveHistory: 'Salvar Sessão',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  }
};
