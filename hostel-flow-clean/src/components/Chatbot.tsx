import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Send, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface BookingState {
  intent?: string;
  serviceType?: string;
  date?: string;
  time?: string;
  instructions?: string;
  booked?: boolean;
  completed_service?: boolean;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI booking assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bookingState, setBookingState] = useState<BookingState>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const token = localStorage.getItem('auth_token'); 

  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSpeechEnabled(!speechEnabled);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
  
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
  
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
  
    try {
      const res = await fetch('http://localhost:8000/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_message: content,
          previous_state: bookingState
        })
      });
      const llmResponse = await res.json();
      console.log('AI:', llmResponse);
  
      setBookingState(prev => ({ ...prev, ...llmResponse }));
  
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: llmResponse.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      speakText(botMessage.content);
  
      if (
        llmResponse.intent?.toLowerCase() === 'book' &&
        llmResponse.serviceType &&
        llmResponse.date &&
        llmResponse.time
      ) {
        await createBooking(llmResponse);
      } else if (
        llmResponse.intent?.toLowerCase() === 'book' &&
        llmResponse.serviceType &&
        llmResponse.date &&
        !llmResponse.time
      ) {
        await fetchAvailableSlots(llmResponse.serviceType, llmResponse.date);
      }
  
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, something went wrong. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createBooking = async ({ serviceType, date, time, instructions }: BookingState) => {
    try {
      const res = await fetch(`http://localhost:8000/ai/services/by-name/${encodeURIComponent(serviceType!)}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const service = await res.json();
      const service_id = service.id;
      if (!service_id) {
        console.error('Unknown service type:', serviceType);
        return;
      }
  
      await fetch('http://localhost:8000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: 30, // Replace with actual logged-in user ID
          service_id,
          date,
          time_slot: time,
          special_instructions: instructions || '',
          status: "Booked"
        })
      });
  
      const confirmMessage: Message = {
        id: Date.now().toString(),
        content: `✅ Booking created for ${serviceType} on ${date} at ${time}.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
      speakText(confirmMessage.content);
  
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, something went wrong while saving your booking.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.content);
    }
  };
  
  const fetchAvailableSlots = async (serviceType: string, date: string) => {
    try {
      console.log("reached here");
      const res = await fetch(`http://localhost:8000/ai/services/by-name/${encodeURIComponent(serviceType)}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Fetched the service id");
      const service = await res.json();
      console.log(service);
      const service_id = service.id;
      if (!service_id) {
        console.error('Unknown service type:', serviceType);
        return;
      }
  
      const availRes = await fetch(`http://localhost:8000/api/bookings/availability?service_id=${service_id}&date=${encodeURIComponent(date)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await availRes.json();
  
      const unavailable = data.unavailable_slots || [];
      const allSlots = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];
      const availableSlots = allSlots.filter(slot => !unavailable.includes(slot));
  
      const slotText = availableSlots.length
        ? `Available slots for ${serviceType} on ${date}: ${availableSlots.join(', ')}. Please pick one.`
        : `Sorry, no slots are available for ${serviceType} on ${date}.`;
  
      const slotMessage: Message = {
        id: Date.now().toString(),
        content: slotText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, slotMessage]);
      speakText(slotMessage.content);
  
    } catch (error) {
      console.error('Error fetching slots:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, something went wrong while fetching slots.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText(errorMessage.content);
    }
  };
  

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const simulatedText = 'I want to book a laundry service for tomorrow';
        handleSendMessage(simulatedText);
        stream.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: 'Recording started', description: 'Speak now...' });
    } catch (error) {
      toast({ title: 'Microphone Error', description: 'Unable to access microphone.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped', description: 'Processing your voice...' });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col animate-slide-in-up shadow-2xl">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary animate-bounce-gentle" />
            AI Voice Assistant
            {isSpeaking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
          </div>
          <Button variant="ghost" size="sm" onClick={toggleSpeech} className="hover-scale">
            {speechEnabled ? <Volume2 className="h-4 w-4 text-green-600" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg max-h-[500px]">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[70%] p-3 rounded-lg break-words ${message.sender === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                : 'bg-card border'}`}>
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-card border p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {isRecording && (
          <div className="px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Recording...</span>
              <Progress value={audioLevel} className="flex-1 h-2" />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Type your message or use voice..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              disabled={isLoading}
            />
            <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isLoading} size="icon" className="hover-scale">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? 'destructive' : 'outline'} size="icon" className={`hover-scale ${isRecording ? 'pulse-strong' : ''}`}>
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chatbot;
