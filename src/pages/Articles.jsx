import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop';

const Articles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [categories, setCategories] = useState(['ทั้งหมด']);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      const list = data || [];
      setArticles(list);
      const cats = ['ทั้งหมด', ...new Set(list.map(a => a.category).filter(Boolean))];
      setCategories(cats);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = activeCategory === 'ทั้งหมด'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-400">
          <span className="material-symbols-outlined text-3xl">chevron_left</span>
        </button>
        <h1 className="text-xl font-extrabold">บทความและข่าวสาร</h1>
        <div className="w-8" />
      </header>

      {/* Category tabs */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 flex-nowrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 pt-4 pb-32 space-y-4">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl text-slate-200">newspaper</span>
            <p className="mt-3 text-sm font-bold">ไม่พบบทความ</p>
          </div>
        ) : (
          filtered.map(article => (
            <div
              key={article.id}
              onClick={() => navigate(`/articles/${article.id}`)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 cursor-pointer active:scale-[0.98] transition-all shadow-sm"
            >
              <div className="h-44 relative">
                <img
                  src={article.image_url || FALLBACK_IMG}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-accent-red text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {article.category || 'ข่าวสาร'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-extrabold text-base mb-1 line-clamp-2">{article.title}</h3>
                <p className="text-xs text-slate-400 mb-3">{formatDate(article.created_at)}</p>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {article.sub_content || article.content?.slice(0, 120) || ''}
                </p>
                <div className="flex items-center gap-1 mt-3 text-primary text-sm font-bold">
                  <span>อ่านต่อ</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Articles;
