import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileText,
  HelpCircle,
  FolderPlus,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Calendar,
  Layers,
  Info,
  DollarSign,
  Mic,
  MicOff,
  Volume2,
  Globe,
  X,
} from 'lucide-react';
import api from '../services/api';

export default function CaseStoryIntake({ user, onOpenAuth, onCaseCreated }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Namaste! I am the Legal Nexus AI Assistant. Tell me your legal dispute in your own words in English, हिन्दी (Hindi), or Hinglish.\n\nI will extract structured case facts, verify applicable Indian statutory provisions, audit necessary evidence, and prepare your formal case dossier.',
    },
  ]);
  const [inputStory, setInputStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  const messagesEndRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Floating Voice Assistant State (Bottom Right)
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);

  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;

      recog.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentText);
        setInputStory(currentText);
      };

      recog.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, []);

  const sampleStarters = [
    {
      label: '💼 Unpaid Salary',
      text: 'Employer withheld 3 months salary of 1.5 lakhs in Delhi without notice.',
    },
    {
      label: '🏠 Security Deposit',
      text: 'Landlord refused to return 50000 security deposit after I vacated the flat.',
    },
    {
      label: '🛡️ UPI Cyber Fraud',
      text: 'Lost 45000 in online UPI phishing fraud after a fake bank KYC call.',
    },
    {
      label: '🛍️ Counterfeit Product',
      text: 'Flipkart seller delivered a fake duplicate phone and refused refund.',
    },
  ];

  const handleSendMessage = async (textToSend = inputStory) => {
    if (!textToSend.trim()) return;

    if (!user) {
      onOpenAuth();
      return;
    }

    const userMsg = { sender: 'user', text: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputStory('');
    setVoiceTranscript('');
    setLoading(true);

    try {
      // 1. Analyze case narrative via AI Engine
      const res = await api.post('/ai/analyze', {
        story: textToSend,
        existingCase: analysisResult?.case || null,
        conversationHistory: updatedMessages,
      });

      const data = res.data.data;
      if (data.case?.status === 'BLOCKED' || data.blocked || data.guardrailWarning || data.case?.caseNumber === 'BLOCKED-SECURITY') {
        setAnalysisResult(null);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            isWarning: true,
            title: '⚠️ Guardrail Warning: Query Blocked',
            category: data.issue || 'Security Policy Violation',
            text: data.responseExplanation || 'This platform strictly prohibits queries seeking assistance with illegal acts or evading law enforcement.',
            guidance: 'Legal Nexus is dedicated to lawful legal intelligence and citizen protection. Requests seeking help with crimes or evading statutory penalties are strictly refused.',
          },
        ]);
        return;
      }

      setAnalysisResult(data);

      // 2. Add assistant response to conversation
      const assistantText =
        data.responseExplanation ||
        data.reply ||
        'I have analyzed your statement and updated your structured case details with statutory references.';
      const assistantMsg = {
        sender: 'assistant',
        text: assistantText,
        clarifyingQuestions: data.intake?.clarifyingQuestions || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if (err.response?.data?.guardrailWarning) {
        const warningData = err.response.data.warning || {};
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            isWarning: true,
            title: err.response.data.message || '⚠️ Guardrail Warning: Query Blocked',
            category: warningData.categoryLabel || warningData.category || 'Security Policy Violation',
            incidentId: warningData.incidentId,
            text: warningData.detail || 'This query was flagged by the platform guardrail layer.',
            guidance:
              warningData.guidance ||
              'If you are seeking legal protection as a victim, please rephrase your query.',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text:
              err.response?.data?.message ||
              'Sorry, I encountered an issue analyzing your case. Please try again.',
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFormalCase = async () => {
    if (!analysisResult?.case || !user || successNotice) {
      if (!user) onOpenAuth();
      return;
    }

    setCreatingCase(true);
    try {
      const res = await api.post('/ai/intake-to-case', {
        structuredCase: analysisResult.case,
        intakeNarrative: messages
          .filter((m) => m.sender === 'user')
          .map((m) => m.text)
          .join('\n\n'),
      });
      setSuccessNotice(`Case ${res.data.data.caseNumber} formally recorded in the database!`);
      if (onCaseCreated) {
        onCaseCreated(res.data.data);
      }
    } catch (err) {
      alert('Failed to register formal case. Please try again.');
    } finally {
      setCreatingCase(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognition) recognition.stop();
      setIsRecording(false);
    } else {
      setVoiceTranscript('');
      setIsRecording(true);
      if (recognition) {
        recognition.lang = voiceLang;
        try {
          recognition.start();
        } catch {
          simulateVoiceInput();
        }
      } else {
        simulateVoiceInput();
      }
    }
  };

  const simulateVoiceInput = async () => {
    setIsRecording(true);
    setVoiceTranscript('Simulating voice input...');
    try {
      const res = await api.post('/ai/voice/transcribe', {
        language: voiceLang,
        simulatedText:
          voiceLang === 'hi-IN'
            ? 'Mere boss ne 3 mahine se salary nahi di, 150000 rupaye pending hai in Delhi.'
            : 'My employer withheld 3 months salary of 1.5 lakhs in Delhi without notice.',
      });
      setTimeout(() => {
        const text = res.data.data?.transcript || '';
        setVoiceTranscript(text);
        setInputStory(text);
        setIsRecording(false);
      }, 1200);
    } catch {
      setIsRecording(false);
      setVoiceTranscript('Simulated connection failed.');
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getUrgencyBadge = (urgency) => {
    if (!urgency) return null;
    const level = urgency.urgencyLevel || urgency;
    if (level === 'URGENT_ASSISTANCE' || level === 'HIGH' || level === 'CRITICAL') {
      return (
        <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Urgent Attention
        </span>
      );
    }
    if (level === 'ATTENTION_RECOMMENDED' || level === 'MEDIUM') {
      return (
        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Attention Recommended
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        General Guidance
      </span>
    );
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Center Chatbot Column (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden min-h-[640px]">
          {/* Assistant Header */}
          <div className="bg-[#0B1F33] text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center text-white shadow-md shadow-legal-blue/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Legal Nexus AI Assistant
                  <span className="text-[10px] bg-legal-blue/20 text-sky-300 px-2 py-0.5 rounded-full border border-legal-blue/30 font-semibold">
                    Multi-Agent Reasoning
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Continuous fact extraction & grounded statutory legal reasoning
                </p>
              </div>
            </div>

            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-legal-gold font-semibold bg-legal-gold/10 px-2.5 py-1 rounded-full border border-legal-gold/20">
              <Sparkles className="w-3.5 h-3.5" />
              AI Grounding
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[520px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-navy-50 text-legal-blue border border-navy-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4 text-legal-blue" />
                  </div>
                )}

                {/* USER MESSAGES: Clean Royal Blue Box with Crisp White Text */}
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-md font-medium'
                      : m.isWarning
                      ? 'bg-red-50 text-red-950 border-2 border-red-300 rounded-tl-sm shadow-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/90 rounded-tl-sm shadow-subtle'
                  }`}
                >
                  {m.isWarning ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-red-200 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-red-700 text-xs sm:text-sm">
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{m.title}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {m.category}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-red-900 leading-relaxed font-medium">{m.text}</p>

                      <div className="bg-white/80 p-3 rounded-xl border border-red-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-red-900 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-red-600" />
                          Lawful Guidance & Victim Redirection:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{m.guidance}</p>
                      </div>

                      {m.incidentId && (
                        <div className="text-[10px] text-red-600/80 font-mono pt-1">
                          Incident Reference ID: {m.incidentId}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 leading-relaxed">
                      {(m.text || '').split('\n').map((line, lineIdx) => {
                        if (!line.trim()) return <div key={lineIdx} className="h-1" />;
                        if (m.sender === 'user') {
                          return <p key={lineIdx} className="text-white font-medium">{line}</p>;
                        }
                        if (line.startsWith('### ')) {
                          return (
                            <h4 key={lineIdx} className="font-bold text-slate-900 text-xs sm:text-sm pt-2 pb-0.5 flex items-center gap-1.5">
                              {line.replace('### ', '')}
                            </h4>
                          );
                        }
                        const formattedHTML = line
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>')
                          .replace(/`([^`]+)`/g, '<code class="bg-blue-50 text-legal-blue px-1 py-0.5 rounded text-[11px] font-mono border border-blue-100">$1</code>');

                        if (line.startsWith('• ') || line.startsWith('- ')) {
                          return (
                            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
                              <span className="text-legal-blue font-bold shrink-0">•</span>
                              <span className="text-slate-800" dangerouslySetInnerHTML={{ __html: formattedHTML.slice(2) }} />
                            </div>
                          );
                        }
                        if (line.trim().startsWith('└')) {
                          return (
                            <div key={lineIdx} className="pl-4 text-[11px] text-slate-600 italic" dangerouslySetInnerHTML={{ __html: formattedHTML }} />
                          );
                        }
                        return (
                          <p key={lineIdx} className="text-slate-800" dangerouslySetInnerHTML={{ __html: formattedHTML }} />
                        );
                      })}
                    </div>
                  )}

                  {/* Clarifying Questions Quick Chips */}
                  {m.clarifyingQuestions && m.clarifyingQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-legal-blue" />
                        Key Clarifying Questions (Click to Answer):
                      </span>
                      <div className="flex flex-col gap-2">
                        {m.clarifyingQuestions.map((q, idx) => (
                          <div key={idx} className="space-y-1.5 p-2.5 bg-white/90 rounded-2xl border border-slate-200 shadow-subtle">
                            <button
                              type="button"
                              onClick={() => {
                                setInputStory(`Answering: ${q} — `);
                                setTimeout(() => textareaRef.current?.focus(), 50);
                              }}
                              className="text-left font-semibold text-slate-800 hover:text-legal-blue text-xs flex items-start gap-1.5 w-full transition"
                            >
                              <span className="text-legal-blue font-bold">→</span>
                              <span>{q}</span>
                            </button>
                            
                            {/* Suggested Quick Response Pills */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {/* Criminal Law Quick Replies */}
                              {q.includes('FIR') || q.includes('Police Complaint') ? (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('Yes, an FIR has been formally registered at the local police station and investigation is ongoing.')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-lg text-[11px] border border-emerald-200 transition">
                                    ⚡ FIR Registered (Have Copy)
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('I have submitted a written police complaint, but FIR registration is pending.')} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium rounded-lg text-[11px] border border-amber-200 transition">
                                    ⚡ Complaint Given, FIR Pending
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('The police station refused to register the FIR, need escalation to SP / DCP.')} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 font-medium rounded-lg text-[11px] border border-red-200 transition">
                                    ⚡ Police Refused FIR
                                  </button>
                                </>
                              ) : null}

                              {q.includes('Medico-Legal') || q.includes('MLC') || q.includes('injuries') ? (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('Yes, Medico-Legal Examination (MLC) was completed at the government hospital recording all injuries.')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-lg text-[11px] border border-emerald-200 transition">
                                    ⚡ MLC Completed at Govt Hospital
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('No physical injury occurred, only verbal threat / attempt without bodily injury.')} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-[11px] border border-slate-200 transition">
                                    ⚡ No Physical Injury / Threat Only
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('Victim is currently undergoing medical examination and treatment.')} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-legal-blue font-medium rounded-lg text-[11px] border border-blue-200 transition">
                                    ⚡ Undergoing Treatment Now
                                  </button>
                                </>
                              ) : null}

                              {q.includes('CCTV') || q.includes('eyewitness') || q.includes('weapon') ? (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('Yes, there is clear CCTV footage of the incident and multiple eyewitness statements available.')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-lg text-[11px] border border-emerald-200 transition">
                                    ⚡ Have CCTV & Eyewitness Statements
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('I have recorded threat audio calls and WhatsApp messages as proof.')} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-legal-blue font-medium rounded-lg text-[11px] border border-blue-200 transition">
                                    ⚡ Have Threat Call / Audio Proof
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('The weapon of offense was seized by investigating police officers.')} className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium rounded-lg text-[11px] border border-purple-200 transition">
                                    ⚡ Weapon Seized by Police
                                  </button>
                                </>
                              ) : null}

                              {/* Employment Law Quick Replies */}
                              {q.includes('month') && (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('3 months salary withheld, did not receive any written termination notice.')} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-legal-blue font-medium rounded-lg text-[11px] border border-blue-200 transition">
                                    ⚡ 3 Months, No Notice
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('2 months salary pending, received verbal notice only.')} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-[11px] border border-slate-200 transition">
                                    ⚡ 2 Months, Verbal Only
                                  </button>
                                </>
                              )}
                              {(q.includes('contract') || q.includes('appointment') || q.includes('slips')) && !q.includes('marriage') ? (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('Yes, I have both my official appointment letter and bank statements showing past salary credits.')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-lg text-[11px] border border-emerald-200 transition">
                                    ⚡ Yes, Have Contract & Bank Statements
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('I have bank statements showing past credits, but no formal contract copy.')} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-[11px] border border-slate-200 transition">
                                    ⚡ Bank Statements Only
                                  </button>
                                </>
                              ) : null}
                              {q.includes('HR') || q.includes('email') || q.includes('Management') ? (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('Yes, I sent multiple follow-up emails to HR and management demanding payment, but received no response.')} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-legal-blue font-medium rounded-lg text-[11px] border border-blue-200 transition">
                                    ⚡ Emailed HR, No Reply
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('HR rejected my request citing company policy.')} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-[11px] border border-slate-200 transition">
                                    ⚡ HR Rejected Request
                                  </button>
                                </>
                              ) : null}

                              {/* Cyber / Banking / Tenancy Quick Replies */}
                              {q.includes('1930') || q.includes('dispute token') ? (
                                <>
                                  <button type="button" onClick={() => handleSendMessage('Yes, registered complaint on 1930 Cyber Helpline and have dispute reference number.')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-lg text-[11px] border border-emerald-200 transition">
                                    ⚡ Have 1930 Dispute Token
                                  </button>
                                  <button type="button" onClick={() => handleSendMessage('Not called 1930 yet, calling right now.')} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium rounded-lg text-[11px] border border-amber-200 transition">
                                    ⚡ Calling 1930 Now
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 border border-blue-600 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-600 italic p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl w-fit animate-pulse">
                <span className="w-3.5 h-3.5 border-2 border-legal-blue border-t-transparent rounded-full animate-spin"></span>
                <span>Agents executing: Intake → Classification → Case Builder → RAG → Evidence Audit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Story Input Bar & Quick Scenario Starters */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">
                Quick Scenarios:
              </span>
              {sampleStarters.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.text)}
                  className="px-3 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shrink-0 transition shadow-subtle"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputStory}
                onChange={(e) => setInputStory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe your legal situation in English, Hindi, or Hinglish (e.g. 'Mere boss ne salary rok li hai')..."
                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue shadow-subtle resize-none leading-relaxed"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputStory.trim()}
                title="Send narrative"
                className="absolute right-2.5 bottom-2.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
                <span className="text-xs hidden sm:inline">Send</span>
              </button>
            </div>

            {/* Microcopy disclaimer */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
              <Info className="w-3 h-3 text-legal-gold shrink-0" />
              <span>AI-generated information grounded in Indian statutes. Verify important decisions with an advocate.</span>
            </div>
          </div>
        </div>

        {/* Right Structured Case Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {analysisResult ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
              {/* Structured Case Summary Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {analysisResult.case?.caseNumber || 'LN-DRAFT-001'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {analysisResult.case?.issue || 'Structured Legal Dispute'}
                    </h3>
                  </div>
                  {getUrgencyBadge(analysisResult.urgency)}
                </div>

                {/* Category & Jurisdiction */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Legal Domain</span>
                    <span className="font-bold text-slate-800">{analysisResult.case?.category}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jurisdiction</span>
                    <span className="font-bold text-slate-800">{analysisResult.case?.jurisdiction || 'India'}</span>
                  </div>
                </div>

                {/* Financial Claim */}
                {analysisResult.case?.financialDetails?.disputedAmount && (
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Disputed Financial Claim:</span>
                    <span className="font-extrabold text-legal-blue font-mono text-sm">
                      ₹{Number(analysisResult.case.financialDetails.disputedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Grounded Legal Basis - Visible to All Personas */}
                {analysisResult.research?.legalBasis && analysisResult.research.legalBasis.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-legal-blue" />
                      Applicable Indian Laws & Sections:
                    </span>
                    <div className="space-y-1.5">
                      {analysisResult.research.legalBasis.map((prov, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="font-bold text-legal-blue flex items-center justify-between">
                            <span>{prov.act ? `${prov.act} — ${prov.section}` : prov.section}</span>
                          </div>
                          {prov.sectionTitle && <div className="text-slate-700 font-medium text-[11px] mt-0.5">{prov.sectionTitle}</div>}
                          {prov.actionableRemedy && (
                            <div className="text-slate-500 text-[10px] mt-1 italic">
                              <span className="font-semibold text-slate-600">Statutory Remedy:</span> {prov.actionableRemedy}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applicable Charges & Legal Violations */}
                {analysisResult.research?.applicableCharges && analysisResult.research.applicableCharges.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-legal-blue" />
                      Applicable Legal Violations & Charges:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.research.applicableCharges.map((chg, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-blue-50/80 border border-blue-200 text-legal-blue px-2 py-0.5 rounded-lg">
                          {chg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailored Procedural Action Plan */}
                {analysisResult.actionPlan && analysisResult.actionPlan.length > 0 && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Actionable Recommendations & Roadmap:
                    </span>
                    <div className="space-y-2 text-xs">
                      {analysisResult.actionPlan.map((act, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px]">
                          <span className="w-4 h-4 rounded-full bg-legal-blue text-white flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">{act.step}: </span>
                            <span className="text-slate-600">{act.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Checklist */}
                {analysisResult.evidence && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-legal-blue" />
                      Evidence Audit Checklist:
                    </span>
                    <div className="space-y-1 text-xs">
                      {analysisResult.evidence.available?.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span className="truncate">{typeof e === 'string' ? e : e.name}</span>
                        </div>
                      ))}
                      {analysisResult.evidence.missing?.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span className="truncate">Required: {typeof e === 'string' ? e : e.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Convert to Formal Case Button */}
                <button
                  onClick={handleCreateFormalCase}
                  disabled={creatingCase || !!successNotice}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {creatingCase ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 text-amber-300" />
                      <span>Save & Create Formal Case Record</span>
                    </>
                  )}
                </button>

                {successNotice && (
                  <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successNotice}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-subtle text-center text-slate-400 space-y-3 min-h-[420px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-navy-50 text-legal-blue flex items-center justify-center border border-navy-100 shadow-sm">
                <FileText className="w-7 h-7 text-legal-blue" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Live Case Intelligence Dossier</h4>
              <p className="text-xs max-w-xs leading-relaxed text-slate-500">
                As you describe your situation to the assistant, the Case Intelligence Engine will extract facts, verify legal provisions, audit evidence, and display your structured case here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ANIMATED MICROPHONE OPTION (BOTTOM RIGHT) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Floating Voice Assistant Popover */}
        {isVoiceOpen && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 w-80 sm:w-96 space-y-3.5 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-legal-blue rounded-xl">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Voice Assistant</h4>
                  <p className="text-[10px] text-slate-400">Speak in Hindi, English, or Hinglish</p>
                </div>
              </div>
              <button
                onClick={() => setIsVoiceOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                Language:
              </span>
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="bg-white px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200 focus:outline-none"
              >
                <option value="hi-IN">हिन्दी (Hindi / Hinglish)</option>
                <option value="en-IN">English (India)</option>
              </select>
            </div>

            {/* Record Trigger */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <button
                onClick={toggleVoiceRecording}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-600 ring-4 ring-red-200 scale-110'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-md'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5 animate-pulse text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              <span className="text-[11px] font-bold text-slate-700">
                {isRecording ? 'Listening... Speak your case now' : 'Click to Speak'}
              </span>
            </div>

            {voiceTranscript && (
              <div className="p-3 bg-blue-50 text-slate-800 rounded-xl border border-blue-100 text-xs space-y-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Transcript:</span>
                <p className="italic font-medium">"{voiceTranscript}"</p>
                <button
                  onClick={() => {
                    handleSendMessage(voiceTranscript);
                    setIsVoiceOpen(false);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Send to AI Assistant</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating Animated Mic Button */}
        <button
          onClick={() => setIsVoiceOpen(!isVoiceOpen)}
          className="relative group p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ring-4 ring-blue-400/30 cursor-pointer"
          title="Speak to Legal Assistant (Voice)"
        >
          <span className="relative flex items-center gap-2 text-xs font-bold text-white">
            <Mic className="w-6 h-6 text-white" />
            <span className="hidden sm:inline-block pr-1">Speak Case</span>
          </span>
        </button>
      </div>
    </div>
  );
}
