import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { 'data-testid'?: string };

const createIcon = (name: string) => (props: IconProps) => React.createElement('svg', { 'data-testid': name, ...props });

export const Search = createIcon('Search');
export const MapPin = createIcon('MapPin');
export const ChevronDown = createIcon('ChevronDown');
export const ChevronUp = createIcon('ChevronUp');
export const ArrowRight = createIcon('ArrowRight');
export const ShoppingBag = createIcon('ShoppingBag');
export const Car = createIcon('Car');
export const Home = createIcon('Home');
export const Sofa = createIcon('Sofa');
export const Smartphone = createIcon('Smartphone');
export const Briefcase = createIcon('Briefcase');
export const Music = createIcon('Music');
export const TrendingUp = createIcon('TrendingUp');
export const Star = createIcon('Star');
export const Zap = createIcon('Zap');
export const ShieldCheck = createIcon('ShieldCheck');
export const LayoutDashboard = createIcon('LayoutDashboard');
export const MessageSquare = createIcon('MessageSquare');
export const UploadCloud = createIcon('UploadCloud');
export const LogIn = createIcon('LogIn');
export const User = createIcon('User');
export const Globe = createIcon('Globe');
export const AtSign = createIcon('AtSign');
export const Share2 = createIcon('Share2');
export const Phone = createIcon('Phone');
export const Mail = createIcon('Mail');
export const MapPinOutlined = createIcon('MapPinOutlined');
export const CalendarDays = createIcon('CalendarDays');
export const AlertTriangle = createIcon('AlertTriangle');

export const Heart = createIcon('Heart');
export const Send = createIcon('Send');
export const Bell = createIcon('Bell');
export const LogOut = createIcon('LogOut');
export const Menu = createIcon('Menu');
export const X = createIcon('X');
export const Eye = createIcon('Eye');
export const MessageCircle = createIcon('MessageCircle');
export const Copy = createIcon('Copy');
export const ArrowUpRight = createIcon('ArrowUpRight');
export const Cpu = createIcon('Cpu');
export const Camera = createIcon('Camera');
export const Gift = createIcon('Gift');
export const BookOpen = createIcon('BookOpen');
export const Palette = createIcon('Palette');
export const Utensils = createIcon('Utensils');
export const Users = createIcon('Users');
export const FileText = createIcon('FileText');
export const BarChart3 = createIcon('BarChart3');
export const Activity = createIcon('Activity');
export const Edit3 = createIcon('Edit3');
export const Trash2 = createIcon('Trash2');
export const CheckCircle = createIcon('CheckCircle');
export const PlusCircle = createIcon('PlusCircle');
export const DollarSign = createIcon('DollarSign');
export const Clock = createIcon('Clock');

const MockedIcons = {
  Search,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShoppingBag,
  Car,
  Home,
  Sofa,
  Smartphone,
  Briefcase,
  Music,
  TrendingUp,
  Star,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  MessageSquare,
  UploadCloud,
  LogIn,
  User,
  Globe,
  AtSign,
  Share2,
  Phone,
  Mail,
  MapPinOutlined,
  CalendarDays,
  AlertTriangle,
};

export default MockedIcons;
