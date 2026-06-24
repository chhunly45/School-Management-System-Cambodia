import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Smartphone, Cpu, Car, Home, Camera, Heart, Gift, Zap, BookOpen, Palette, Utensils } from 'lucide-react';
import api from '../../services/api';

interface CategoryItem {
  _id: string;
  name: string;
  labelKh?: string;
}

const CategoriesGrid = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (error) {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const categoryIcon = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('phone') || key.includes('tablet') || key.includes('mobile')) return Smartphone;
    if (key.includes('electronics') || key.includes('computer') || key.includes('laptop') || key.includes('tech')) return Cpu;
    if (key.includes('vehicle') || key.includes('car') || key.includes('motorcycle') || key.includes('auto')) return Car;
    if (key.includes('home') || key.includes('furniture') || key.includes('property') || key.includes('real')) return Home;
    if (key.includes('camera') || key.includes('photo') || key.includes('image') || key.includes('video')) return Camera;
    if (key.includes('fashion') || key.includes('beauty') || key.includes('clothes') || key.includes('dress')) return Heart;
    if (key.includes('book') || key.includes('education') || key.includes('learning')) return BookOpen;
    if (key.includes('art') || key.includes('craft') || key.includes('design')) return Palette;
    if (key.includes('food') || key.includes('restaurant') || key.includes('kitchen')) return Utensils;
    return Gift;
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-primary to-primary-hover',
      'from-accent to-accent-hover',
      'from-emerald-500 to-teal-400',
      'from-sky-500 to-indigo-500',
      'from-rose-500 to-fuchsia-500',
      'from-yellow-500 to-orange-400',
      'from-cyan-500 to-sky-400',
      'from-violet-500 to-purple-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.length > 0 ? (
            categories.map((category, index) => {
              const Icon = categoryIcon(category.name || category.labelKh || '');
              const colorGradient = getCategoryColor(index);
              return (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group relative overflow-hidden rounded-[1.75rem] bg-white border border-surface-muted shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
                  <div className="relative p-6 h-full flex flex-col justify-between">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${colorGradient} text-white shadow-lg transition-all duration-300 group-hover:scale-105`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition leading-snug">
                        {category.labelKh || category.name}
                      </h3>
                      <p className="mt-2 text-sm text-text-secondary">Browse trusted listings</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Zap className="h-4 w-4" />
                      View category
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full rounded-[1.75rem] border border-surface-muted bg-background p-12 text-center text-text-secondary">
              Loading categories…
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;

