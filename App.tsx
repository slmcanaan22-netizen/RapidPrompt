import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  Plus, 
  Trash2, 
  Sparkles, 
  Send, 
  Settings,
  X,
  Bookmark,
  Cpu,
  Languages,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Music,
  Video,
  File as FileIcon,
  Maximize2,
  Volume2,
  Sun,
  Moon,
  Menu
} from 'lucide-react';
import { Button } from './components/Button';
import { TRANSLATIONS } from './constants';
import { SavedPrompt, Language, FileData } from './types';
import { assistantChatStream, generateImage, generateAudio, generateVideo } from './services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: FileData[];
}

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const t = TRANSLATIONS[lang];
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Assistant State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [assistantFiles, setAssistantFiles] = useState<FileData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Preview States
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [activePreviewAudio, setActivePreviewAudio] = useState<string | null>(null);
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);
  
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistantFileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<SavedPrompt[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();

    const saved = localStorage.getItem('assistant_history');
    if (saved) setHistory(JSON.parse(saved));
    
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang) setLang(savedLang as Language);

    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme as 'light' | 'dark');
    } else {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('assistant_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
    reader.onerror = reject;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileData[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await toBase64(file);
      newFiles.push({
        name: file.name,
        mimeType: file.type,
        data: base64
      });
    }

    setAssistantFiles(prev => [...prev, ...newFiles]);
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAssistantFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && assistantFiles.length === 0 || isTyping) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: inputMessage,
      files: assistantFiles 
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    const currentFiles = [...assistantFiles];
    setAssistantFiles([]);
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    let fullResponse = '';

    try {
      const stream = await assistantChatStream(inputMessage, currentFiles, messages, t.assistantSystem);
      
      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        fullResponse += chunkText;
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullResponse } : m));
      }

      const imageMatch = fullResponse.match(/\[GENERATE_IMAGE:\s*(.*?)\]/);
      const audioMatch = fullResponse.match(/\[GENERATE_AUDIO:\s*(.*?)\]/);
      const videoMatch = fullResponse.match(/\[GENERATE_VIDEO:\s*(.*?)\]/);

      if (imageMatch || audioMatch || videoMatch) {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { 
          ...m, 
          content: m.content
            .replace(/\[GENERATE_IMAGE:.*?\]/g, '')
            .replace(/\[GENERATE_AUDIO:.*?\]/g, '')
            .replace(/\[GENERATE_VIDEO:.*?\]/g, '')
            .trim()
        } : m));

        if (imageMatch) {
          setIsPreviewLoading(true);
          generateImage(imageMatch[1]).then(url => {
            setActivePreviewImage(url);
            setIsPreviewLoading(false);
          });
        }
        
        if (audioMatch) {
          setIsAudioLoading(true);
          generateAudio(audioMatch[1]).then(url => {
            setActivePreviewAudio(url);
            setIsAudioLoading(false);
          });
        }

        if (videoMatch) {
          setIsVideoLoading(true);
          generateVideo(videoMatch[1]).then(url => {
            if (url) {
              setActivePreviewVideo(url);
            } else {
              setHasApiKey(false);
            }
            setIsVideoLoading(false);
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setIsPreviewLoading(false);
      setIsAudioLoading(false);
      setIsVideoLoading(false);
    } finally {
      setIsTyping(false);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon size={14} className="text-bronze-soft" />;
    if (mime.startsWith('audio/')) return <Music size={14} className="text-bronze-neon" />;
    if (mime.startsWith('video/')) return <Video size={14} className="text-red-500" />;
    return <FileIcon size={14} className="text-graphite-400" />;
  };

  if (hasApiKey === false) {
    return (
      <div className="h-screen bg-graphite-50 dark:bg-graphite-950 flex items-center justify-center p-6 text-center transition-colors duration-500">
        <div className="max-w-md space-y-8 bg-white dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 p-10 rounded-[3rem] shadow-2xl">
          <div className="w-20 h-20 bg-bronze-neon rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-bronze-neon/30">
            <Cpu size={40} className="text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-graphite-900 dark:text-white tracking-tight">API Key Required</h1>
            <p className="text-graphite-600 dark:text-graphite-400 leading-relaxed">Video generation and high-quality AI features require a paid API key from a billing-enabled Google Cloud project.</p>
          </div>
          <div className="pt-4 space-y-4">
            <Button size="lg" className="w-full h-14 font-bold text-lg" onClick={handleSelectKey}>
              Select API Key
            </Button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-bronze-neon hover:underline inline-block">Learn about billing requirements</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-graphite-950 text-graphite-900 dark:text-graphite-100 overflow-hidden transition-colors duration-500">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-80 bg-graphite-50 dark:bg-graphite-900 border-r border-graphite-200 dark:border-graphite-800 transition-all duration-300 lg:relative lg:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bronze-neon rounded-lg flex items-center justify-center shadow-lg shadow-bronze-neon/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-graphite-900 dark:text-white tracking-tight">{t.appName}</h1>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(false)} icon={<X size={18} />} />
        </div>

        <div className="px-6 mb-4">
          <Button variant="outline" className="w-full justify-start border-graphite-200 dark:border-graphite-800 bg-white dark:bg-graphite-950/50 hover:bg-graphite-100 dark:hover:bg-graphite-800 shadow-sm transition-all" icon={<Plus size={18} />} onClick={() => {
            setMessages([]);
            setActivePreviewImage(null);
            setActivePreviewAudio(null);
            setActivePreviewVideo(null);
          }}>
            {t.newPrompt}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          <div className="flex items-center gap-2 px-2 py-2 mb-2 text-xs font-semibold text-graphite-400 dark:text-graphite-500 uppercase tracking-wider">
            <History size={14} />
            {t.recentHistory}
          </div>
          <div className="space-y-1">
            {history.length === 0 ? (
              <p className="px-4 py-8 text-sm text-graphite-400 dark:text-graphite-600 text-center italic">{t.noHistory}</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-graphite-800 transition-all cursor-pointer border border-transparent hover:border-graphite-200 dark:hover:border-graphite-700 hover:shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-graphite-900 dark:text-graphite-200 truncate">{item.task || 'Conversation'}</p>
                    <p className="text-xs text-graphite-400 dark:text-graphite-500 truncate">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-graphite-200 dark:border-graphite-800 space-y-2">
          {/* Theme Selector (Sidebar) */}
          <div className="flex items-center justify-between px-2 bg-white dark:bg-graphite-950/50 rounded-xl p-1.5 border border-graphite-200 dark:border-graphite-800">
             <div className="flex items-center gap-2 text-xs font-medium text-graphite-500 ml-2">
               {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} Theme
             </div>
             <div className="flex bg-graphite-100 dark:bg-graphite-800 rounded-lg p-0.5">
               <button 
                onClick={() => setTheme('light')} 
                className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-bronze-neon shadow-sm' : 'text-graphite-400'}`}
               >
                 <Sun size={14} />
               </button>
               <button 
                onClick={() => setTheme('dark')} 
                className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-graphite-950 text-bronze-neon shadow-sm' : 'text-graphite-400'}`}
               >
                 <Moon size={14} />
               </button>
             </div>
          </div>

          <div className="flex items-center justify-between px-2 bg-white dark:bg-graphite-950/50 rounded-xl p-1.5 border border-graphite-200 dark:border-graphite-800">
            <div className="flex items-center gap-2 text-xs font-medium text-graphite-500 ml-2">
              <Languages size={14} /> Language
            </div>
            <div className="flex gap-1">
              <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-bronze-neon text-white shadow-sm' : 'text-graphite-400'}`}>EN</button>
              <button onClick={() => setLang('pt')} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'pt' ? 'bg-bronze-neon text-white shadow-sm' : 'text-graphite-400'}`}>PT</button>
            </div>
          </div>

          <Button variant="ghost" className="w-full justify-start text-graphite-500 dark:text-graphite-400 hover:text-bronze-neon dark:hover:text-white" icon={<Settings size={18} />}>
            {t.settings}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white dark:bg-graphite-950/50 transition-colors duration-500">
        <div className="h-16 border-b border-graphite-200 dark:border-graphite-800 flex items-center justify-between px-6 bg-white/80 dark:bg-graphite-950/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-2 text-graphite-500 hover:bg-graphite-100 dark:hover:bg-graphite-800 rounded-lg transition-colors`}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-bronze-neon">
              <MessageSquare size={18} />
              <span className="text-sm font-bold uppercase tracking-widest">{t.modeAssistant}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl bg-graphite-100 dark:bg-graphite-900 text-graphite-600 dark:text-graphite-400 hover:text-bronze-neon transition-all border border-graphite-200 dark:border-graphite-800 shadow-sm active:scale-95"
              title={theme === 'dark' ? t.themeLight : t.themeDark}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Button variant="ghost" size="sm" icon={<Bookmark size={16} />} className="hidden sm:inline-flex">Save</Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Previews Overlay */}
          <div className="absolute top-6 right-6 z-30 flex flex-col gap-4 items-end pointer-events-none">
            {/* Image Preview */}
            <div className={`w-64 aspect-square pointer-events-auto transition-all duration-700 ${(activePreviewImage || isPreviewLoading) ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <div className="relative w-full h-full bg-white/70 dark:bg-graphite-900/40 backdrop-blur-xl border border-graphite-200 dark:border-graphite-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 bg-white/50 dark:bg-graphite-900/60 border-b border-graphite-200 dark:border-graphite-800">
                  <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12} className="text-bronze-neon" /> Visual
                  </span>
                  {activePreviewImage && <button onClick={() => window.open(activePreviewImage, '_blank')} className="text-graphite-400 hover:text-bronze-neon transition-colors"><Maximize2 size={12} /></button>}
                </div>
                <div className="flex-1 relative flex items-center justify-center bg-graphite-50 dark:bg-graphite-950/50">
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center gap-2"><Loader2 size={24} className="animate-spin text-bronze-neon" /></div>
                  ) : activePreviewImage ? (
                    <img src={activePreviewImage} alt="Preview" className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" />
                  ) : (
                    <ImageIcon size={32} className="text-graphite-200 dark:text-graphite-800" strokeWidth={1} />
                  )}
                </div>
              </div>
            </div>

            {/* Audio Preview */}
            {(activePreviewAudio || isAudioLoading) && (
              <div className="w-64 pointer-events-auto animate-in slide-in-from-right duration-500">
                <div className="bg-white/70 dark:bg-graphite-900/40 backdrop-blur-xl border border-graphite-200 dark:border-graphite-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-widest flex items-center gap-2">
                      <Volume2 size={12} className="text-bronze-neon" /> Audio
                    </span>
                    {isAudioLoading && <Loader2 size={12} className="animate-spin text-bronze-neon" />}
                  </div>
                  {activePreviewAudio && !isAudioLoading && (
                    <audio controls className="w-full h-8 grayscale contrast-125 brightness-110">
                      <source src={activePreviewAudio} />
                    </audio>
                  )}
                </div>
              </div>
            )}

            {/* Video Preview */}
            {(activePreviewVideo || isVideoLoading) && (
              <div className="w-64 pointer-events-auto animate-in slide-in-from-right duration-500">
                <div className="bg-white/70 dark:bg-graphite-900/40 backdrop-blur-xl border border-graphite-200 dark:border-graphite-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/50 dark:bg-graphite-900/60 border-b border-graphite-200 dark:border-graphite-800">
                    <span className="text-[10px] font-bold text-graphite-500 uppercase tracking-widest flex items-center gap-2">
                      <Video size={12} className="text-red-500" /> Motion
                    </span>
                    {isVideoLoading && <Loader2 size={12} className="animate-spin text-red-500" />}
                  </div>
                  <div className="aspect-video bg-graphite-50 dark:bg-graphite-950 flex items-center justify-center">
                     {isVideoLoading ? (
                       <span className="text-[10px] text-graphite-400 font-bold animate-pulse uppercase tracking-tighter">Rendering...</span>
                     ) : activePreviewVideo && (
                       <video src={activePreviewVideo} controls autoPlay loop className="w-full h-full object-contain" />
                     )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pt-12 pb-48 px-6 custom-scrollbar flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">
              {messages.length === 0 && (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8 opacity-20 dark:opacity-30">
                  <div className="w-24 h-24 bg-graphite-100 dark:bg-graphite-900 rounded-[2.5rem] flex items-center justify-center border border-graphite-200 dark:border-graphite-800 shadow-xl">
                    <MessageSquare size={48} className="text-bronze-neon" />
                  </div>
                  <p className="text-2xl font-semibold max-w-sm text-graphite-900 dark:text-white leading-tight">{t.chatPlaceholder}</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[88%] rounded-[2rem] p-6 shadow-xl transition-all ${
                    msg.role === 'user' 
                      ? 'bg-bronze-neon text-white shadow-bronze-neon/20' 
                      : 'bg-graphite-100 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 text-graphite-900 dark:text-graphite-200 shadow-black/5 dark:shadow-none'
                  }`}>
                    {msg.role === 'user' && msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-white/20 dark:border-white/10">
                        {msg.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white/20 dark:bg-bronze-neon/30 rounded-xl px-3 py-1.5 border border-white/10">
                            {getFileIcon(file.mimeType)}
                            <span className="text-[10px] font-bold tracking-tight text-white">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-slate dark:prose-invert prose-sm leading-relaxed text-lg whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-graphite-100 dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 rounded-3xl p-5 flex gap-2 shadow-md">
                    <div className="w-1.5 h-1.5 bg-bronze-neon rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-bronze-neon rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-bronze-neon rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6 z-40">
            <div className="w-full max-w-3xl flex flex-col gap-4">
              {assistantFiles.length > 0 && (
                <div className="flex flex-wrap gap-3 animate-in slide-in-from-bottom-4">
                  {assistantFiles.map((file, idx) => (
                    <div key={idx} className="relative group bg-white dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 rounded-2xl p-2 pr-8 shadow-xl">
                      <div className="flex items-center gap-2">
                         {file.mimeType.startsWith('image/') ? (
                           <img src={`data:${file.mimeType};base64,${file.data}`} className="w-10 h-10 rounded-lg object-cover" />
                         ) : getFileIcon(file.mimeType)}
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-graphite-900 dark:text-graphite-200 max-w-[80px] truncate">{file.name}</span>
                           <span className="text-[8px] text-graphite-500 uppercase font-black">{file.mimeType.split('/')[1]}</span>
                         </div>
                      </div>
                      <button onClick={() => removeFile(idx)} className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-red-500 p-1"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-bronze-neon to-bronze-metallic rounded-[2.5rem] blur opacity-10 dark:opacity-20 group-focus-within:opacity-20 dark:group-focus-within:opacity-40 transition duration-500"></div>
                <div className="relative flex items-center bg-white dark:bg-graphite-900 border border-graphite-200 dark:border-graphite-800 rounded-[2rem] p-2 pl-4 shadow-2xl transition-all duration-300">
                  <input type="file" ref={assistantFileInputRef} className="hidden" multiple accept="image/*,audio/*,video/*" onChange={handleFileUpload} />
                  <button onClick={() => assistantFileInputRef.current?.click()} className="p-3 text-graphite-400 dark:text-graphite-500 hover:text-bronze-neon transition-all hover:scale-110">
                    <Paperclip size={24} />
                  </button>
                  <input 
                    type="text" 
                    placeholder={t.chatPlaceholder} 
                    className="flex-1 bg-transparent border-none outline-none text-graphite-900 dark:text-graphite-100 placeholder:text-graphite-400 dark:placeholder:text-graphite-600 py-4 px-3 text-lg"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button variant="primary" size="lg" className="w-14 h-14 rounded-[1.5rem] shadow-bronze-neon/30" onClick={handleSendMessage} disabled={isTyping || (!inputMessage.trim() && assistantFiles.length === 0)} icon={<Send size={24} />} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="h-12 flex items-center justify-center opacity-30 dark:opacity-20 text-[10px] uppercase tracking-[0.5em] font-black pointer-events-none text-graphite-900 dark:text-graphite-200">{t.footerTag}</footer>
      </main>
    </div>
  );
};

export default App;