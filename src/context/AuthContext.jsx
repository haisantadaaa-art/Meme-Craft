import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  db,
  ref,
  set,
  get,
  update,
  onValue,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from '../services/firebase';
import { sound } from '../utils/soundEffects';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hayday_party_user_v2';
const FARM_STORAGE_KEY = 'hayday_party_farm_v2';

export const AVATAR_LIST = [
  '👩‍🍳', '👨‍🍳', '🐱', '🐶', '🐰', '🐼',
  '🦊', '🐻', '🐨', '🦁', '🧋', '✨'
];

export const INITIAL_BARN = {
  wheat: 10,
  corn: 5,
  carrot: 5,
  strawberry: 2,
  egg: 2,
  milk: 2,
  bread: 1,
  butter: 1,
};

export const INITIAL_PLOTS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  crop: i < 2 ? 'wheat' : null,
  plantedAt: i < 2 ? Date.now() - 10000 : null,
  readyAt: i < 2 ? Date.now() + 5000 : null,
}));

export const INITIAL_CHICKENS = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  isFed: false,
  readyAt: null,
}));

export const INITIAL_COWS = Array.from({ length: 2 }, (_, i) => ({
  id: i + 1,
  isFed: false,
  readyAt: null,
}));

export const INITIAL_ORDERS = [
  {
    id: 'ord-1',
    customerName: 'Bác Ba Phi',
    customerTitle: 'Lão Nông Vui Tính',
    customerAvatar: '👨‍🌾',
    items: [{ item: 'wheat', count: 3 }, { item: 'egg', count: 2 }],
    rewardCoins: 120,
    rewardExp: 35,
  },
  {
    id: 'ord-2',
    customerName: 'Cô Bảy Cà Rốt',
    customerTitle: 'Chủ Tiệm Tạp Hóa',
    customerAvatar: '👩‍🌾',
    items: [{ item: 'carrot', count: 2 }, { item: 'bread', count: 1 }],
    rewardCoins: 180,
    rewardExp: 50,
  },
  {
    id: 'ord-3',
    customerName: 'Chú Tư Chăn Bò',
    customerTitle: 'Trại Trưởng Đồng Xanh',
    customerAvatar: '🤠',
    items: [{ item: 'corn', count: 3 }, { item: 'milk', count: 1 }],
    rewardCoins: 210,
    rewardExp: 65,
  },
  {
    id: 'ord-4',
    customerName: 'Bé Út Hảo Ngọt',
    customerTitle: 'Khách Vip Hội Chợ',
    customerAvatar: '👧',
    items: [{ item: 'strawberry', count: 2 }, { item: 'butter', count: 1 }],
    rewardCoins: 260,
    rewardExp: 80,
  },
];

function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'HA';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const createDefaultUser = () => ({
  uid: 'usr_' + Math.random().toString(36).substr(2, 9),
  friendCode: generateFriendCode(),
  displayName: 'Chủ Tiệm Boba',
  avatar: '👩‍🍳',
  coins: 500,
  gems: 20,
  level: 1,
  exp: 0,
  expToNext: 100,
  fertilizers: 5,
  friends: {},
});

