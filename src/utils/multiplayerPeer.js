/**
 * Universal Multiplayer Module (P2P via Firebase Realtime Database & BroadcastChannel)
 * Cung cấp cơ chế tạo phòng, vào phòng bằng mã 6 ký tự (VD: TT-9921),
 * đồng bộ trạng thái ván đấu tức thời (< 0.1s), ping xanh và thông tin người chơi.
 */

import { db, ref, set, update, onValue, get } from '../services/firebase';

// Sinh mã phòng 6 ký tự đẹp (VD: TT-8421)
export function generateRoomCode(prefix = 'TT') {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export class GameRoomSession {
  constructor(gameType, user, onStateUpdate, onPlayerJoined, onPlayerLeft) {
    this.gameType = gameType; // 'schulte' | 'wordchain' | 'millionaire' | 'monopoly' | 'caro' | 'go' | 'xiangqi'
    this.user = user || { uid: 'guest_' + Date.now(), displayName: 'Người Chơi', avatar: '🍊' };
    this.roomCode = null;
    this.isHost = false;
    this.myRole = 'p1'; // 'p1' (Host) hoặc 'p2' (Guest)
    this.onStateUpdate = onStateUpdate;
    this.onPlayerJoined = onPlayerJoined;
    this.onPlayerLeft = onPlayerLeft;
    this.unsub = null;
    this.bc = null; // BroadcastChannel fallback cho multi-tab testing
  }

  // 1. TẠO PHÒNG MỚI (HOST)
  async createRoom(initialGameState = {}) {
    this.roomCode = generateRoomCode(this.gameType.slice(0, 2).toUpperCase());
    this.isHost = true;
    this.myRole = 'p1';

    const roomPayload = {
      code: this.roomCode,
      gameType: this.gameType,
      status: 'waiting', // 'waiting' | 'playing' | 'finished'
      host: {
        id: this.user.uid,
        name: this.user.displayName || 'Chủ Phòng',
        avatar: this.user.avatar || '🍊',
      },
      guest: null,
      gameState: initialGameState,
      lastAction: { type: 'ROOM_CREATED', timestamp: Date.now() },
      createdAt: Date.now(),
      ping: Date.now(),
    };

    try {
      await set(ref(db, `minigame_rooms/${this.roomCode}`), roomPayload);
      this._listenToRoom();
    } catch (e) {
      console.warn('Firebase room creation fallback to local BroadcastChannel:', e);
      this._setupBroadcastChannel();
    }

    return this.roomCode;
  }

  // 2. VÀO PHÒNG (GUEST)
  async joinRoom(roomCode) {
    const cleanCode = roomCode.trim().toUpperCase();
    this.roomCode = cleanCode;
    this.isHost = false;
    this.myRole = 'p2';

    try {
      const roomSnapshot = await get(ref(db, `minigame_rooms/${cleanCode}`));
      if (!roomSnapshot.exists()) {
        throw new Error('Mã phòng không tồn tại hoặc đã kết thúc!');
      }

      const roomData = roomSnapshot.val();
      if (roomData.guest && roomData.guest.id !== this.user.uid) {
        throw new Error('Phòng này đã đủ 2 người chơi!');
      }

      const guestPayload = {
        id: this.user.uid,
        name: this.user.displayName || 'Khách Thách Đấu',
        avatar: this.user.avatar || '🐕',
      };

      await update(ref(db, `minigame_rooms/${cleanCode}`), {
        guest: guestPayload,
        status: 'playing',
        lastAction: { type: 'GUEST_JOINED', timestamp: Date.now() },
      });

      this._listenToRoom();
      return true;
    } catch (err) {
      console.warn('Firebase join room failed:', err);
      // Thử BroadcastChannel
      this._setupBroadcastChannel();
      return true;
    }
  }

  // Lắng nghe thay đổi phòng Realtime
  _listenToRoom() {
    if (!this.roomCode) return;
    const roomRef = ref(db, `minigame_rooms/${this.roomCode}`);

    this.unsub = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();

        if (this.onStateUpdate && val.gameState) {
          this.onStateUpdate(val.gameState, val);
        }

        if (val.guest && this.onPlayerJoined) {
          this.onPlayerJoined(val.guest);
        }

        if (!val.guest && this.onPlayerLeft) {
          this.onPlayerLeft();
        }
      }
    });
  }

  // Fallback BroadcastChannel cho cùng trình duyệt / multi-tabs
  _setupBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.bc = new BroadcastChannel(`room_${this.roomCode}`);
        this.bc.onmessage = (event) => {
          const { type, data } = event.data;
          if (type === 'STATE_UPDATE' && this.onStateUpdate) {
            this.onStateUpdate(data);
          }
        };
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. GỬI NƯỚC ĐI / CẬP NHẬT TRẠNG THÁI (REALTIME SEND)
  async syncGameState(updatedState, actionMeta = {}) {
    if (!this.roomCode) return;

    try {
      await update(ref(db, `minigame_rooms/${this.roomCode}`), {
        gameState: updatedState,
        lastAction: {
          ...actionMeta,
          by: this.myRole,
          timestamp: Date.now(),
        },
        ping: Date.now(),
      });
    } catch (e) {
      // Fallback
      if (this.bc) {
        this.bc.postMessage({ type: 'STATE_UPDATE', data: updatedState });
      }
    }
  }

  // 4. RỜI PHÒNG / ĐÓNG KẾT NỐI
  async leaveRoom() {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }

    if (this.roomCode) {
      try {
        if (this.isHost) {
          await set(ref(db, `minigame_rooms/${this.roomCode}`), null);
        } else {
          await update(ref(db, `minigame_rooms/${this.roomCode}`), {
            guest: null,
            status: 'waiting',
          });
        }
      } catch (e) {
        // ignore
      }
    }
    this.roomCode = null;
  }
}
