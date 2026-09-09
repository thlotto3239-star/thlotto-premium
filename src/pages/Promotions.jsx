import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import PageWrapper from '../components/PageWrapper';

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
  const dialogRef = useRef(null);

  useEffect(() => {
    if (selected) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [selected]);

  const handleAccept = (promo) => {
    setSelected(null);
    dialogRef.current?.close();
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
    <PageWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                โปรโมชั่นพิเศษ
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary">
                  {promotions.length} รายการ
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">สิทธิพิเศษและโบนัสเครดิตสำหรับสมาชิก TH-LOTTO</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400">กำลังโหลดโปรโมชั่น...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="material-symbols-outlined text-4xl">loyalty</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">ไม่มีโปรโมชั่นในขณะนี้</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">ติดตามกิจกรรมพิเศษและโบนัสได้เร็วๆ นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                onClick={() => setSelected(promo)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/70 hover:border-slate-300 cursor-pointer transition-all flex flex-col group"
              >
                {promo.image_url ? (
                  <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
                    <img
                      src={promo.image_url}
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {promo.badge_text && (
                      <span className={`absolute top-4 left-4 ${BADGE_COLORS[promo.badge_text] || 'bg-primary'} text-white text-xs font-black px-3 py-1 rounded-full shadow-md`}>
                        {promo.badge_text}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="h-36 relative flex items-center justify-center overflow-hidden"
                    style={{ background: promo.background_color || 'linear-gradient(135deg, #1a7e2a 0%, #0e5b29 100%)' }}
                  >
                    <span className="material-symbols-outlined text-white/20 text-8xl absolute -right-4 -bottom-4">loyalty</span>
                    <span className="material-symbols-outlined text-white text-5xl relative z-10">loyalty</span>
                    {promo.badge_text && (
                      <span className={`absolute top-4 left-4 ${BADGE_COLORS[promo.badge_text] || 'bg-primary'} text-white text-xs font-black px-3 py-1 rounded-full shadow-md`}>
                        {promo.badge_text}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                      {promo.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {promo.description}
                    </p>
                    {promo.allowed_game && promo.allowed_game !== 'all' && (
                      <p className="text-xs text-blue-600 font-bold mt-2.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">sports_esports</span>
                        {GAME_LABEL[promo.allowed_game]}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex gap-4">
                      {promo.bonus_amount > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 font-bold">โบนัส</p>
                          <p className="font-black text-primary text-base sm:text-lg font-mono">฿{promo.bonus_amount}</p>
                        </div>
                      )}
                      {promo.bonus_rate > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 font-bold">อัตรา</p>
                          <p className="font-black text-primary text-base sm:text-lg font-mono">{promo.bonus_rate}%</p>
                        </div>
                      )}
                      {promo.min_deposit > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                          <p className="font-black text-slate-700 text-base sm:text-lg font-mono">฿{promo.min_deposit}</p>
                        </div>
                      )}
                    </div>
                    {usedPromoIds.has(promo.id) ? (
                      <span className="text-xs font-black text-slate-400 px-4 py-2 rounded-xl bg-slate-100 whitespace-nowrap">
                        รับแล้ว ✅
                      </span>
                    ) : (
                      <button className="bg-primary hover:brightness-105 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-primary/25 whitespace-nowrap transition-all">
                        รับโปร
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal using Native HTML5 Dialog per RULE[user_global] */}
      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setSelected(null);
        }}
        className="fixed inset-0 m-auto w-[92%] max-w-lg rounded-3xl p-0 shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm bg-white border border-slate-100 overflow-hidden"
      >
        {selected && (
          <div className="p-6 sm:p-8 flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {selected.badge_text && (
                  <span className={`${BADGE_COLORS[selected.badge_text] || 'bg-primary'} text-white text-xs font-black px-3 py-1 rounded-full`}>
                    {selected.badge_text}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400">รายละเอียดเงื่อนไข</span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {selected.image_url && (
              <img
                src={selected.image_url}
                alt={selected.title}
                className="w-full aspect-[16/9] object-cover rounded-2xl mb-5 shadow-sm"
              />
            )}

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">{selected.title}</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selected.description}</p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {selected.bonus_amount > 0 && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 text-center">
                  <p className="text-xs text-slate-400 font-bold">โบนัส</p>
                  <p className="font-black text-primary text-xl font-mono">{selected.bonus_amount}</p>
                  <p className="text-xs text-slate-400">บาท</p>
                </div>
              )}
              {selected.bonus_rate > 0 && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 text-center">
                  <p className="text-xs text-slate-400 font-bold">อัตราโบนัส</p>
                  <p className="font-black text-primary text-xl font-mono">{selected.bonus_rate}%</p>
                  <p className="text-xs text-slate-400">เครดิต</p>
                </div>
              )}
              {selected.min_deposit > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                  <p className="text-xs text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                  <p className="font-black text-slate-700 text-xl font-mono">{selected.min_deposit}</p>
                  <p className="text-xs text-slate-400">บาท</p>
                </div>
              )}
              {selected.max_withdrawal > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                  <p className="text-xs text-slate-400 font-bold">ถอนสูงสุด</p>
                  <p className="font-black text-slate-700 text-xl font-mono">{selected.max_withdrawal}</p>
                  <p className="text-xs text-slate-400">บาท</p>
                </div>
              )}
              {selected.turnover_multiplier > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                  <p className="text-xs text-slate-400 font-bold">เทิร์นโอเวอร์</p>
                  <p className="font-black text-slate-700 text-xl font-mono">{selected.turnover_multiplier}x</p>
                  <p className="text-xs text-slate-400">เท่า</p>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {selected.allowed_game && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-base">sports_esports</span>
                  <span>เล่นได้เฉพาะ: <strong className="text-slate-900">{GAME_LABEL[selected.allowed_game]}</strong></span>
                </div>
              )}
              {selected.expires_at && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-base">schedule</span>
                  <span>หมดอายุ: <strong className="text-slate-900">{new Date(selected.expires_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                </div>
              )}
              {selected.max_uses_per_user > 0 && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-base">person</span>
                  <span>สิทธิ์การรับ: <strong className="text-slate-900">{selected.max_uses_per_user} ครั้ง / บัญชี</strong></span>
                </div>
              )}
              {selected.max_uses_per_day > 0 && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-base">today</span>
                  <span>จำกัด: <strong className="text-slate-900">{selected.max_uses_per_day} ครั้ง / วัน</strong></span>
                </div>
              )}
            </div>

            {usedPromoIds.has(selected.id) ? (
              <div className="mt-6 bg-slate-100 rounded-2xl p-4 text-center">
                <span className="text-sm font-black text-slate-500">✅ คุณรับสิทธิ์โปรโมชั่นนี้ไปแล้ว</span>
              </div>
            ) : (
              <button
                onClick={() => handleAccept(selected)}
                className="mt-6 w-full bg-primary hover:brightness-105 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-primary/25 transition-all"
              >
                รับโปรโมชั่นนี้ทันที
              </button>
            )}
          </div>
        )}
      </dialog>
    </PageWrapper>
  );
};

export default Promotions;
