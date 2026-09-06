import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';
import logger from '../services/logger';

const isPending = (v) => {
  if (!v) return true;
  const s = v.trim().toLowerCase();
  return !s || s === 'รอผล' || /^[x\s]+$/i.test(s);
};

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '';
  const match = dateStr.match(/(\d{1,2})\s+([฀-๿]+)\s+(\d{4})/);
  if (match) return `งวดวันที่ ${match[1]} ${match[2]} ${match[3]}`;
  return dateStr;
};

const Home = () => {
  const navigate = useNavigate();
  const [govResult, setGovResult] = useState(null);
  const [_draws, setDraws] = useState([]);
  const [popularLotteries, setPopularLotteries] = useState([]);
  const [banners, setBanners] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [trending, setTrending] = useState([]);
  const [payoutRates, setPayoutRates] = useState([]);
  const [instantCfg, setInstantCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [luckyWheelBanner, setLuckyWheelBanner] = useState('');
  const [timeLeft, setTimeLeft] = useState({});
  const [_currentBanner, setCurrentBanner] = useState(0);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [_currentPromo, setCurrentPromo] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const promoSliderRef = useRef(null);
  const bannerSliderRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1+2. Fetch markets with accurate countdown from draw_schedules
        const { data: marketsData } = await supabase.rpc('get_markets_with_countdown');
        const drawData = (marketsData || []).filter(m => m.is_open);
        const popularData = (marketsData || []).filter(m => m.show_in_popular);

        // 3. Fetch Banners (sliders)
        const { data: bannerData } = await supabase
          .from('sliders')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        // 4. Fetch Promotions
        const { data: promoData } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('id', { ascending: false });

        // 5. Fetch Articles
        const { data: articleData } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3);

        // 6. Fetch Announcements
        const { data: announcementData } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        // 7. Fetch Trending (มาแรง)
        const { data: trendingData } = await supabase
          .from('trending_items')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        // 8. Fetch Lucky Wheel Banner URL
        const { data: wheelData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'lucky_wheel_banner_url')
          .single();
        if (wheelData?.value) setLuckyWheelBanner(wheelData.value);

        // 10. Fetch Popup โฆษณา
        const { data: popupSettings } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['popup_enabled', 'popup_title', 'popup_description', 'popup_image_url']);
        const popupMap = {};
        (popupSettings || []).forEach(s => { popupMap[s.key] = s.value; });
        if (popupMap.popup_enabled?.toUpperCase() === 'TRUE' && (popupMap.popup_title || popupMap.popup_image_url)) {
          const dismissed = localStorage.getItem('popup_dismissed');
          const today = new Date().toISOString().slice(0, 10);
          if (dismissed !== today) {
            setPopupData({
              title: popupMap.popup_title || '',
              description: popupMap.popup_description || '',
              image_url: popupMap.popup_image_url || '',
            });
            setShowPopup(true);
          }
        }

        // 9. หวย 1 นาที — config การแสดงผล (ตาม toggle ที่แอดมินตั้ง)
        const { data: instSettings } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['instant_name', 'instant_logo_url', 'instant_show_popular', 'instant_show_trending']);
        const instMap = {};
        (instSettings || []).forEach(s => { instMap[s.key] = s.value; });
        setInstantCfg({
          name: instMap.instant_name || 'หวยไทย 1 นาที',
          logo_url: instMap.instant_logo_url || '',
          show_popular: instMap.instant_show_popular === 'true',
          show_trending: instMap.instant_show_trending !== 'false',
        });

        // 11. Fetch Payout Rates — ดึงอัตราจ่ายสูงสุดแต่ละประเภท
        const { data: ratesData } = await supabase
          .from('payout_rates')
          .select('bet_type, rate')
          .in('bet_type', ['6DIGIT', '4TOP', '3TOP', '3TODE', '3FRONT', '3BOTTOM', '2TOP', '2BOTTOM', 'RUN_UP', 'RUN_DOWN'])
          .order('rate', { ascending: false });
        if (ratesData && ratesData.length > 0) {
          const maxByType = {};
          ratesData.forEach(r => {
            if (!maxByType[r.bet_type] || Number(r.rate) > Number(maxByType[r.bet_type]))
              maxByType[r.bet_type] = Number(r.rate);
          });
          const typeLabels = {
            '6DIGIT': 'หกตัวตรง', '4TOP': 'สี่ตัวตรง',
            '3TOP': 'สามตัวตรง', '3TODE': 'สามตัวโต๊ด',
            '3FRONT': 'สามตัวหน้า', '3BOTTOM': 'สามตัวท้าย',
            '2TOP': 'สองตัวบน', '2BOTTOM': 'สองตัวล่าง',
            'RUN_UP': 'วิ่งบน', 'RUN_DOWN': 'วิ่งล่าง',
          };
          const sorted = Object.entries(maxByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, rate]) => ({ label: typeLabels[type] || type, value: rate }));
          setPayoutRates(sorted);
        }

        setDraws(drawData || []);
        setPopularLotteries(popularData || []);
        setBanners(bannerData || []);
        setPromotions(promoData || []);
        setArticles(articleData || []);
        setAnnouncements(announcementData || []);
        const trendingMarkets = (marketsData || [])
          .filter(m => m.show_in_trending)
          .map(m => ({
            id: m.id,
            title: m.name,
            code: m.code,
            image_url: m.logo_url,
            link: m.code === 'THLOTTO_15M' ? '/lotto-15m' : `/betting?draw=${m.id}`,
            is_market: true,
          }));
        setTrending([...(trendingData || []), ...trendingMarkets]);

        // Initialize countdowns from accurate next_close_time
        const initialTimeLeft = {};
        (marketsData || []).forEach(market => {
          if (market.next_close_time) {
            initialTimeLeft[market.id] = Math.max(0, Math.floor((new Date(market.next_close_time) - Date.now()) / 1000));
          } else {
            initialTimeLeft[market.id] = 0;
          }
        });
        setTimeLeft(initialTimeLeft);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Timers
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = Math.max(0, next[id] - 1);
        });
        return next;
      });
    }, 1000);

    const bannerInterval = setInterval(() => {
      setBanners(prev => {
        if (prev.length === 0) return prev;
        setCurrentBanner(curr => {
          const next = (curr + 1) % prev.length;
          if (bannerSliderRef.current) {
            bannerSliderRef.current.scrollTo({ left: next * bannerSliderRef.current.offsetWidth, behavior: 'smooth' });
          }
          return next;
        });
        return prev;
      });
    }, 5000);

    const promoInterval = setInterval(() => {
      setCurrentPromo(prev => {
        setPromotions(promos => {
          if (promos.length === 0) return promos;
          const next = (prev + 1) % promos.length;
          if (promoSliderRef.current) {
            const itemWidth = promoSliderRef.current.offsetWidth;
            promoSliderRef.current.scrollTo({ left: next * itemWidth, behavior: 'smooth' });
          }
          setCurrentPromo(next);
          return promos;
        });
        return prev;
      });
    }, 3000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(bannerInterval);
      clearInterval(promoInterval);
    };
  }, []);

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'ปิดแล้ว';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}ว ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePromoAccept = (promo) => {
    setSelectedPromo(null);
    navigate(`/deposit?promo=${promo.promo_code || promo.id}&promoName=${encodeURIComponent(promo.title)}&amount=${promo.min_deposit || 100}`);
  };

  useEffect(() => {
    const fetchGov = async () => {
      try {
        const { data, error } = await supabase.rpc('get_today_results');
        if (error) throw error;
        // Find TH_GOV market results
        const gov = (data || []).find(r => r.code === 'TH_GOV' || r.name?.includes('รัฐบาล'));
        if (gov) {
          // Map database field names to the ones expected by Home.jsx UI
          const mappedGov = {
            code: gov.code,
            name: gov.name,
            date: gov.draw_date,
            main: gov.result_main || 'xxxxxx',
            top3: gov.result_3front || 'xxx',
            col6: gov.result_3bottom || 'xxx',
            bot2: gov.result_2bottom || 'xx',
            logo: gov.logo_url
          };
          setGovResult(mappedGov);
        }
      } catch (err) {
        logger.error('Error fetching government results via RPC:', err);
      }
    };
    fetchGov();
    const interval = setInterval(fetchGov, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll banners
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      if (bannerSliderRef.current) {
        const el = bannerSliderRef.current;
        const cardWidth = el.firstElementChild ? el.firstElementChild.clientWidth + 16 : 400;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleScrollBanner = (direction) => {
    if (bannerSliderRef.current) {
      const el = bannerSliderRef.current;
      const cardWidth = el.firstElementChild ? el.firstElementChild.clientWidth + 16 : 400;
      el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#f8fafc] text-gray-900 pb-24 font-body min-h-screen antialiased">

      <AppHeader announcements={announcements} />

      <main className="max-w-[1700px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-7 sm:space-y-8">

        {/* ════════════ 1. MULTI-BANNER CONTINUOUS SLIDER (ต่อกัน ตามขนาดรูปจริง) ════════════ */}
        <section className="relative group">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">กิจกรรม & โปรโมชั่นพิเศษ</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScrollBanner('left')}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="ก่อนหน้า"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => handleScrollBanner('right')}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="ถัดไป"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Continuous Multi-Card Track */}
          <div
            ref={bannerSliderRef}
            className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 select-none"
          >
            {banners.length > 0 ? banners.map((banner) => (
              <div
                key={banner.id}
                className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0 snap-start relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all group/banner cursor-pointer border border-slate-200/80 bg-slate-900"
                onClick={() => banner.link_url && navigate(banner.link_url)}
              >
                {/* Banner Image at True Proportion */}
                <div className="aspect-[16/9] w-full relative overflow-hidden">
                  <img
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500"
                    src={banner.image_url}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-white z-10">
                    <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow mb-1 line-clamp-1">{banner.title}</h3>
                    {banner.description && (
                      <p className="text-xs text-white/90 line-clamp-1 font-medium mb-2.5 drop-shadow-xs">{banner.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        to={banner.link_url || '/deposit'}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-1.5 rounded-full text-xs font-black active:scale-95 transition-transform shadow-sm inline-flex items-center gap-1"
                      >
                        <span>รับสิทธิ์เลย</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        OFFICIAL
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <>
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0 snap-start relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900">
                  <div className="aspect-[16/9] w-full relative">
                    <img alt="Slider 1" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZH_m9ENZGN80NP3wd1NIVL-KiliSbBU7-mLDJ2AjbAmjTAsP_KhcF7bSZa_yGVXbhl9Znpr0FAdBqGDnlwcI9gP-z6i5F9tM1gp1_njxIJ2HHaAwIjF_YizgXU4S7UiiSlHg0cAQxa9A5F1jGnnSVnLJAg-X6jEPs6icfIlQmrUWcqV02GOnWaP5Ua4OJgHPhCXf4ZGa27CcKP6zGcYgUJD8nSkJrgkM3ktkhSqPLzaJxHYoPBTbaFKFy9sFJrXvzopUcvsLSDQ" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-5 flex flex-col justify-end text-white">
                      <h3 className="text-base sm:text-lg font-black">เพิ่มโชคเป็นสองเท่า</h3>
                      <p className="text-xs text-white/80 mb-2">ฝากเงินวันนี้ รับเครดิตเพิ่มทันที 10%</p>
                      <Link to="/deposit" className="w-fit bg-white text-emerald-800 px-4 py-1.5 rounded-full text-xs font-black">รับสิทธิ์เลย</Link>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0 snap-start relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900">
                  <div className="aspect-[16/9] w-full relative">
                    <img alt="Slider 2" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8sRUTX5blhRhXdM3K-EJl9-nyIHzOM8KnD931ewJE3TZ5sISdORqFnb2ZKnmKEmOMqQfo_PpAtFTwvNHDWb_Ut-ZF02gj5PZ8H11_H_poW0x70znwyhyCPztyMyPjfb3r8ZxEu7mN6K801aHN4DDXmm0xPfJiGp97701XAXaF23DawxuacLRRdcMWQ0idLgw6YK4mL2n-_yIejeKQydUjyww8ncFdP133iZ5RX1p5ic0TNi1waxZ21triA8BDsDDy5ESeKzXrsA" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-5 flex flex-col justify-end text-white">
                      <h3 className="text-base sm:text-lg font-black">แนะนำเพื่อนรับโบนัส</h3>
                      <p className="text-xs text-white/80 mb-2">รับส่วนแบ่ง 0.6% จากยอดเดิมพัน</p>
                      <Link to="/affiliate" className="w-fit bg-white text-emerald-800 px-4 py-1.5 rounded-full text-xs font-black">แนะนำตอนนี้</Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ════════════ 2. THREE-LAYOUT PC DASHBOARD GRID ════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ──────── LAYOUT 1: ฝั่งซ้าย (สลากกินแบ่งรัฐบาล & Fast Games) ──────── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Thai Government Lotto Ticket Card */}
            <div
              className="rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-sm"
              style={{ background: 'linear-gradient(135deg, rgb(22, 68, 30) 0%, rgb(13, 121, 4) 100%)' }}
            >
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-full overflow-hidden shrink-0 border-2 border-white/30 bg-white/10 p-0.5">
                    <img
                      alt="Seal"
                      className="w-full h-full object-cover"
                      src={govResult?.logo || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Government_Lottery_Office.png/240px-Seal_of_the_Government_Lottery_Office.png'}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black tracking-tight truncate">สลากกินแบ่งรัฐบาล</h3>
                    <p className="text-white/80 text-xs truncate">{govResult?.date ? formatThaiDate(govResult.date) : 'งวดประจำวันที่ 1 และ 16'}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap shrink-0 shadow-2xs ${govResult && !isPending(govResult.main) ? 'bg-emerald-400 text-slate-900' : 'bg-red-500 text-white'}`}>
                  {govResult && !isPending(govResult.main) ? '● ประกาศผลแล้ว' : '● รอผลออก 15:30'}
                </span>
              </div>

              {/* 6-Digit Prize 1 Balls */}
              <div className="text-center mb-6 bg-black/15 rounded-2xl p-4 border border-white/10 backdrop-blur-xs">
                <p className="text-xs text-white/80 mb-2.5 font-bold tracking-widest uppercase">รางวัลที่ 1</p>
                {govResult ? (
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {govResult.main.replace(/\s/g, '').split('').map((n, i) => (
                      <div key={i} className="size-10 sm:size-11 bg-white rounded-full flex items-center justify-center text-primary font-black text-xl shadow-md">
                        {n}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="size-10 sm:size-11 bg-white/20 rounded-full animate-pulse" />
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Front / 2 Bottom / 3 Bottom */}
              <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-white/15">
                <div className="bg-white/10 rounded-xl p-2.5">
                  <p className="text-[11px] text-white/70 mb-0.5 font-semibold">3 ตัวหน้า</p>
                  <p className="font-black text-base sm:text-lg tracking-wider">{govResult ? govResult.top3 : 'xxx'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5">
                  <p className="text-[11px] text-white/70 mb-0.5 font-semibold">2 ตัวล่าง</p>
                  <p className="font-black text-base sm:text-lg tracking-wider text-amber-300">{govResult ? govResult.bot2 : 'xx'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5">
                  <p className="text-[11px] text-white/70 mb-0.5 font-semibold">3 ตัวท้าย</p>
                  <p className="font-black text-base sm:text-lg tracking-wider">{govResult ? govResult.col6 : 'xxx'}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <Link to="/results" className="text-xs font-bold text-white/90 hover:text-white inline-flex items-center gap-1">
                  <span>ตรวจผลสลากทั้งหมด</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  to="/betting?draw=gov"
                  className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-1.5 rounded-full text-xs font-black shadow-sm"
                >
                  แทงรัฐบาล
                </Link>
              </div>
            </div>

            {/* Fast Game 1: หวยไทย 1 นาที (Instant Lotto Live Card) */}
            {instantCfg && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary shrink-0">
                      {instantCfg.logo_url ? (
                        <img src={instantCfg.logo_url} alt={instantCfg.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-sm text-slate-900">{instantCfg.name}</h4>
                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">FAST</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">ออกผลทุก 1 นาที ตลอด 24 ชั่วโมง</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>รอบปัจจุบันกำลังรับแทง</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    พร้อมเดิมพัน
                  </span>
                </div>
                <button
                  onClick={() => navigate('/instant-lottery')}
                  className="w-full py-3 rounded-2xl text-white font-black text-xs sm:text-sm tracking-wider shadow-sm active:scale-95 transition-transform cursor-pointer"
                  style={{ background: 'linear-gradient(to right, rgb(22, 68, 30), rgb(13, 121, 4))' }}
                >
                  แทงหวย 1 นาที ตอนนี้
                </button>
              </div>
            )}

            {/* Fast Game 2: ล็อตโต้ 15 นาที (Lotto 15M Live Studio) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-sm text-slate-900">ล็อตโต้ 15 นาที</h4>
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">ออกผลรางวัลสดทุก 15 นาที</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/lotto-15m')}
                className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:border-primary hover:text-primary font-black text-xs tracking-wide transition-colors cursor-pointer mt-1"
              >
                เข้าชมถ่ายทอดสด & แทงสด
              </button>
            </div>

          </div>

          {/* ──────── LAYOUT 2: ตรงกลาง (ตลาดหวยเปิดรับแทง & ยอดนิยม & ข่าวสาร) ──────── */}
          <div className="lg:col-span-5 space-y-6">

            {/* Popular Lotteries Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">ตลาดหวยยอดนิยม</h2>
                </div>
                <Link to="/lottery-list" className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-0.5">
                  <span>ดูทั้งหมด ({popularLotteries.length})</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>

              {/* 2-Column Market Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                  ))
                ) : popularLotteries.length > 0 ? (
                  popularLotteries.slice(0, 6).map((lottery) => (
                    <div
                      key={lottery.id}
                      className="bg-slate-50/70 hover:bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group/market"
                      onClick={() => navigate(lottery.code === 'THLOTTO_15M' ? '/lotto-15m' : `/betting?draw=${lottery.id}`)}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="size-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white shadow-2xs">
                          <img alt={lottery.name} className="w-full h-full object-cover" src={lottery.logo_url} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover/market:text-primary transition-colors truncate">
                            {lottery.name}
                          </h4>
                          <div className="flex items-center gap-1 text-[11px] text-red-500 font-bold mt-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>{formatTime(timeLeft[lottery.id] || 0)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          {lottery.payout_rate ? `จ่าย ฿${Number(lottery.payout_rate).toLocaleString()}` : 'อัตราจ่ายสูงสุด'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(lottery.code === 'THLOTTO_15M' ? '/lotto-15m' : `/betting?draw=${lottery.id}`);
                          }}
                          className="px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-xs active:scale-95 transition-transform"
                          style={{ background: 'linear-gradient(to right, rgb(22, 68, 30), rgb(13, 121, 4))' }}
                        >
                          แทงเลย
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400">ไม่มีหวยยอดนิยมในขณะนี้</div>
                )}
              </div>
            </div>

            {/* Trending Items (มาแรง) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">รายการมาแรง</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {trending.filter(item => item.link !== '/instant-lottery').slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 hover:bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(item.link || '/lottery-list')}
                  >
                    <div className="size-12 rounded-xl overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center border border-slate-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-2xl">timer</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{item.title}</h4>
                        <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.2 rounded-full font-black">HOT</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Articles & News (บทความ) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">newspaper</span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">บทความและข่าวสาร</h2>
                </div>
                <Link to="/articles" className="text-xs font-bold text-brand-600 hover:underline">
                  ดูทั้งหมด
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {articles.slice(0, 2).map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/articles/${article.id}`)}
                    className="rounded-2xl border border-slate-200/80 overflow-hidden hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="aspect-[16/9] w-full relative overflow-hidden bg-slate-100">
                      <img
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={article.image_url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop'}
                      />
                      <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        {article.category || 'ข่าวประกาศ'}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-primary transition-colors mb-1">
                        {article.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {article.sub_content || article.content?.slice(0, 80) || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ──────── LAYOUT 3: ฝั่งขวา (อัตราจ่ายพิเศษ, สิทธิประโยชน์, วงล้อ, โปรโมชั่น) ──────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Special Payout Rates Vertical Widget */}
            {payoutRates.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">อัตราจ่ายสูงสุด</h3>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    บาทละ 2 ล้าน
                  </span>
                </div>

                {/* Rates List */}
                <div className="space-y-2">
                  {payoutRates.slice(0, 6).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-50 hover:bg-emerald-50/50 p-2.5 rounded-xl border border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-xs font-black text-amber-600">
                        บาทละ ฿{Number(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lucky Wheel Widget */}
            <div
              className="relative rounded-3xl overflow-hidden p-5 text-white shadow-xs cursor-pointer active:scale-[0.98] transition-transform group"
              style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)' }}
              onClick={() => navigate('/lucky-wheel')}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  FREE DAILY SPIN
                </span>
                <span className="material-symbols-outlined text-amber-300 text-2xl group-hover:rotate-45 transition-transform">
                  casino
                </span>
              </div>
              <h3 className="text-lg font-black leading-tight mb-1">วงล้อเสี่ยงโชค</h3>
              <p className="text-xs text-white/80 font-medium mb-4">หมุนรับเครดิตและทองคำฟรีทุกวัน</p>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-white text-emerald-800 font-black text-xs shadow-md group-hover:bg-emerald-50 transition-colors"
              >
                เข้าสู่หน้าหมุนวงล้อ
              </button>
            </div>

            {/* Active Promotions Vertical Stack */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>loyalty</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">โปรโมชั่นสมาชิก</h3>
                </div>
                <Link to="/promotions" className="text-xs font-bold text-brand-600 hover:underline">
                  ทั้งหมด
                </Link>
              </div>

              <div className="space-y-3">
                {/* Affiliate Perk */}
                <div
                  className="rounded-2xl p-4 text-white cursor-pointer active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)' }}
                  onClick={() => navigate('/affiliate')}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-1">AFFILIATE PARTNER</p>
                  <h4 className="font-black text-sm mb-1">แนะนำเพื่อน รับคอม 0.6%</h4>
                  <p className="text-xs text-emerald-100/90 leading-snug">รับส่วนแบ่งไม่อั้น ยิ่งชวนมากยิ่งได้มาก</p>
                </div>

                {/* Promo from DB if available */}
                {promotions.slice(0, 2).map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-slate-50 hover:bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
                    onClick={() => setSelectedPromo(promo)}
                  >
                    <div>
                      <h4 className="font-black text-xs text-slate-900 line-clamp-1 mb-1">{promo.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{promo.description}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-700">สิทธิ์พิเศษ</span>
                      <span className="text-[11px] font-bold text-primary flex items-center gap-0.5">
                        ดูเงื่อนไข <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Promotion Detail Modal */}
      {selectedPromo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedPromo(null)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/20 flex items-center justify-center text-white z-10"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="h-48 relative">
              <img src={selectedPromo.image_url} alt={selectedPromo.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>
            <div className="p-6 pt-2">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedPromo.title}</h3>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-gray-600 text-sm leading-relaxed">{selectedPromo.detail_text || selectedPromo.description}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPromo(null)}
                  className="flex-1 py-3 rounded-full text-gray-400 font-bold text-sm border border-gray-200"
                >ปิด</button>
                <button
                  onClick={() => handlePromoAccept(selectedPromo)}
                  className="flex-[2] bg-primary text-white py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  ตกลงรับโปร
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* ════════════ Popup โฆษณา ════════════ */}
      {showPopup && popupData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-6" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            {popupData.image_url && (
              <img src={popupData.image_url} alt="โฆษณา" className="w-full aspect-square object-cover"/>
            )}
            <div className="p-5 space-y-2">
              {popupData.title && <h3 className="font-bold text-slate-800 text-base truncate">{popupData.title}</h3>}
              {popupData.description && <p className="text-slate-500 text-sm line-clamp-3">{popupData.description}</p>}
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setShowPopup(false)}
                  className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('popup_dismissed', new Date().toISOString().slice(0, 10));
                    setShowPopup(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 text-sm font-bold rounded-xl active:scale-95 transition"
                >
                  ไม่แสดงอีก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
