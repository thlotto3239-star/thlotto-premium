import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();
      setArticle(data);

      if (data?.category) {
        const { data: relatedData } = await supabase
          .from('articles')
          .select('id, title, image_url, category, created_at')
          .eq('is_published', true)
          .eq('category', data.category)
          .neq('id', id)
          .order('created_at', { ascending: false })
          .limit(3);
        setRelated(relatedData || []);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-400">
        <span className="material-symbols-outlined text-5xl">article</span>
        <p className="font-bold">ไม่พบบทความ</p>
        <button onClick={() => navigate(-1)} className="text-primary font-bold text-sm">กลับ</button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 border-b border-slate-100 px-6 py-4 flex items-center gap-4" style={{ backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} className="text-slate-400 shrink-0">
          <span className="material-symbols-outlined text-3xl">chevron_left</span>
        </button>
        <h1 className="text-base font-extrabold line-clamp-1">{article.title}</h1>
      </header>

      <main className="pb-32">
        {/* Hero image */}
        <div className="h-56 relative">
          <img
            src={article.image_url || FALLBACK_IMG}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <span className="bg-accent-red text-white text-[10px] font-bold px-3 py-1 rounded-full">
              {article.category || 'ข่าวสาร'}
            </span>
            <h2 className="text-white font-extrabold text-xl mt-2 leading-tight">{article.title}</h2>
            <p className="text-white/70 text-xs mt-1">{formatDate(article.created_at)}</p>
          </div>
        </div>

        {/* Additional images */}
        {article.images && article.images.length > 0 && (
          <div className="px-5 mt-5 flex gap-3 overflow-x-auto no-scrollbar">
            {article.images.map((img, i) => (
              <img key={i} src={img} alt={`img-${i}`} className="h-28 w-44 object-cover rounded-2xl shrink-0" />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-5 mt-6">
          {article.sub_content && (
            <p className="text-slate-500 text-sm leading-relaxed mb-4 font-medium">{article.sub_content}</p>
          )}
          {article.content && (
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{article.content}</div>
          )}
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="px-5 mt-10">
            <h3 className="font-extrabold text-base mb-4">บทความที่เกี่ยวข้อง</h3>
            <div className="space-y-3">
              {related.map(r => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/articles/${r.id}`)}
                  className="flex gap-3 bg-slate-50 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                >
                  <img
                    src={r.image_url || FALLBACK_IMG}
                    alt={r.title}
                    className="w-20 h-20 object-cover shrink-0"
                  />
                  <div className="py-3 pr-3 flex flex-col justify-center">
                    <span className="text-[10px] text-primary font-bold mb-1">{r.category}</span>
                    <p className="text-sm font-bold line-clamp-2 text-slate-800">{r.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ArticleDetail;
