import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { 'data-testid'?: string };

const createIcon = (name: string) => (props: IconProps) => React.createElement('svg', { 'data-testid': name, ...props });

export const Activity = createIcon('Activity');
export const AlertCircle = createIcon('AlertCircle');
export const AlertTriangle = createIcon('AlertTriangle');
export const ArrowRight = createIcon('ArrowRight');
export const ArrowUpRight = createIcon('ArrowUpRight');
export const Award = createIcon('Award');
export const BarChart3 = createIcon('BarChart3');
export const Bell = createIcon('Bell');
export const BookOpen = createIcon('BookOpen');
export const Building2 = createIcon('Building2');
export const Bus = createIcon('Bus');
export const CalendarDays = createIcon('CalendarDays');
export const CalendarRange = createIcon('CalendarRange');
export const Camera = createIcon('Camera');
export const Car = createIcon('Car');
export const CheckCircle = createIcon('CheckCircle');
export const CheckCircle2 = createIcon('CheckCircle2');
export const ChevronDown = createIcon('ChevronDown');
export const ChevronRight = createIcon('ChevronRight');
export const ChevronUp = createIcon('ChevronUp');
export const Clock = createIcon('Clock');
export const Clock3 = createIcon('Clock3');
export const Copy = createIcon('Copy');
export const Cpu = createIcon('Cpu');
export const DollarSign = createIcon('DollarSign');
export const Download = createIcon('Download');
export const Edit3 = createIcon('Edit3');
export const Eye = createIcon('Eye');
export const FileText = createIcon('FileText');
export const Gift = createIcon('Gift');
export const Globe = createIcon('Globe');
export const GraduationCap = createIcon('GraduationCap');
export const Heart = createIcon('Heart');
export const Home = createIcon('Home');
export const Image = createIcon('Image');
export const Layers = createIcon('Layers');
export const Link2 = createIcon('Link2');
export const LogIn = createIcon('LogIn');
export const Mail = createIcon('Mail');
export const MapPin = createIcon('MapPin');
export const MapPinOutlined = createIcon('MapPinOutlined');
export const Menu = createIcon('Menu');
export const MessageCircle = createIcon('MessageCircle');
export const MessageSquare = createIcon('MessageSquare');
export const PackageOpen = createIcon('PackageOpen');
export const Palette = createIcon('Palette');
export const Phone = createIcon('Phone');
export const PlusCircle = createIcon('PlusCircle');
export const Search = createIcon('Search');
export const Send = createIcon('Send');
export const Settings2 = createIcon('Settings2');
export const Share2 = createIcon('Share2');
export const Shield = createIcon('Shield');
export const ShieldCheck = createIcon('ShieldCheck');
export const ShoppingBag = createIcon('ShoppingBag');
export const Smartphone = createIcon('Smartphone');
export const Sofa = createIcon('Sofa');
export const Star = createIcon('Star');
export const Trash2 = createIcon('Trash2');
export const TrendingUp = createIcon('TrendingUp');
export const UploadCloud = createIcon('UploadCloud');
export const User = createIcon('User');
export const UserCheck = createIcon('UserCheck');
export const Users = createIcon('Users');
export const Utensils = createIcon('Utensils');
export const X = createIcon('X');
export const Zap = createIcon('Zap');

const MockedIcons = {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Bus,
  CalendarDays,
  CalendarRange,
  Camera,
  Car,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Clock3,
  Copy,
  Cpu,
  DollarSign,
  Download,
  Edit3,
  Eye,
  FileText,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Image,
  Layers,
  Link2,
  LogIn,
  Mail,
  MapPin,
  MapPinOutlined,
  Menu,
  MessageCircle,
  MessageSquare,
  PackageOpen,
  Palette,
  Phone,
  PlusCircle,
  Search,
  Send,
  Settings2,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sofa,
  Star,
  Trash2,
  TrendingUp,
  UploadCloud,
  User,
  UserCheck,
  Users,
  Utensils,
  X,
  Zap,
};

export default MockedIcons;
