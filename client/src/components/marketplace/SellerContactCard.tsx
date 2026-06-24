import { Phone, MessageCircle, Copy, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

interface SellerContactCardProps {
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  telegramHandle?: string;
}

const SellerContactCard = ({ sellerName, sellerPhone, sellerEmail, telegramHandle }: SellerContactCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    if (sellerPhone) {
      navigator.clipboard.writeText(sellerPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappLink = sellerPhone ? `https://wa.me/${sellerPhone.replace(/^\+/, '').replace(/[^0-9]/g, '')}` : null;
  const telegramLink = telegramHandle ? `https://t.me/${telegramHandle.replace('@', '')}` : null;

  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-primary/10 to-background p-5 border border-primary/30 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Contact seller</h3>
      
      <div className="space-y-2.5">
        {sellerPhone && (
          <div className="flex flex-wrap gap-2">
            <a 
              href={`tel:${sellerPhone}`}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call</span>
            </a>
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white border border-muted text-text-secondary hover:bg-background'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {sellerEmail && (
            <a 
              href={`mailto:${sellerEmail}`}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 rounded-2xl bg-text-primary px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </a>
          )}
          
          {whatsappLink && (
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          
          {telegramLink && (
            <a 
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 rounded-2xl bg-primary px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Telegram</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerContactCard;

