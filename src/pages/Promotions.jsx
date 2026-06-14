import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
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

const GAME_LABEL = { all: 'ทั้งหมด (หวยหลัก + หวย 1 นาที)', main: 'หวยหลักเท่านั้น', instant: 'หวย 1 นาทีเท่านั้น' };

const Promotions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [usedPromoIds, setUsedPromoIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const handleAccept = (promo) => {
    setSelected(null);
    navigate(`/deposit?promo=${promo.promo_code || promo.id}&promoName=${encodeURIComponent(promo.title)}&promoId=${promo.id}&amount=${promo.min_deposit || 100}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: false });
      setPromotions(data || []);

      if (user) {
        const { data: bonusTx } = await supabase
          .from('transactions')
          .select('note')
          .eq('user_id', user.id)
          .eq('type', 'BONUS');
        const ids = new Set();
        (bonusTx || []).forEach(t => {
          const m = t.note?.match(/\((\d+)\)$/);
          if (m) ids.add(Number(m[1]));
        });
        setUsedPromoIds(ids);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

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
                    <span className={`absolute top-3 left-3 ${BADGE_COLORS[promo.badge_text] || 'bg-primary'} text-white text-xs font-extrabold px-2.5 py-1 rounded-full`}>
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
                    <span className={`${BADGE_COLORS[promo.badge_text] || 'bg-primary'} text-white text-xs font-extrabold px-2 py-0.5 rounded-full`}>
                      {promo.badge_text}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{promo.description}</p>
                {promo.allowed_game && promo.allowed_game !== 'all' && (
                  <p className="text-xs text-blue-600 font-bold mt-2">🎮 {GAME_LABEL[promo.allowed_game]}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-4">
                    {promo.bonus_amount > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold">โบนัส</p>
                        <p className="font-extrabold text-primary">{promo.bonus_amount} บาท</p>
                      </div>
                    )}
                    {promo.bonus_rate > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold">อัตรา</p>
                        <p className="font-extrabold text-primary">{promo.bonus_rate}%</p>
                      </div>
                    )}
                    {promo.min_deposit > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                        <p className="font-extrabold text-slate-700">{promo.min_deposit} บาท</p>
                      </div>
                    )}
                  </div>
                  {usedPromoIds.has(promo.id) ? (
                    <span className="text-xs font-extrabold text-slate-400 px-4 py-2 rounded-full bg-slate-100">รับแล้ว ✅</span>
                  ) : (
                    <button className="bg-primary text-white px-5 py-2 rounded-full text-xs font-extrabold shadow-md shadow-primary/20">
                      รับโปร
                    </button>
                  )}
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
                <span className={`${BADGE_COLORS[selected.badge_text] || 'bg-primary'} text-white text-xs font-extrabold px-2 py-0.5 rounded-full`}>
                  {selected.badge_text}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{selected.description}</p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {selected.bonus_amount > 0 && (
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-bold">โบนัส</p>
                  <p className="font-extrabold text-primary text-lg">{selected.bonus_amount}</p>
                  <p className="text-xs text-slate-400">บาท</p>
                </div>
              )}
              {selected.bonus_rate > 0 && (
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-bold">อัตราโบนัส</p>
                  <p className="font-extrabold text-primary text-lg">{selected.bonus_rate}%</p>
                </div>
              )}
              {selected.min_deposit > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                  <p className="font-extrabold text-slate-700 text-lg">{selected.min_deposit}</p>
                  <p className="text-xs text-slate-400">บาท</p>
                </div>
              )}
              {selected.max_withdrawal > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-bold">ถอนสูงสุด</p>
                  <p className="font-extrabold text-slate-700 text-lg">{selected.max_withdrawal}</p>
                  <p className="text-xs text-slate-400">บาท</p>
                </div>
              )}
              {selected.turnover_multiplier > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-bold">เทิร์นโอเวอร์</p>
                  <p className="font-extrabold text-slate-700 text-lg">{selected.turnover_multiplier}x</p>
                </div>
              )}
            </div>
            {selected.allowed_game && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-blue-500 text-sm">sports_esports</span>
                <span className="text-slate-600 font-semibold">เล่นได้เฉพาะ: {GAME_LABEL[selected.allowed_game]}</span>
              </div>
            )}
            {selected.expires_at && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-red-400 text-sm">schedule</span>
                <span className="text-slate-600 font-semibold">หมดอายุ: {new Date(selected.expires_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {selected.max_uses_per_user > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                <span className="text-slate-600 font-semibold">รับได้ {selected.max_uses_per_user} ครั้ง/คน</span>
              </div>
            )}
            {selected.max_uses_per_day > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-slate-400 text-sm">today</span>
                <span className="text-slate-600 font-semibold">รับได้วันละ {selected.max_uses_per_day} ครั้ง</span>
              </div>
            )}
            {usedPromoIds.has(selected.id) && (
              <div className="mt-3 bg-slate-100 rounded-xl p-3 text-center">
                <span className="text-sm font-bold text-slate-500">✅ คุณรับโปรนี้ไปแล้ว</span>
              </div>
            )}
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