export const createDefaultFarmData = () => ({
  plots: INITIAL_PLOTS,
  chickens: INITIAL_CHICKENS,
  cows: INITIAL_COWS,
  bakery: { isBaking: false, readyAt: null },
  dairy: { isProcessing: false, readyAt: null },
  barn: INITIAL_BARN,
  orders: INITIAL_ORDERS,
  barnCapacity: 60,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      // ignore
    }
    return null; // Bắt đầu bằng null để kích hoạt Strict Auth Guard nếu chưa có session
  });
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [farmData, setFarmData] = useState(() => {
    try {
      const savedFarm = localStorage.getItem(FARM_STORAGE_KEY);
      if (savedFarm) return JSON.parse(savedFarm);
    } catch (e) {
      // ignore
    }
    return createDefaultFarmData();
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);

  // Tự động lưu user vào localStorage & Firebase
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      // Lưu Firebase RTDB
      update(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        friendCode: user.friendCode,
        displayName: user.displayName,
        avatar: user.avatar,
        coins: user.coins,
        gems: user.gems,
        level: user.level,
        exp: user.exp,
        fertilizers: user.fertilizers,
        lastOnline: Date.now(),
      }).catch(() => {});
    } catch (e) {
      // ignore
    }
  }, [user]);

  // Tự động lưu farmData vào localStorage
  useEffect(() => {
    if (!farmData) return;
    try {
      localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farmData));
    } catch (e) {
      // ignore
    }
  }, [farmData]);

  // Lắng nghe Firebase Auth state thay đổi (Strict Auth Guard)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userRef = ref(db, `users/${fbUser.uid}`);
          const snap = await get(userRef);
          if (snap.exists()) {
            const data = snap.val();
            setUser(data);
            setIsAuthModalOpen(false);
          } else {
            // Khởi tạo tài khoản mới từ Google Auth
            const newUser = {
              uid: fbUser.uid,
              friendCode: generateFriendCode(),
              displayName: fbUser.displayName || 'Chủ Tiệm Boba',
              avatar: fbUser.photoURL || '👩‍🍳',
              coins: 500,
              gems: 20,
              level: 1,
              exp: 0,
              expToNext: 100,
              fertilizers: 5,
              friends: {},
              isGoogle: true,
              email: fbUser.email || '',
            };
            await set(userRef, newUser);
            setUser(newUser);
            setIsAuthModalOpen(false);
          }
        } catch (e) {
          console.error('Lỗi nạp dữ liệu Firebase user:', e);
        } finally {
          setLoadingAuth(false);
        }
      } else {
        // Kiểm tra xem có lưu session khách trong localStorage không
        try {
          const savedUser = localStorage.getItem(STORAGE_KEY);
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.uid) {
              setUser(parsed);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (e) {
          setUser(null);
        }
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Lắng nghe lời mời chơi trực tiếp qua Firebase `invitations/{user.uid}`
  useEffect(() => {
    if (!user?.uid) return;
    const inviteRef = ref(db, `invitations/${user.uid}`);
    const unsubscribe = onValue(inviteRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && data.fromUid !== user.uid && Date.now() - (data.timestamp || 0) < 60000) {
          sound.playTing();
          setIncomingInvite({
            fromUid: data.fromUid,
            fromName: data.fromName || 'Bạn bè',
            fromAvatar: data.fromAvatar || '👩‍🍳',
            roomPin: data.roomPin,
            gameType: data.gameType || 'CARO',
            timestamp: data.timestamp || Date.now(),
          });
        }
      } else {
        setIncomingInvite(null);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Đăng nhập bằng Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser) return { success: false, error: 'Không lấy được thông tin Google' };

      const userRef = ref(db, `users/${fbUser.uid}`);
      const snap = await get(userRef);
      let userData;
      if (snap.exists()) {
        userData = snap.val();
      } else {
        userData = {
          uid: fbUser.uid,
          friendCode: generateFriendCode(),
          displayName: fbUser.displayName || 'Chủ Tiệm Boba',
          avatar: fbUser.photoURL || '👩‍🍳',
          coins: 500,
          gems: 20,
          level: 1,
          exp: 0,
          expToNext: 100,
          fertilizers: 5,
          friends: {},
          isGoogle: true,
          email: fbUser.email || '',
        };
        await set(userRef, userData);
      }
      setUser(userData);
      setIsAuthModalOpen(false);
      sound.playWin();
      return { success: true, user: userData };
    } catch (err) {
      console.error('Google Sign In error:', err);
      return { success: false, error: err.message };
    }
  };

  // Đăng nhập Khách Vãng Lai (Guest)
  const loginAsGuest = (nickname, avatar) => {
    const trimmed = (nickname || '').trim() || 'Khách ' + Math.floor(1000 + Math.random() * 9000);
    const chosenAvatar = avatar || '👩‍🍳';
    const guestUid = 'guest_' + Math.random().toString(36).substr(2, 9);
    const code = generateFriendCode();
    const guestUser = {
      uid: guestUid,
      friendCode: code,
      displayName: trimmed,
      avatar: chosenAvatar,
      coins: 500,
      gems: 20,
      level: 1,
      exp: 0,
      expToNext: 100,
      fertilizers: 5,
      friends: {},
      isGuest: true,
    };
    setUser(guestUser);
    setIsAuthModalOpen(false);
    sound.playLevelUp();
    return { success: true, user: guestUser };
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    const def = createDefaultUser();
    setUser(def);
    setIsAuthModalOpen(true);
    sound.playClick();
  };

  // Đăng ký hoặc cập nhật hồ sơ
  const saveProfile = (nickname, avatar) => {
    const trimmed = (nickname || '').trim() || 'Chủ Tiệm Boba';
    const chosenAvatar = avatar || '👩‍🍳';

    if (!user) {
      const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
      const code = generateFriendCode();
      const newUser = {
        uid,
        friendCode: code,
        displayName: trimmed,
        avatar: chosenAvatar,
        coins: 500,
        gems: 20,
        level: 1,
        exp: 0,
        expToNext: 100,
        fertilizers: 5,
        friends: {},
      };
      setUser(newUser);
      setIsAuthModalOpen(false);
      sound.playLevelUp();
    } else {
      setUser((prev) => ({
        ...prev,
        displayName: trimmed,
        avatar: chosenAvatar,
      }));
      setIsAuthModalOpen(false);
      sound.playClick();
    }
  };

  // Cộng vàng
  const addCoins = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextCoins = Math.max(0, prev.coins + amount);
      if (amount > 0) sound.playCoin();
      return { ...prev, coins: nextCoins };
    });
  };

  // Cộng kim cương
  const addGems = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, gems: Math.max(0, prev.gems + amount) };
    });
  };

  // Cộng phân bón
  const addFertilizers = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, fertilizers: Math.max(0, prev.fertilizers + amount) };
    });
  };

  // Cộng EXP & Kiểm tra Lên Cấp
  const addExp = (amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      let newExp = prev.exp + amount;
      let newLevel = prev.level;
      let newExpToNext = prev.expToNext;
      let bonusCoins = 0;
      let bonusGems = 0;
      let bonusFertilizers = 0;
      let didLevelUp = false;

      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel += 1;
        newExpToNext = Math.round(newExpToNext * 1.45);
        bonusCoins += newLevel * 100;
        bonusGems += 5;
        bonusFertilizers += 3;
        didLevelUp = true;
      }

      if (didLevelUp) {
        sound.playLevelUp();
      }

      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        expToNext: newExpToNext,
        coins: prev.coins + bonusCoins,
        gems: prev.gems + bonusGems,
        fertilizers: prev.fertilizers + bonusFertilizers,
      };
    });
  };

  // Thêm bạn bè theo Friend Code
  const addFriend = async (targetCode) => {
    const code = targetCode.trim().toUpperCase();
    if (!code || code === user?.friendCode) return { success: false, msg: 'Mã bạn bè không hợp lệ!' };

    try {
      const usersRef = ref(db, 'users');
      const snap = await get(usersRef);
      if (snap.exists()) {
        const allUsers = snap.val();
        const found = Object.values(allUsers).find((u) => u.friendCode === code);
        if (found) {
          const friendKey = found.uid || found.friendCode;
          setUser((prev) => {
            const nextFriends = { ...(prev.friends || {}) };
            nextFriends[friendKey] = {
              uid: found.uid || friendKey,
              friendCode: found.friendCode,
              displayName: found.displayName,
              avatar: found.avatar,
              level: found.level || 1,
            };
            return { ...prev, friends: nextFriends };
          });
          sound.playTing();
          return { success: true, name: found.displayName, uid: found.uid };
        }
      }
      return { success: false, msg: 'Không tìm thấy người chơi có mã này!' };
    } catch (e) {
      return { success: false, msg: 'Lỗi mạng khi tìm bạn bè!' };
    }
  };

  // Xóa bạn bè
  const removeFriend = async (friendKey) => {
    if (!user || !friendKey) return;
    setUser((prev) => {
      const nextFriends = { ...(prev.friends || {}) };
      delete nextFriends[friendKey];
      return { ...prev, friends: nextFriends };
    });
    if (user.uid) {
      set(ref(db, `users/${user.uid}/friends/${friendKey}`), null).catch(() => {});
    }
    sound.playClick();
  };

  // Gửi lời mời chơi game tới bạn bè (sử dụng node invitations/{friendUid})
  const sendGameInvite = async (friendUid, gameType, roomPin) => {
    if (!user || !friendUid) return false;
    try {
      const inviteData = {
        fromUid: user.uid,
        fromName: user.displayName,
        fromAvatar: user.avatar,
        gameType: gameType || 'CARO',
        roomPin,
        timestamp: Date.now(),
      };
      await set(ref(db, `invitations/${friendUid}`), inviteData);
      sound.playClick();
      return true;
    } catch (e) {
      console.error('Lỗi gửi lời mời:', e);
      return false;
    }
  };

  // Xóa lời mời hiện tại
  const dismissInvite = () => {
    if (user?.uid) {
      set(ref(db, `invitations/${user.uid}`), null).catch(() => {});
    }
    setIncomingInvite(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        loadingAuth,
        farmData,
        setFarmData,
        saveProfile,
        loginWithGoogle,
        loginAsGuest,
        logout,
        addCoins,
        addGems,
        addExp,
        addFertilizers,
        addFriend,
        removeFriend,
        sendGameInvite,
        incomingInvite,
        dismissInvite,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isFriendsModalOpen,
        setIsFriendsModalOpen,
        isAboutModalOpen,
        setIsAboutModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
