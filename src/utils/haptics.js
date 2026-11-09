/**
 * Universal Haptic Feedback Utility (Navigator Vibration API)
 * Hoạt động mượt mà trên trình duyệt di động Android/Chrome/PWA
 */

export const haptic = {
  // Rung nhẹ khi chạm nút hoặc đổi làn xe
  light: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (e) {
      // ignore
    }
  },

  // Rung vừa khi trả lời đúng, ăn điểm, nhặt boost
  medium: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
    } catch (e) {
      // ignore
    }
  },

  // Rung mạnh khi va chạm chướng ngại vật hoặc bấm sai số
  heavy: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 60]);
      }
    } catch (e) {
      // ignore
    }
  },

  // Nhịp rung thắng trận / sút vào lưới
  success: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 50, 40, 70]);
      }
    } catch (e) {
      // ignore
    }
  },

  // Nhịp rung bom nổ / thua ván đấu
  boom: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 200]);
      }
    } catch (e) {
      // ignore
    }
  },
};

export default haptic;
