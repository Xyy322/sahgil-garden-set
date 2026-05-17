import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, MessageSquarePlus, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useInquiryChat } from '../../hooks/useInquiryChat';
import { MessageBubble } from './MessageBubble';
import { useNavigate } from 'react-router-dom';

interface ChatWindowProps {
  userEmail: string | null;
}

export function ChatWindow({ userEmail }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { messages, sendMessage, isLoading, isClosed, inquiry, inquiries, selectedInquiryId, selectInquiry } =
    useInquiryChat(userEmail);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const pastInquiries = inquiries.filter((inq) => inq.status === 'closed');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-xl border-0 z-50">
          <MessageCircle className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
  side="right"
  className="w-[400px] sm:w-[500px] p-0 flex flex-col h-full max-h-screen z-[60]"
> 
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            Customer Support
            {inquiry && (
              <Badge variant={inquiry.status === 'closed' ? 'destructive' : 'default'}>
                {inquiry.status.toUpperCase()}
              </Badge>
            )}
          </SheetTitle>

          {!isLoading && inquiries.length > 1 && (
            <div className="pt-3">
              <label htmlFor="inquiry-selector" className="text-xs text-stone-600 block mb-1">
                Conversation
              </label>
              <select
                id="inquiry-selector"
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                value={selectedInquiryId || ''}
                onChange={(e) => selectInquiry(e.target.value)}
              >
                {inquiries.map((inq, idx) => (
                  <option key={inq.id} value={inq.id}>
                    {idx === 0 ? 'Latest' : `Inquiry ${inquiries.length - idx}`} - {inq.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-hidden p-6">
            <div className="space-y-1 pb-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-32 text-stone-500">Loading conversation...</div>
            ) : !userEmail ? (
              <div className="flex flex-col items-center justify-center h-32 text-stone-500 text-center">
                <p>Please sign in to access your inquiries.</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-stone-500 text-center">
                <MessageSquarePlus className="w-12 h-12 mb-2 text-stone-400" />
                <p>No inquiries yet. Start the conversation!</p>
              </div>
            ) : !inquiry && pastInquiries.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-600">Past inquiries</p>
                {pastInquiries.map((inq) => (
                  <button
                    key={inq.id}
                    className="w-full text-left border rounded-lg p-3 hover:bg-stone-50"
                    onClick={() => selectInquiry(inq.id)}
                  >
                    <div className="text-sm font-medium">{inq.inquiryType || 'Inquiry'}</div>
                    <div className="text-xs text-stone-500">
                      {inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleString() : 'No date'}
                    </div>
                  </button>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-stone-500 text-center">
                <MessageSquarePlus className="w-12 h-12 mb-2 text-stone-400" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={index} message={message} isOwn={message.sender === 'customer'} />
              ))
            )}

            {isClosed && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl mx-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-800">This conversation is closed.</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/contact')}
              className="flex-1"
              size="sm"
            >
              New Inquiry
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={!userEmail ? 'Sign in required' : isClosed ? 'Conversation closed' : 'Type your message...'}
              className="flex-3 min-h-[44px] resize-none"
              disabled={!userEmail || isClosed || isLoading || !inquiry}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || !userEmail || isClosed || isLoading || !inquiry}
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

