
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Decoding Helpers for Live API - Raw PCM Stream Decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface AIDesignStudioProps {
  onApplyPattern?: (imageUrl: string) => void;
  onTranscriptionComplete?: (text: string) => void;
}

const AIDesignStudio: React.FC<AIDesignStudioProps> = ({ onApplyPattern, onTranscriptionComplete }) => {
  const [activeTab, setActiveTab] = useState<'creative' | 'patterns' | 'live' | 'assistant' | 'tools' | 'meeting'>('creative');
  const [loading, setLoading] = useState(false);
  
  // Image Generation/Editing State
  const [genPrompt, setGenPrompt] = useState('');
  const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [genResult, setGenResult] = useState<string | null>(null);
  const [editImage, setEditImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fabric Pattern State
  const [patternPrompt, setPatternPrompt] = useState('');
  const [patternResult, setPatternResult] = useState<string | null>(null);

  // Chat / Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Live API / Audio State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Transcription State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fast Response State
  const [fastInput, setFastInput] = useState('');
  const [fastOutput, setFastOutput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setEditImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (mode: 'generate' | 'edit' | 'pattern') => {
    setLoading(true);
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let response;
      if (mode === 'generate') {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: `A professional tailored high fashion suit: ${genPrompt}` }] },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: genSize } }
        });
      } else if (mode === 'pattern') {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: `A ultra-high-resolution, close-up macro texture visualization of a premium fabric pattern for high-end tailoring. Style: ${patternPrompt}. Focus on realistic weave structures, thread detail, and fabric sheen.` }] },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: genSize } }
        });
      } else {
        if (!editImage) return;
        const base64Data = editImage.split(',')[1];
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: 'image/png' } },
              { text: genPrompt || "Add professional lighting and enhance detail" }
            ]
          }
        });
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const resultUrl = `data:image/png;base64,${part.inlineData.data}`;
            if (mode === 'pattern') setPatternResult(resultUrl);
            else setGenResult(resultUrl);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found.")) {
        await (window as any).aistudio.openSelectKey();
      }
      alert("AI Processing failed.");
    } finally {
      setLoading(false);
    }
  };

  const askAssistant = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsThinking(true);
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userMsg,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          systemInstruction: 'You are an advanced AI tailoring consultant.'
        }
      });
      setChatLog(prev => [...prev, { role: 'ai', text: response.text || 'No response.' }]);
    } catch (e: any) {
      console.error(e);
      setChatLog(prev => [...prev, { role: 'ai', text: "Error: Failed to process request." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const fastAdvice = async () => {
    if (!fastInput.trim()) return;
    setLoading(true);
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: `Quick advice: ${fastInput}`,
        config: { systemInstruction: "Concise tailoring context only." }
      });
      setFastOutput(response.text || "No advice found.");
    } catch (e: any) {
      setFastOutput("Error fetching quick advice.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTranscription = async () => {
    if (isTranscribing) {
      mediaRecorderRef.current?.stop();
      setIsTranscribing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const base64Audio = await blobToBase64(audioBlob);
          setLoading(true);
          try {
            if (!(await (window as any).aistudio.hasSelectedApiKey())) {
              await (window as any).aistudio.openSelectKey();
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let promptText = "Transcribe this audio precisely. Return only the transcription text. If it is a long conversation, format it with bullet points.";
            if (activeTab === 'meeting') {
                promptText = "Transcribe this meeting audio. Then reorganize the content into a structured meeting report with two capitalized headings: 'ACTIONABLE ITEMS' and 'IMPORTANT & SPECIFIC POINTS'. Use bullet points for each section. Ensure the points are concise and professional. Do not include conversational filler.";
            }

            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: {
                parts: [
                  { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
                  { text: promptText }
                ]
              }
            });
            const text = response.text || "";
            setTranscriptionText(text);
            if (text && onTranscriptionComplete) {
              onTranscriptionComplete(text);
            }
          } catch (err: any) {
            console.error(err);
            setTranscriptionText("AI Transcription error.");
          } finally {
            setLoading(false);
          }
        };
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsTranscribing(true);
      } catch (e) {
        alert("Microphone required.");
      }
    }
  };

  const recipient = "alamnaji@gmail.com";
  const subject = "Meeting Notes - Actionable Items";
  
  // Calculate link dynamically
  const getMailtoLink = () => {
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(transcriptionText);
      return `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  const fullMailtoLink = getMailtoLink();
  // Standard browsers limit mailto links around 2000 chars. 
  // If notes are long, we need the clipboard fallback.
  const isLongEmail = fullMailtoLink.length > 2000;

  const handleEmailClick = (e: React.MouseEvent) => {
    if (isLongEmail) {
      e.preventDefault();
      if (confirm("The notes are too long for a direct link. Copy notes to clipboard and open email draft?")) {
        navigator.clipboard.writeText(transcriptionText).then(() => {
          // Open email with just subject
          window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}`;
        }).catch(err => {
          console.error("Clipboard copy failed", err);
          alert("Could not copy to clipboard. Please manually copy the text.");
        });
      }
    }
  };

  const startLiveAssistant = async () => {
    try {
      if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: (e) => console.error(e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are a professional tailoring consultant.'
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (e: any) {
      alert("Microphone required for Live mode.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden min-h-[700px] flex flex-col font-sans">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight">
              <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i> 
              AI DESIGN STUDIO
            </h2>
            <p className="text-purple-200 font-bold text-xs uppercase tracking-[0.2em] mt-2 opacity-80">
              Gemini Nano & Pro Powered Intelligence
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
            {activeTab} Mode Active
          </div>
        </div>
        
        <div className="flex gap-2 mt-10 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'creative', icon: 'fa-palette', label: 'Design' },
            { id: 'patterns', icon: 'fa-vector-square', label: 'Fabric patterns' },
            { id: 'meeting', icon: 'fa-handshake', label: 'Meeting Notes' },
            { id: 'live', icon: 'fa-microphone-lines', label: 'Live API' },
            { id: 'assistant', icon: 'fa-brain', label: 'Assistant' },
            { id: 'tools', icon: 'fa-toolbox', label: 'AI Tools' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${activeTab === tab.id ? 'bg-white text-indigo-950 scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
        {activeTab === 'creative' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                  <i className="fa-solid fa-camera-retro text-purple-600"></i> Visual Engine
                </h3>
                
                <div className="mb-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reference Image (Optional for Edit)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-all bg-slate-50/50 h-32 flex flex-col items-center justify-center"
                  >
                    {editImage ? (
                      <img src={editImage} className="h-full w-auto object-contain rounded-lg shadow-sm" alt="Preview" />
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up text-slate-300 text-2xl mb-2"></i>
                        <span className="text-xs font-bold text-slate-400">Click to upload base design</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">AI Prompt</label>
                  <textarea 
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="Describe textures, lighting, or specific style changes..."
                    className="w-full p-5 rounded-2xl border border-slate-200 min-h-[140px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium text-slate-700 bg-white"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <select 
                    value={genSize} 
                    onChange={(e) => setGenSize(e.target.value as any)}
                    className="bg-slate-100 border-none px-4 py-3 rounded-xl font-bold text-xs outline-none"
                  >
                    <option value="1K">1K Quality</option>
                    <option value="2K">2K Quality (Pro)</option>
                    <option value="4K">4K Quality (Pro)</option>
                  </select>
                  <button 
                    onClick={() => processImage(editImage ? 'edit' : 'generate')}
                    disabled={loading || (!genPrompt && !editImage)}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-magic"></i>}
                    {editImage ? 'EDIT IMAGE (FLASH)' : 'GENERATE (PRO)'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {genResult ? (
                <div className="relative group rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl animate-in zoom-in-95 duration-700 aspect-square bg-white">
                  <img src={genResult} alt="AI Result" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                     <a href={genResult} download="tailored_suit.png" className="bg-white text-indigo-900 w-14 h-14 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform"><i className="fa-solid fa-download"></i></a>
                     <button className="bg-white text-indigo-900 w-14 h-14 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform"><i className="fa-solid fa-share-nodes"></i></button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                  <i className="fa-solid fa-shirt text-8xl mb-6 opacity-10"></i>
                  <p className="font-black text-sm uppercase tracking-widest opacity-40">Ready for visualization</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                  <i className="fa-solid fa-vector-square text-purple-600"></i> AI Fabric Pattern Generator
                </h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Describe a unique fabric texture.
                </p>

                <div className="mb-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pattern Description</label>
                  <textarea 
                    value={patternPrompt}
                    onChange={(e) => setPatternPrompt(e.target.value)}
                    placeholder="e.g., 'Subtle geometric wool weave'..."
                    className="w-full p-5 rounded-2xl border border-slate-200 min-h-[140px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium text-slate-700 bg-white"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <select 
                    value={genSize} 
                    onChange={(e) => setGenSize(e.target.value as any)}
                    className="bg-slate-100 border-none px-4 py-3 rounded-xl font-bold text-xs outline-none"
                  >
                    <option value="1K">1K Texture</option>
                    <option value="2K">2K Texture</option>
                    <option value="4K">4K Texture</option>
                  </select>
                  <button 
                    onClick={() => processImage('pattern')}
                    disabled={loading || !patternPrompt}
                    className="flex-1 bg-purple-600 text-white py-4 rounded-xl font-black hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>}
                    GENERATE PATTERN
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {patternResult ? (
                <div className="relative group rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl animate-in zoom-in-95 duration-700 aspect-square bg-white">
                  <img src={patternResult} alt="Fabric Pattern" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-purple-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                     <a href={patternResult} download="fabric_pattern.png" className="bg-white text-purple-900 w-14 h-14 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform"><i className="fa-solid fa-download"></i></a>
                     <button 
                        onClick={() => onApplyPattern?.(patternResult)}
                        className="bg-white text-purple-900 px-6 py-3 rounded-xl font-black text-xs hover:scale-105 transition-transform uppercase tracking-widest"
                     >
                        Apply to Order
                     </button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                  <i className="fa-solid fa-microscope text-8xl mb-6 opacity-10"></i>
                  <p className="font-black text-sm uppercase tracking-widest opacity-40">Macro fabric engine</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'meeting' && (
          <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">Meeting Notes Recorder</h3>
               <p className="text-slate-500 font-medium">Record your client consultation. We'll transcribe and structure the conversation into Actionable Items and Important Points.</p>
            </div>
            
            <div className="bg-white rounded-[3rem] p-10 border shadow-xl text-center">
                <div className="relative inline-block">
                    {isTranscribing && (
                        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25 scale-150"></span>
                    )}
                    <button 
                        onClick={toggleTranscription}
                        className={`relative w-40 h-40 rounded-full flex items-center justify-center text-5xl shadow-2xl transition-all hover:scale-105 ${isTranscribing ? 'bg-red-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                    >
                        {loading ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                        ) : (
                            <i className={`fa-solid ${isTranscribing ? 'fa-stop' : 'fa-microphone'}`}></i>
                        )}
                    </button>
                </div>
                
                <div className="mt-8 space-y-2">
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400">
                        {isTranscribing ? 'Recording in progress...' : loading ? 'Processing Transcription...' : 'Tap to Record'}
                    </div>
                    {isTranscribing && <div className="text-red-500 text-xs font-bold animate-pulse">● LIVE</div>}
                </div>
            </div>

            {transcriptionText && !isTranscribing && !loading && (
                <div className="bg-green-50 border border-green-200 p-6 rounded-2xl animate-in slide-in-from-bottom-4 space-y-4">
                    <div className="flex items-center justify-between text-green-800 font-bold mb-2">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-check-circle text-xl"></i>
                            <span>Successfully Synced to Order Notes</span>
                        </div>
                    </div>
                    <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-green-100 max-h-60 overflow-y-auto whitespace-pre-wrap">
                        {transcriptionText}
                    </div>
                    
                    <a 
                        href={isLongEmail ? "#" : fullMailtoLink}
                        onClick={handleEmailClick}
                        target={isLongEmail ? undefined : "_blank"}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
                    >
                        <i className="fa-solid fa-envelope"></i> Email Report to {recipient}
                    </a>
                </div>
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="max-w-xl mx-auto text-center space-y-12 py-16">
            <div className={`w-52 h-52 mx-auto rounded-full flex items-center justify-center border-8 transition-all duration-1000 ${isLiveActive ? 'border-purple-500 bg-purple-50 scale-110 shadow-[0_0_80px_rgba(147,51,234,0.4)]' : 'border-slate-100 bg-white shadow-sm'}`}>
              <i className={`fa-solid fa-microphone-lines text-7xl ${isLiveActive ? 'text-purple-600 animate-pulse' : 'text-slate-200'}`}></i>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Real-time Voice Advisor</h3>
              <p className="text-slate-500 font-medium mt-3 text-lg">Seamless conversation powered by Gemini 2.5 Native Audio.</p>
            </div>
            <div className="flex justify-center gap-6">
              {!isLiveActive ? (
                <button 
                  onClick={startLiveAssistant}
                  className="bg-indigo-600 text-white px-14 py-5 rounded-[2rem] font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                >
                  ACTIVATE ASSISTANT
                </button>
              ) : (
                <button 
                  onClick={() => liveSessionRef.current?.close()}
                  className="bg-red-500 text-white px-14 py-5 rounded-[2rem] font-black text-xl hover:bg-red-600 shadow-2xl shadow-red-100 hover:scale-105 transition-all"
                >
                  DISCONNECT
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="max-w-4xl mx-auto h-[600px] flex flex-col gap-6">
            <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-8 overflow-y-auto space-y-6 shadow-sm">
              {chatLog.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 italic">
                  <i className="fa-solid fa-brain-circuit text-7xl mb-6"></i>
                  <p className="font-black text-lg uppercase tracking-widest">Intelligence Online</p>
                </div>
              )}
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] font-medium text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100 shadow-lg' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-purple-50 text-purple-700 px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-purple-100">
                    <i className="fa-solid fa-microchip animate-spin"></i> Reasoning...
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-xl">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAssistant()}
                placeholder="Ask about design, materials, or fit logic..."
                className="flex-1 p-4 outline-none font-medium text-slate-700 bg-transparent"
              />
              <button 
                onClick={askAssistant}
                disabled={!chatInput.trim()}
                className="bg-indigo-600 text-white w-16 h-16 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center text-xl"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <i className="fa-solid fa-bolt text-yellow-500"></i> Fast Advice
              </h3>
              <div className="flex gap-2">
                <input 
                  value={fastInput} 
                  onChange={e => setFastInput(e.target.value)}
                  placeholder="Ask a quick styling tip..."
                  className="flex-1 bg-slate-50 border p-4 rounded-xl outline-none text-sm font-medium"
                />
                <button onClick={fastAdvice} className="bg-slate-900 text-white px-6 rounded-xl hover:bg-black font-black text-xs">GO</button>
              </div>
              {fastOutput && (
                <div className="mt-4 p-5 bg-yellow-50/50 border border-yellow-100 rounded-xl text-sm font-bold text-slate-700 animate-in slide-in-from-top-2">
                  {fastOutput}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <i className="fa-solid fa-file-audio text-purple-600"></i> Transcription
              </h3>
              <div className="relative">
                {isTranscribing && (
                    <span className="absolute inset-0 rounded-2xl bg-purple-400 animate-ping opacity-25"></span>
                )}
                <button 
                    onClick={toggleTranscription}
                    className={`relative w-full py-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${isTranscribing ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'}`}
                >
                    <i className={`fa-solid ${isTranscribing ? 'fa-microphone-lines animate-bounce' : 'fa-microphone'} text-3xl ${isTranscribing ? 'text-purple-600' : 'text-slate-300'}`}></i>
                    <span className={`text-xs font-black uppercase tracking-widest ${isTranscribing ? 'text-purple-600' : 'text-slate-400'}`}>
                    {isTranscribing ? 'Listening...' : 'Transcribe Voice Memo'}
                    </span>
                </button>
              </div>
              {transcriptionText && (
                <div className="mt-4 p-5 bg-white border rounded-xl font-medium text-slate-700 animate-in fade-in">
                  <div className="text-[10px] font-black text-slate-300 uppercase mb-2">Result</div>
                  {transcriptionText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDesignStudio;
