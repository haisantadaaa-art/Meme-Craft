import React, { createContext, useContext, useState, useEffect } from 'react';

export const PRESET_TRACKS = [
  {
    id: 'co_trang',
    title: 'Thủy Chung x Sơn Thủy Trùng Mây (Cổ Trang Chillout)',
    category: 'Cổ Trang Chillout',
    videoId: 'DLjq3iLBZdA',
    url: 'https://www.youtube.com/watch?v=DLjq3iLBZdA',
    desc: 'Khúc ca phong vị tiên cảnh, thư thái an yên trên nông trại',
    icon: '🌸',
  },
  {
    id: 'lofi_chill',
    title: 'Nhạc Lofi Buồn Chill (Truong Chill)',
    category: 'Lofi Chillout',
    videoId: '7QHSSoIpkhY',
    url: 'https://www.youtube.com/watch?v=7QHSSoIpkhY',
    desc: 'Giai điệu lofi nhẹ nhàng thư giãn khi chăm sóc nông trại',
    icon: '🎧',
  },
];

const STORAGE_KEY = 'hayday_bgm_track_id';
const STORAGE_CUSTOM_KEY = 'hayday_bgm_custom_url';
const STORAGE_PLAYING_KEY = 'hayday_bgm_autoplay';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYING_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [currentTrack, setCurrentTrack] = useState(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      const found = PRESET_TRACKS.find((t) => t.id === savedId || t.videoId === savedId);
      if (found) return found;

      const customUrl = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (customUrl) {
        const videoId = extractYouTubeId(customUrl);
        if (videoId) {
          return {
            id: 'custom',
            title: 'Nhạc Tùy Chọn (YouTube)',
            category: 'Người Dùng Tải Lên',
            videoId,
            url: customUrl,
            desc: 'Danh sách phát cá nhân của bạn',
            icon: '🎵',
          };
        }
      }
    } catch (e) {
      console.warn('Music storage read error:', e);
    }
    return PRESET_TRACKS[0];
  });

  // Lưu lựa chọn vào localStorage
  useEffect(() => {
    try {
      if (currentTrack) {
        localStorage.setItem(STORAGE_KEY, currentTrack.videoId);
        if (currentTrack.id === 'custom') {
          localStorage.setItem(STORAGE_CUSTOM_KEY, currentTrack.url);
        }
      }
      localStorage.setItem(STORAGE_PLAYING_KEY, String(isPlaying));
    } catch (e) {
      console.warn('Music storage save error:', e);
    }
  }, [currentTrack, isPlaying]);

  // Đổi sang bài nhạc preset
  const selectPreset = (presetId) => {
    const track = PRESET_TRACKS.find((t) => t.id === presetId);
    if (track) {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // Đặt link YouTube tùy chọn
  const setCustomUrl = (url) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) return { success: false, msg: 'Link YouTube không hợp lệ!' };

    const newTrack = {
      id: 'custom',
      title: 'Nhạc Tùy Chọn (YouTube)',
      category: 'Tự Chọn',
      videoId,
      url,
      desc: 'Link phát nhạc riêng của bạn',
      icon: '✨',
    };
    setCurrentTrack(newTrack);
    setIsPlaying(true);
    return { success: true };
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <MusicContext.Provider
      value={{
        isMusicModalOpen,
        setIsMusicModalOpen,
        isPlaying,
        setIsPlaying,
        currentTrack,
        selectPreset,
        setCustomUrl,
        togglePlay,
      }}
    >
      {children}

      {/* Invisible YouTube Iframe Audio Player */}
      {currentTrack?.videoId && (
        <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-0">
          <iframe
            key={`${currentTrack.videoId}-${isPlaying}`}
            width="200"
            height="200"
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.videoId}?autoplay=${
              isPlaying ? 1 : 0
            }&controls=0&loop=1&playlist=${currentTrack.videoId}&mute=0&enablejsapi=1`}
            title="HayDay Background Music"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return ctx;
}

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.trim().match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  // Nếu người dùng chỉ gõ mã ID (11 ký tự)
  if (/^[\w-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}
