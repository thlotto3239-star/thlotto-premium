import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6H6WWef9PagUoZE5wOGcOcUgkz0OVhCVR4hV-EvPgVrG2532EPd3cNJzjfyyoIfvdzAek-nFNVvNp/pub?gid=36966565&single=true&output=csv';

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return { code: cols[0], name: cols[1], date: cols[2], main: cols[3], top3: cols[4], col6: cols[5], bot2: cols[6], logo: cols[7] };
  }).filter(r => r.code);
};

const isPending = (v) => {
  if (!v) return true;
  const s = v.trim().toLowerCase();
  return !s || s === 'รอผล' || /^[x\s]+$/i.test(s);
};

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '';
  const match = dateStr.match(/(\d{1,2})\s+([\u0e00-\u0e7f]+)\s+(\d{4})/);
  if (match) return `งวดวันที่ ${match[1]} ${match[2]} ${match[3]}`;
  return dateStr;
};

const Home = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [govResult, setGovResult] = useState(null);
  const [draws, setDraws] = useState([]);
  const [popularLotteries, setPopularLotteries] = useState([]);
  const [banners, setBanners] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [currentPromo, setCurrentPromo] = useState(0);
  const promoSliderRef = useRef(null);
  const bannerSliderRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1+2. Fetch markets with accurate countdown from draw_schedules
        const { data: marketsData } = await supabase.rpc('get_markets_with_countdown');
        const drawData = (marketsData || []).filter(m => m.is_open);
        const popularData = (marketsData || []).slice(0, 8);

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

        setDraws(drawData || []);
        setPopularLotteries(popularData || []);
        setBanners(bannerData || []);
        setPromotions(promoData || []);
        setArticles(articleData || []);
        setAnnouncements(announcementData || []);
        setTrending(trendingData || []);

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
    navigate(`/deposit?promo=${promo.id}&amount=${promo.min_deposit || 100}`);
  };

  useEffect(() => {
    const fetchGov = () => {
      fetch(CSV_URL)
        .then(r => r.text())
        .then(text => {
          const rows = parseCSV(text);
          const gov = rows.find(r => r.code === 'TH_GOV' || r.name?.includes('รัฐบาล'));
          if (gov) { console.log('GOV ROW:', gov); setGovResult(gov); }
        })
        .catch(err => console.error('CSV fetch error:', err));
    };
    fetchGov();
    const interval = setInterval(fetchGov, 60000);
    return () => clearInterval(interval);
  }, []);

  const announcementText = announcements.length > 0
    ? announcements.map(a => a.content).join('  •  ')
    : 'ประกาศ: ระบบฝาก-ถอน อัตโนมัติ รวดเร็ว ทันใจ มั่นคง ปลอดภัย 100% บริการตลอด 24 ชั่วโมง';

  return (
    <div className="bg-white text-gray-900 pb-24 font-body min-h-screen">

      <AppHeader announcements={announcements} />

      <main className="px-4 py-4 space-y-8">

        {/* Hero Slider */}
        <section>
          <div ref={bannerSliderRef} className="rounded-[2.5rem] aspect-[2/1] relative overflow-hidden flex no-scrollbar snap-x snap-mandatory overflow-x-auto">
            {banners.length > 0 ? banners.map((banner) => (
              <div key={banner.id} className="min-w-full h-full relative snap-center flex-shrink-0">
                <img alt={banner.title || 'Banner'} className="absolute inset-0 w-full h-full object-cover" src={banner.image_url} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)' }}></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end text-white">
                  <h2 className="text-2xl font-bold mb-1 leading-tight">{banner.title}</h2>
                  <p className="text-sm text-white/90 font-light mb-3">{banner.description}</p>
                  <Link to={banner.link_url || '/deposit'} className="bg-white text-primary w-fit px-6 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform">รับสิทธิ์เลย</Link>
                </div>
              </div>
            )) : (
              <>
                <div className="min-w-full h-full relative snap-center flex-shrink-0">
                  <img alt="Slider 1" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZH_m9ENZGN80NP3wd1NIVL-KiliSbBU7-mLDJ2AjbAmjTAsP_KhcF7bSZa_yGVXbhl9Znpr0FAdBqGDnlwcI9gP-z6i5F9tM1gp1_njxIJ2HHaAwIjF_YizgXU4S7UiiSlHg0cAQxa9A5F1jGnnSVnLJAg-X6jEPs6icfIlQmrUWcqV02GOnWaP5Ua4OJgHPhCXf4ZGa27CcKP6zGcYgUJD8nSkJrgkM3ktkhSqPLzaJxHYoPBTbaFKFy9sFJrXvzopUcvsLSDQ" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)' }}></div>
                  <div className="relative z-10 p-6 h-full flex flex-col justify-end text-white">
                    <h2 className="text-2xl font-bold mb-1 leading-tight">เพิ่มโชคเป็นสองเท่า</h2>
                    <p className="text-sm text-white/90 font-light mb-3">ฝากเงินวันนี้ รับเครดิตเพิ่มทันที 10%</p>
                    <Link to="/deposit" className="bg-white text-primary w-fit px-6 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform">รับสิทธิ์เลย</Link>
                  </div>
                </div>
                <div className="min-w-full h-full relative snap-center flex-shrink-0">
                  <img alt="Slider 2" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8sRUTX5blhRhXdM3K-EJl9-nyIHzOM8KnD931ewJE3TZ5sISdORqFnb2ZKnmKEmOMqQfo_PpAtFTwvNHDWb_Ut-ZF02gj5PZ8H11_H_poW0x70znwyhyCPztyMyPjfb3r8ZxEu7mN6K801aHN4DDXmm0xPfJiGp97701XAXaF23DawxuacLRRdcMWQ0idLgw6YK4mL2n-_yIejeKQydUjyww8ncFdP133iZ5RX1p5ic0TNi1waxZ21triA8BDsDDy5ESeKzXrsA" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)' }}></div>
                  <div className="relative z-10 p-6 h-full flex flex-col justify-end text-white">
                    <h2 className="text-2xl font-bold mb-1 leading-tight">แนะนำเพื่อนรับโบนัส</h2>
                    <p className="text-sm text-white/90 font-light mb-3">รับส่วนแบ่ง 0.6% จากยอดเดิมพัน</p>
                    <Link to="/affiliate" className="bg-white text-primary w-fit px-6 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform">แนะนำตอนนี้</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Thai Government Lotto Card */}
        <section>
          <div className="rounded-[2.5rem] p-6 text-white" style={{ background: 'linear-gradient(135deg, rgb(22, 68, 30) 0%, rgb(13, 121, 4) 100%)' }}>
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <img alt="Seal" className="w-full h-full object-cover" src={govResult?.logo || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Government_Lottery_Office.png/240px-Seal_of_the_Government_Lottery_Office.png'} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold whitespace-nowrap truncate">สลากกินแบ่งรัฐบาล</h3>
                  <p className="text-white/80 text-xs whitespace-nowrap truncate">{govResult?.date ? formatThaiDate(govResult.date) : 'กำลังโหลด...'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 ${govResult && !isPending(govResult.main) ? 'bg-green-400 text-white' : 'bg-red-500 text-white'}`}>
                {govResult && !isPending(govResult.main) ? 'ประกาศผลแล้ว' : 'รอประกาศผล'}
              </span>
            </div>
            <div className="text-center mb-8">
              <p className="text-xs text-white/80 mb-3 font-medium tracking-widest">รางวัลที่ 1</p>
              {govResult ? (
                <div className="flex justify-center gap-2">
                  {govResult.main.replace(/\s/g, '').split('').map((n, i) => (
                    <div key={i} className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl">{n}</div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-11 h-11 bg-white/20 rounded-full animate-pulse" />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-6 border-t border-white/10">
              <div>
                <p className="text-[10px] text-white/60 mb-1">3 ตัวหน้า</p>
                <p className="font-bold text-lg tracking-wider">{govResult ? govResult.top3 : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/60 mb-1">2 ตัวล่าง</p>
                <p className="font-bold text-lg tracking-wider">{govResult ? govResult.bot2 : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/60 mb-1">3 ตัวท้าย</p>
                <p className="font-bold text-lg tracking-wider">{govResult ? govResult.col6 : '—'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Lotteries */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">หวยยอดนิยม</h2>
              <span className="material-icons text-primary text-[20px]">trending_up</span>
            </div>
            <Link to="/lottery-list" className="bg-accent-red text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span>ดูทั้งหมด</span>
              <span className="material-icons text-[14px]">chevron_right</span>
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="min-w-[120px] flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))
            ) : popularLotteries.length > 0 ? popularLotteries.map((lottery) => (
              <div key={lottery.id} className="min-w-[120px] flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border border-gray-100 shrink-0">
                  <img alt={lottery.name} className="w-full h-full object-cover" src={lottery.logo_url} />
                </div>
                <h3 className="font-bold text-sm mb-1 text-center whitespace-nowrap truncate w-full">{lottery.name}</h3>
                <div className="flex items-center gap-1 text-accent-red text-[11px] font-bold mb-3">
                  <span className="material-icons text-[12px]">schedule</span>
                  <span>{formatTime(timeLeft[lottery.id] || 0)}</span>
                </div>
                <button
                  onClick={() => navigate(`/betting?draw=${lottery.id}`)}
                  className="w-full text-white py-2 rounded-full text-[11px] font-bold active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(to bottom, rgb(22, 68, 30), rgb(13, 121, 4))' }}
                >แทงเลย</button>
              </div>
            )) : (
              <p className="text-gray-400 text-xs py-4 italic">ไม่มีหวยยอดนิยมในขณะนี้</p>
            )}
          </div>
        </section>

        {/* Trending Section (มาแรง) */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="material-icons text-accent-red">local_fire_department</span>
            <h2 className="text-lg font-bold">มาแรง</h2>
          </div>
          <div className="space-y-3">
            {trending.length > 0 ? trending.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-50 flex items-center p-4 gap-4 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => navigate(item.link || '/lottery-list')}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    : <span className="material-icons text-primary text-5xl">timer</span>
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-md">{item.title}</h4>
                    <span className="bg-accent-red text-white text-[8px] px-2 py-0.5 rounded-full font-bold">HOT</span>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">{item.code}</p>
                  <button
                    className="text-white px-5 py-1.5 rounded-full text-[11px] font-bold mt-3"
                    style={{ background: 'linear-gradient(to bottom, rgb(22, 68, 30), rgb(13, 121, 4))' }}
                  >เล่นเลย</button>
                </div>
              </div>
            )) : (
              <div
                className="bg-white rounded-3xl overflow-hidden border border-gray-50 flex items-center p-4 gap-4 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => navigate('/lottery-list')}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                  <span className="material-icons text-primary text-5xl">timer</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-md">หวยไทย 1 นาที</h4>
                    <span className="bg-primary text-white text-[8px] px-2 py-0.5 rounded-full font-bold">HOT</span>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">ออกผลทุก 1 นาที ตลอด 24 ชั่วโมง</p>
                  <button
                    className="text-white px-5 py-1.5 rounded-full text-[11px] font-bold mt-3"
                    style={{ background: 'linear-gradient(to bottom, rgb(22, 68, 30), rgb(13, 121, 4))' }}
                  >เล่นเลย</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Special Promotions */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">โปรโมชั่นพิเศษ</h2>
              <span className="material-icons text-primary text-[20px]">loyalty</span>
            </div>
            <Link to="/promotions" className="bg-accent-red text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span>ดูทั้งหมด</span>
              <span className="material-icons text-[14px]">chevron_right</span>
            </Link>
          </div>
          <div ref={promoSliderRef} className="rounded-3xl overflow-hidden flex no-scrollbar snap-x snap-mandatory overflow-x-auto" id="promo-slider">
            {promotions.length > 0 ? promotions.map((promo) => (
              <div key={promo.id} className="min-w-full relative snap-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedPromo(promo)}>
                {promo.image_url ? (
                  <div className="h-40 relative overflow-hidden">
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 p-6 flex flex-col justify-between text-white">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{promo.title}</h3>
                        <p className="text-white/90 text-sm line-clamp-2">{promo.description}</p>
                      </div>
                      <div className="flex justify-end">
                        <button className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold">รับโปรโมชั่น</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 p-6 flex flex-col justify-between text-white" style={{ background: 'linear-gradient(to right, #1a7e2a, #0e5b29)' }}>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{promo.title}</h3>
                      <p className="text-white/80 text-sm">{promo.description}</p>
                    </div>
                    <div className="flex justify-end">
                      <button className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold">รับโปรโมชั่น</button>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <>
                <div className="min-w-full relative snap-center flex-shrink-0">
                  <div className="h-40 p-6 flex flex-col justify-between text-white" style={{ background: 'linear-gradient(to right, #1a7e2a, #0e5b29)' }}>
                    <div>
                      <h3 className="text-xl font-bold mb-1">แนะนำเพื่อน รับโบนัส</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-accent-gold font-black text-3xl">0.6%</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">จากยอดเดิมพัน</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-white/80">รับส่วนแบ่งไม่อั้น ยิ่งชวนยิ่งได้</p>
                      <Link to="/affiliate" className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold">รับโปรโมชั่น</Link>
                    </div>
                  </div>
                </div>
                <div className="min-w-full relative snap-center flex-shrink-0">
                  <div className="h-40 p-6 flex flex-col justify-between text-white" style={{ background: 'linear-gradient(to right, #ef4444, #7f1d1d)' }}>
                    <div>
                      <h3 className="text-xl font-bold mb-1">สมาชิกใหม่ รับเครดิตฟรี</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-3xl">100</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">บาททันที</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-white/80">เพียงฝากครั้งแรกขั้นต่ำ 300 บาท</p>
                      <Link to="/deposit" className="bg-white text-accent-red px-4 py-1.5 rounded-full text-xs font-bold">รับโปรโมชั่น</Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Special Payout Rates */}
        <section className="rounded-[2.5rem] p-6 overflow-hidden relative bg-emerald-treasury">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">อัตราจ่ายพิเศษ</h2>
            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <span className="text-[10px] text-white font-bold">สูงสุด 10,000</span>
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="flex animate-marquee-payout whitespace-nowrap gap-3">
              {[
                { label: 'สามตัวตรง', value: '950' },
                { label: 'สี่ตัวตรง', value: '10,000' },
                { label: 'สองตัวบน/ล่าง', value: '100' },
                { label: 'สามตัวตรง', value: '950' },
                { label: 'สี่ตัวตรง', value: '10,000' },
                { label: 'สองตัวบน/ล่าง', value: '100' },
              ].map((item, i) => (
                <div key={i} className="min-w-[140px] bg-white rounded-2xl flex flex-col items-center justify-center p-4 text-center shrink-0">
                  <p className="text-[10px] text-gray-400 font-bold mb-1">{item.label}</p>
                  <p className="text-2xl font-black text-accent-red leading-tight">{item.value}</p>
                  <p className="text-[9px] text-gray-400 font-bold mb-3">บาทละ</p>
                  <div className="flex items-center gap-1.5">
                    <img className="w-3.5 h-3.5" src="https://lh3.googleusercontent.com/aida/ADBb0ugEuF0yZYDIuP2IxcB73hvCJ3cGYsYKqG7u62YBmKlm1J8jLS0ZM4B_WRTHk50p1CD5RZNeieJpib5low97oRcWDf3OVg24UI0GJeoQnIQgAbrhdze2PtU_8J2QY_ijiHirVH470MHPj1nmh9ip8UgAoizlVElm3b6CgfuGXiz__WHJ50Isr4rAmsn4DunYzNT4yfl7PsHvwsTiueDqOzggsVrCZra0S9zhSvgP74XVzz6S1wKpaMaapxPnz4AUWrbTtKVWmjQp" alt="logo" />
                    <span className="text-[8px] font-black text-emerald-treasury">TH-LOTTO</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lucky Wheel Banner */}
        <section>
          <div className="relative rounded-3xl overflow-hidden h-44 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate('/lucky-wheel')}>
            <img alt="Lucky Wheel" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE_XhmAUlmz16WTp7uaSwSysyYQNU3kpaWipJyEx7S1JD1GlqT3ged1ngCO0SCNk7af7h4bUNPwb4xSS6vnFTuG9v-rGBDf15x9mA1gIH60sGwGXXmheJfEhZiY5TUWKR0z_00HQWSxsvlsp2XDKU76uXjpdBBKiqKSRBBgrswuNnD2xX_Tcj6ghPYL3L5O7EZSru3jnbXbat9UGEaCIqDq2YWV8_QF_zwZq3yyNhV2d1XBXheUgDMNHyedaapayHFcBi19040iQ" />
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute bottom-4 right-6">
              <button className="bg-white text-primary px-8 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                <span className="material-icons text-sm">casino</span>
                หมุนเลย!
              </button>
            </div>
          </div>
        </section>

        {/* Articles & News */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">บทความและข่าวสาร</h2>
              <span className="material-icons text-primary text-[20px]">newspaper</span>
            </div>
            <Link to="/articles" className="bg-accent-red text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span>ดูทั้งหมด</span>
              <span className="material-icons text-[14px]">chevron_right</span>
            </Link>
          </div>
          {articles.length > 0 ? articles.map((article) => (
            <div key={article.id} onClick={() => navigate(`/articles/${article.id}`)} className="bg-white rounded-3xl overflow-hidden border border-gray-50 group mb-4 cursor-pointer active:scale-[0.98] transition-all">
              <div className="h-44 relative">
                <img alt={article.title} className="w-full h-full object-cover" src={article.image_url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop'} />
                <div className="absolute top-4 left-4">
                  <span className="bg-accent-red text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">{article.category || 'ข่าวประกาศ'}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-md mb-2">{article.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{article.sub_content || article.content?.slice(0, 120) || ''}</p>
                <div className="text-primary text-sm font-bold flex items-center gap-1">
                  อ่านต่อ <span className="material-icons text-sm">arrow_forward</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-50 group">
              <div className="h-44 relative">
                <img alt="News" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcxihAZw-dkDidV--5la9GBHlrPK0Pc3wOHcbDeloFUkGCMVE7i-1DDPJfrPGq52WodowfWE4uUikQGLoT5GdcUVJs4xGeP-yy4j7knWToBPN0iRE0vRDXKOtQZYQFEnG12ZJPVluLDBVZgSmJSIr0hRGkKTEjeJb5DNMR9ULeg2x0UaEZcjuAtGVCoOhKACACS9XNfl9RhqV9iJICPX9Xrt3S5MgcpDiHUqtTCo9MkinUYkX43Q-iEzF7yHHc0NEeM1FpJCv2ZA" />
                <div className="absolute top-4 left-4">
                  <span className="bg-accent-red text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">ข่าวประกาศ</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-md mb-2">ตรวจสอบรางวัลใหญ่ งวดล่าสุด และวิธีขึ้นเงินรางวัล</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">ตรวจสอบรายชื่อผู้โชคดีที่ได้รับรางวัลใหญ่และวิธีการขึ้นเงินรางวัลที่สะดวกที่สุดผ่านระบบอัตโนมัติ...</p>
                <button className="text-primary text-sm font-bold flex items-center gap-1">
                  อ่านต่อ <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Promotion Detail Modal */}
      {selectedPromo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedPromo(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white z-10"
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
    </div>
  );
};

export default Home;
