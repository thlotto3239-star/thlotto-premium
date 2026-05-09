import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../AuthContext';

// Realtime notifications สำหรับ user
// Subscribe ตลอดเวลาที่ login และแสดง Modal สำคัญ

const RealtimeNotification = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showSuccess, showInfo } = useModal();

  useEffect(() => {
    if (!user?.id) return;

    // 1. Subscribe การแจ้งเตือนใหม่จาก notifications table
    const notificationChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          
          // แสดง Modal ตามประเภท
          switch (notification.type) {
            case 'WIN':
              showSuccess(
                '🎉 ยินดีด้วย! คุณถูกรางวัล!',
                notification.body || 'เลขของคุณถูกรางวัลแล้ว',
                () => {
                  refreshProfile();
                }
              );
              break;
              
            case 'DEPOSIT_APPROVED':
              showSuccess(
                '💰 เงินเข้าแล้ว!',
                notification.body || 'การฝากเงินของคุณได้รับการอนุมัติ',
                () => {
                  refreshProfile();
                }
              );
              break;
              
            case 'WITHDRAWAL_APPROVED':
              showInfo(
                '✅ ถอนเงินสำเร็จ',
                notification.body || 'คำขอถอนเงินของคุณได้รับการอนุมัติ',
                () => {
                  refreshProfile();
                }
              );
              break;
              
            case 'WITHDRAWAL_REJECTED':
              showInfo(
                '❌ ถอนเงินไม่สำเร็จ',
                notification.body || 'คำขอถอนเงินถูกปฏิเสธ',
                () => {
                  refreshProfile();
                }
              );
              break;
              
            case 'COMMISSION':
              showSuccess(
                '💎 ได้รับคอมมิชชั่น!',
                notification.body || 'คุณได้รับคอมมิชชั่นจากการแนะนำเพื่อน',
                () => {
                  refreshProfile();
                }
              );
              break;
              
            default:
              // แจ้งเตือนทั่วไป ไม่ต้องแสดง Modal
              break;
          }
        }
      )
      .subscribe();

    // 2. Subscribe การอัพเดท wallet (เงินเข้า/ออก)
    const walletChannel = supabase
      .channel(`wallet_realtime:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // ตรวจสอบว่ามีการเปลี่ยนแปลง balance
          const oldBalance = payload.old?.balance || 0;
          const newBalance = payload.new?.balance || 0;
          const diff = newBalance - oldBalance;
          
          if (diff > 0 && diff > 100) {
            // เงินเข้าเยอะ แสดง Modal
            showSuccess(
              '💰 เงินเข้า!',
              `ยอดเงินเพิ่มขึ้น ฿${diff.toLocaleString()}`,
              () => {}
            );
          }
          
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [user?.id, showSuccess, showInfo, refreshProfile]);

  return null; // Component นี้ไม่ render อะไร
};

export default RealtimeNotification;
