import { MessageCircle } from 'lucide-react';

export function FloatingChat() {
  return (
    <a
      href="https://wa.me/970123346789"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 end-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-black bg-black text-white transition-transform duration-200 hover:-translate-y-0.5"
      aria-label="تواصل عبر واتساب"
    >
      <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
    </a>
  );
}

export default FloatingChat;
