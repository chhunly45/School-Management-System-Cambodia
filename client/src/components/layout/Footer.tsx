import { Link } from 'react-router-dom';
import { Globe, Share2, Phone, Mail, MapPin, Heart, Send } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white border-t border-primary-hover">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img src="/logo.png" alt="Konpuk" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-white/80 mb-4">
              ទីផ្សារលើអ៊ីនធឺណេតលំដាប់ទីមួយនៅកម្ពុជា សម្រាប់ទិញនិងលក់ផលិតផលក្នុងស្រុក។
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-primary/80 hover:bg-primary-hover flex items-center justify-center transition">
                <Share2 className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary/80 hover:bg-accent flex items-center justify-center transition">
                <Heart className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-primary/80 hover:bg-accent/90 flex items-center justify-center transition">
                <Send className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">ស្វែងរក</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm text-white/80 hover:text-white transition">ទំព័រដើម</Link></li>
              <li><Link to="/help" className="text-sm text-white/80 hover:text-white transition">Help Center</Link></li>
              <li><Link to="/about" className="text-sm text-white/80 hover:text-white transition">អំពី Konpuk</Link></li>
              <li><Link to="/guide" className="text-sm text-white/80 hover:text-white transition">មេរៀន</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">ប្រភេទ</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">អេឡិចត្រូនិក</a></li>
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">យានយន្ត</a></li>
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">អចលនទ្រព្យ</a></li>
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">ម៉ូត</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">ការគាំទ្រ</h4>
            <ul className="space-y-3">
              <li><Link to="/help" className="text-sm text-white/80 hover:text-white transition">Help Center</Link></li>
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">គន្លឹះសុវត្ថិភាព</a></li>
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">ទំនាក់ទំនង</a></li>
              <li><a href="#" className="text-sm text-white/80 hover:text-white transition">រាយការណ៍បញ្ហា</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">ទំនាក់ទំនង</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span className="text-white/80">+855 (0) 89 229 971</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span className="text-white/80">support@konpuk.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                <span className="text-white/80">ភ្នំពេញ, កម្ពុជា</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-hover pt-8"></div>

        {/* Bottom Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-white/80">
          <p>© {currentYear} Konpuk. រក្សាសិទ្ធិគ្រប់យ៉ាង។ សម្រាប់ប្រើនៅកម្ពុជា។ 🇰🇭</p>
          <div className="flex flex-wrap gap-4 sm:justify-end">
            <a href="#" className="hover:text-white transition">ភាពឯកជន</a>
            <a href="#" className="hover:text-white transition">ល័ក្ខខណ្ឌ</a>
            <a href="#" className="hover:text-white transition">គូគី</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
