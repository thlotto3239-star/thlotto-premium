import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

const BADGE_COLORS = {
  HOT: 'bg-red-500',
  NEW: 'bg-primary',
  BIRTHDAY: 'bg-pink-500',
  BONUS: 'bg-amber-500',
  DAILY: 'bg-blue-500',
  CASHBACK: 'bg-purple-500',
  VIP: 'bg-yellow-600',
};

const Promotions = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const handleAccept = (promo) => {
    setSelected(null);
    navigate(`/deposit?promo=${promo.id}&amount=${promo.min_deposit || 100}`);
  };

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false });
      setPromotions(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-slate-400">
          <span className="material-symbols-outlined text-3xl">chevron_left</span>
        </button>
        <h1 className="text-xl font-extrabold">โปรโมชั่นพิเศษ</h1>
        <div className="w-8" />
      </header>

      <main className="px-4 pt-5 pb-32 space-y-4">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl text-slate-200">loyalty</span>
            <p className="mt-3 text-sm font-bold">ไม่มีโปรโมชั่นในขณะนี้</p>
          </div>
        ) : (
          promotions.map((promo) => (
            <div
              key={promo.id}
              onClick={() => setSelected(promo)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-all"
            >
              {promo.image_url ? (
                <div className="aspect-[2/1] relative">
                  <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                  {promo.badge_text && (
                    <span className={`absolute top-3 left-3 ${BADGE_COLORS[promo.badge_text] || 'bg-primary'} text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full`}>
                      {promo.badge_text}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center" style={{ background: promo.background_color || 'linear-gradient(to right, #1a7e2a, #0e5b29)' }}>
                  <span className="material-symbols-outlined text-white text-5xl">loyalty</span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-base">{promo.title}</h3>
                  {!promo.image_url && promo.badge_text && (
                    <span className={`${BADGE_COLORS[promo.badge_text] || 'bg-primary'} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full`}>
                      {promo.badge_text}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{promo.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-4">
                    {promo.bonus_amount > 0 && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold">โบนัส</p>
                        <p className="font-extrabold text-primary">{promo.bonus_amount} บาท</p>
                      </div>
                    )}
                    {promo.bonus_rate > 0 && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold">อัตรา</p>
                        <p className="font-extrabold text-primary">{promo.bonus_rate}%</p>
                      </div>
                    )}
                    {promo.min_deposit > 0 && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                        <p className="font-extrabold text-slate-700">{promo.min_deposit} บาท</p>
                      </div>
                    )}
                  </div>
                  <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-extrabold shadow-md shadow-primary/20">
                    รับโปร
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.title} className="w-full aspect-[2/1] object-cover rounded-2xl mb-5" />
            )}
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-extrabold">{selected.title}</h2>
              {selected.badge_text && (
                <span className={`${BADGE_COLORS[selected.badge_text] || 'bg-primary'} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full`}>
                  {selected.badge_text}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{selected.description}</p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {selected.bonus_amount > 0 && (
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-bold">โบนัส</p>
                  <p className="font-extrabold text-primary text-lg">{selected.bonus_amount}</p>
                  <p className="text-[10px] text-slate-400">บาท</p>
                </div>
              )}
              {selected.bonus_rate > 0 && (
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-bold">อัตราโบนัส</p>
                  <p className="font-extrabold text-primary text-lg">{selected.bonus_rate}%</p>
                </div>
              )}
              {selected.min_deposit > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                  <p className="font-extrabold text-slate-700 text-lg">{selected.min_deposit}</p>
                  <p className="text-[10px] text-slate-400">บาท</p>
                </div>
              )}
              {selected.max_withdrawal > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-bold">ถอนสูงสุด</p>
                  <p className="font-extrabold text-slate-700 text-lg">{selected.max_withdrawal}</p>
                  <p className="text-[10px] text-slate-400">บาท</p>
                </div>
              )}
              {selected.turnover_multiplier > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-bold">เทิร์นโอเวอร์</p>
                  <p className="font-extrabold text-slate-700 text-lg">{selected.turnover_multiplier}x</p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleAccept(selected)}
              className="mt-6 w-full bg-primary text-white py-4 rounded-2xl font-extrabold text-sm shadow-lg shadow-primary/20"
            >
              รับโปรโมชั่นนี้
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Promotions;
