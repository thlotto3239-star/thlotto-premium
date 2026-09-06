import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import PageWrapper from '../components/PageWrapper';
import AppHeader from '../components/AppHeader';

const BADGE_COLORS = {
  HOT: 'bg-red-500',
  NEW: 'bg-emerald-700',
  BIRTHDAY: 'bg-pink-500',
  BONUS: 'bg-amber-500',
  DAILY: 'bg-blue-500',
  CASHBACK: 'bg-purple-500',
  VIP: 'bg-yellow-600',
};

const GAME_LABEL = {
  all: 'ทั้งหมด (หวยหลัก + หวย 1 นาที)',
  main: 'หวยหลักเท่านั้น',
  instant: 'หวย 1 นาทีเท่านั้น',
};

const Promotions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [usedPromoIds, setUsedPromoIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

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

  const categories = [
    { label: 'ทั้งหมด', value: 'ALL', icon: 'loyalty' },
    { label: 'สมาชิกใหม่', value: 'NEW', icon: 'person_add' },
    { label: 'ยอดนิยม & HOT', value: 'HOT', icon: 'local_fire_department' },
    { label: 'โบนัสเงินฝาก', value: 'BONUS', icon: 'savings' },
    { label: 'คืนยอดเสีย', value: 'CASHBACK', icon: 'currency_exchange' },
  ];

  const filteredPromos = promotions.filter(p => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'NEW') return p.badge_text === 'NEW' || p.title.includes('ใหม่');
    if (filterCategory === 'HOT') return p.badge_text === 'HOT' || p.title.includes('ร้อนแรง');
    if (filterCategory === 'BONUS') return p.bonus_amount > 0 || p.bonus_rate > 0;
    if (filterCategory === 'CASHBACK') return p.badge_text === 'CASHBACK' || p.title.includes('คืนยอด');
    return true;
  });

  return (
    <PageWrapper>
      <AppHeader />

      {/* Page Header / Breadcrumb */}
      <div className="bg-white/80 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>โปรโมชั่นและสิทธิพิเศษ</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  {filteredPromos.length} สิทธิ์
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">เพิ่มทุน เพิ่มโอกาสชนะ รับโบนัสได้ทุกวัน</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/deposit')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 text-white font-extrabold text-xs shadow-xs hover:from-emerald-700 hover:to-emerald-600 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              ฝากเงินรับโบนัส
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Layout Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-5 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 1: LEFT SIDEBAR (Promo Categories & User Wallet Status)
              ════════════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-4">
            {/* Promo Category Menu */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-700">filter_list</span>
                หมวดหมู่สิทธิพิเศษ
              </h2>
              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const isActive = filterCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setFilterCategory(cat.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-xs font-extrabold'
                          : 'bg-slate-50/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {cat.icon}
                        </span>
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-xs opacity-50">chevron_right</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lucky Wheel Fast Invitation */}
            <div className="rounded-3xl p-5 text-white relative overflow-hidden shadow-md group cursor-pointer"
                 style={{ background: 'linear-gradient(135deg, #16441e 0%, #0d7904 100%)' }}
                 onClick={() => navigate('/lucky-wheel')}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">สิทธิ์หมุนฟรีทุกวัน</span>
                </div>
                <h3 className="text-base font-extrabold">วงล้อเสี่ยงโชคทองคำ</h3>
                <p className="text-white/80 text-xs mt-1">หมุนลุ้นรับเครดิตฟรีและทองคำแท่ง แจกจริงทุกวัน</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">ลุ้นรางวัลสูงสุด 10,000฿</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-emerald-900 px-3 py-1.5 rounded-xl shadow-xs group-hover:bg-emerald-50 transition-colors">
                    ไปหมุนวงล้อ
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-8xl">casino</span>
              </div>
            </div>

            {/* Affiliate Invitation */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">แนะนำเพื่อนรับ 0.6%</h4>
                  <p className="text-[11px] text-slate-400">สร้างรายได้แบบไม่จำกัดทุกงวด</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/affiliate')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200/60"
              >
                ดูรายละเอียดแนะนำเพื่อน
              </button>
            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 2: CENTER WORKSPACE (Promotions 2-Column Grid)
              ════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-9 xl:col-span-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="w-10 h-10 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลดโปรโมชั่น...</p>
              </div>
            ) : filteredPromos.length === 0 ? (
              <div className="py-24 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80 p-8">
                <span className="material-symbols-outlined text-5xl text-slate-200">loyalty</span>
                <p className="mt-3 text-sm font-bold text-slate-700">ไม่มีโปรโมชั่นในหมวดหมู่นี้</p>
                <p className="text-xs text-slate-400 mt-1">กรุณาเลือกหมวดหมู่อื่นเพื่อดูสิทธิพิเศษเพิ่มเติม</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPromos.map((promo) => (
                  <div
                    key={promo.id}
                    onClick={() => setSelected(promo)}
                    className="bg-white rounded-3xl overflow-hidden shadow-2xs border border-slate-200/80 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {promo.image_url ? (
                        <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
                          <img
                            src={promo.image_url}
                            alt={promo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {promo.badge_text && (
                            <span className={`absolute top-3 left-3 ${BADGE_COLORS[promo.badge_text] || 'bg-emerald-700'} text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md`}>
                              {promo.badge_text}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center relative overflow-hidden"
                             style={{ background: promo.background_color || 'linear-gradient(to right, #16441e, #0d7904)' }}>
                          <span className="material-symbols-outlined text-white/40 text-7xl select-none">loyalty</span>
                          {promo.badge_text && (
                            <span className={`absolute top-3 left-3 ${BADGE_COLORS[promo.badge_text] || 'bg-white/20'} text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md`}>
                              {promo.badge_text}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="p-4.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {promo.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{promo.description}</p>
                        {promo.allowed_game && promo.allowed_game !== 'all' && (
                          <p className="text-[11px] text-blue-600 font-bold mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">sports_esports</span>
                            {GAME_LABEL[promo.allowed_game]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4.5 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          {promo.bonus_amount > 0 && (
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">โบนัส</p>
                              <p className="font-extrabold text-emerald-700 text-xs sm:text-sm">+{promo.bonus_amount}฿</p>
                            </div>
                          )}
                          {promo.bonus_rate > 0 && (
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">เพิ่มโบนัส</p>
                              <p className="font-extrabold text-emerald-700 text-xs sm:text-sm">+{promo.bonus_rate}%</p>
                            </div>
                          )}
                          {promo.min_deposit > 0 && (
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">ฝากขั้นต่ำ</p>
                              <p className="font-extrabold text-slate-800 text-xs sm:text-sm">{promo.min_deposit}฿</p>
                            </div>
                          )}
                        </div>

                        {usedPromoIds.has(promo.id) ? (
                          <span className="text-xs font-extrabold text-slate-400 px-3.5 py-1.5 rounded-xl bg-slate-100">
                            รับแล้ว ✅
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(promo); }}
                            className="bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            รับโปรโมชั่น
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 3: RIGHT PANEL (Wagering/Turnover Guide & Rules)
              ════════════════════════════════════════════════════════════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Turnover Transparency Guide */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-700 text-lg">info</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  ข้อกำหนดและยอดเทิร์นโอเวอร์
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-extrabold text-slate-800 mb-1">การคำนวณยอดเทิร์น (Turnover)</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ยอดเดิมพันหมุนเวียนนับเฉพาะยอดแทงที่มีผลแพ้ชนะ ไม่นับยอดเสมอหรือยอดคืนเงิน
                  </p>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-600"></span>
                    <span>รับโปรโมชั่นได้ 1 โปรโมชั่นต่อครั้ง</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-600"></span>
                    <span>เมื่อทำเทิร์นครบ ถอนเงินได้ทันทีไม่จำกัดยอด</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-600"></span>
                    <span>ระบบคำนวณเทิร์นโอเวอร์อัตโนมัติ Real-time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VIP Tiers Benefits Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/15 rounded-3xl p-5 border border-amber-200/70 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  ระดับสิทธิพิเศษ VIP
                </span>
                <span className="text-[10px] font-black bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-full">5 Tiers</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3.5 leading-relaxed">
                ยิ่งแทงมาก ยิ่งสะสมยอดเลื่อนระดับ VIP เพื่อรับโบนัสวันเกิดและอัตราจ่ายพิเศษ
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-amber-200/40">
                  <span className="font-bold text-slate-800">VIP Bronze - Silver</span>
                  <span className="font-mono font-semibold text-emerald-800">คืนยอด 3%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-200/40">
                  <span className="font-bold text-slate-800">VIP Gold - Platinum</span>
                  <span className="font-mono font-semibold text-emerald-800">คืนยอด 5%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-800">VIP Diamond</span>
                  <span className="font-mono font-black text-amber-800">ผู้จัดการส่วนตัว 24h</span>
                </div>
              </div>
            </div>

            {/* Support Hotline */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 text-slate-800 flex items-center justify-between shadow-2xs">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">มีข้อสงสัยเรื่องโปรโมชั่น?</h4>
                <p className="text-[11px] text-slate-400">ติดต่อเจ้าหน้าที่ได้ตลอด 24 ชั่วโมง</p>
              </div>
              <button
                onClick={() => navigate('/support')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                สอบถาม
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* Promotion Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {selected.image_url && (
              <img src={selected.image_url} alt={selected.title} className="w-full aspect-[16/9] object-cover rounded-2xl mb-4" />
            )}

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-black text-slate-900">{selected.title}</h2>
              {selected.badge_text && (
                <span className={`${BADGE_COLORS[selected.badge_text] || 'bg-emerald-700'} text-white text-[10px] font-black px-2.5 py-0.5 rounded-full`}>
                  {selected.badge_text}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">{selected.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {selected.bonus_amount > 0 && (
                <div className="bg-emerald-50 rounded-2xl p-2.5 text-center border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold">โบนัส</p>
                  <p className="font-extrabold text-emerald-800 text-base">{selected.bonus_amount}฿</p>
                </div>
              )}
              {selected.bonus_rate > 0 && (
                <div className="bg-emerald-50 rounded-2xl p-2.5 text-center border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold">อัตราโบนัส</p>
                  <p className="font-extrabold text-emerald-800 text-base">+{selected.bonus_rate}%</p>
                </div>
              )}
              {selected.min_deposit > 0 && (
                <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">ฝากขั้นต่ำ</p>
                  <p className="font-extrabold text-slate-800 text-base">{selected.min_deposit}฿</p>
                </div>
              )}
              {selected.turnover_multiplier > 0 && (
                <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">เทิร์นโอเวอร์</p>
                  <p className="font-extrabold text-slate-800 text-base">{selected.turnover_multiplier}x</p>
                </div>
              )}
            </div>

            {selected.allowed_game && (
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-blue-500 text-sm">sports_esports</span>
                <span className="text-slate-600 font-semibold">เล่นได้เฉพาะ: {GAME_LABEL[selected.allowed_game]}</span>
              </div>
            )}

            {usedPromoIds.has(selected.id) ? (
              <div className="mt-4 bg-slate-100 rounded-2xl p-3 text-center">
                <span className="text-xs font-bold text-slate-500">✅ คุณรับโปรโมชั่นนี้ไปแล้ว</span>
              </div>
            ) : (
              <button
                onClick={() => handleAccept(selected)}
                className="mt-4 w-full bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 rounded-2xl font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                ฝากเงินเพื่อรับโปรโมชั่นนี้
              </button>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Promotions;
