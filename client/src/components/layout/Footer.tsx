import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white border-t border-primary-hover">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img src="/ABc.png" alt="SMS-CAM" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-white/80 mb-4">
              សេវាកម្មគ្រប់គ្រងសាលារៀនដ៏មានប្រសិទ្ធភាពសម្រាប់គ្រូ អ្នកគ្រប់គ្រង និងឪពុកម្តាយនៅកម្ពុជា។
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">ស្វែងរក</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm text-white/80 hover:text-white transition">ទំព័រដើម</Link></li>
              <li><Link to="/help" className="text-sm text-white/80 hover:text-white transition">Help Center</Link></li>
              <li><Link to="/about" className="text-sm text-white/80 hover:text-white transition">អំពី SMS-CAM</Link></li>
              <li><Link to="/guide" className="text-sm text-white/80 hover:text-white transition">មេរៀន</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">ការគាំទ្រ</h4>
            <ul className="space-y-3">
              <li><Link to="/help" className="text-sm text-white/80 hover:text-white transition">Help Center</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-hover pt-8"></div>

        {/* Bottom Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-white/80">
          <p>© {currentYear} SMS-CAM. រក្សាសិទ្ធិគ្រប់យ៉ាង។ សម្រាប់ប្រើនៅកម្ពុជា។ 🇰🇭</p>
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
