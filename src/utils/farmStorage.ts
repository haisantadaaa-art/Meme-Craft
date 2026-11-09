/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FarmState, FarmPlot, FarmOrder, CropType, CROP_CONFIG } from '../types/game';
import { db, ref, set } from '../services/firebase';

const STORAGE_KEY = 'hayday_party_farm_v1';

export const CUSTOMER_PRESETS: { name: string; title: string }[] = [
  { name: 'Bác Nông Dân Greg', title: 'Chủ Trang Trại Lớn' },
  { name: 'Cô Bé Mary', title: 'Thợ Làm Bánh Thị Trấn' },
  { name: 'Thị Trưởng Mike', title: 'Đại Diện Dân Làng' },
  { name: 'Đầu Bếp Pierre', title: 'Nhà Hàng 5 Sao' },
  { name: 'Bà Cụ Rosa', title: 'Hội Chợ Hoa Quả' },
];

export function generateRandomOrder(level: number, existingIds: string[] = []): FarmOrder {
  const customer = CUSTOMER_PRESETS[Math.floor(Math.random() * CUSTOMER_PRESETS.length)];
  const availableCrops: CropType[] = ['wheat'];
  if (level >= 2) availableCrops.push('corn');
  if (level >= 3) availableCrops.push('carrot');
  if (level >= 4) availableCrops.push('strawberry');

  // Choose 1 or 2 requirements
  const reqCount = Math.min(availableCrops.length, Math.random() > 0.4 ? 2 : 1);
  const shuffled = [...availableCrops].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, reqCount);

  let totalCoinReward = 0;
  let totalExpReward = 0;

  const requirements = chosen.map((c) => {
    const info = CROP_CONFIG[c];
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4
    totalCoinReward += info.coinReward * count * 1.4;
    totalExpReward += info.expReward * count * 1.3;
    return { crop: c, count };
  });

  return {
    id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    customerName: customer.name,
    customerTitle: customer.title,
    customerAvatar: customer.name[0],
    requirements,
    rewardCoins: Math.round(totalCoinReward + 25),
    rewardExp: Math.round(totalExpReward + 15),
  };
}

export function createInitialFarmState(userId?: string): FarmState {
  const uid = userId || `farmer-${Date.now().toString(36)}`;
  const initialPlots: FarmPlot[] = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    crop: i === 0 ? 'wheat' : null,
    plantedAt: i === 0 ? Date.now() - 6000 : null,
    readyAt: i === 0 ? Date.now() + 4000 : null,
  }));

  const initialOrders: FarmOrder[] = [
    {
      id: 'order-1',
      customerName: 'Bác Nông Dân Greg',
      customerTitle: 'Chủ Trang Trại Lớn',
      customerAvatar: 'G',
      requirements: [{ crop: 'wheat', count: 3 }],
      rewardCoins: 60,
      rewardExp: 30,
    },
    {
      id: 'order-2',
      customerName: 'Cô Bé Mary',
      customerTitle: 'Tiệm Bánh Ngọt',
      customerAvatar: 'M',
      requirements: [{ crop: 'wheat', count: 2 }, { crop: 'corn', count: 1 }],
      rewardCoins: 90,
      rewardExp: 45,
    },
    {
      id: 'order-3',
      customerName: 'Thị Trưởng Mike',
      customerTitle: 'Đại Diện Dân Làng',
      customerAvatar: 'T',
      requirements: [{ crop: 'carrot', count: 2 }],
      rewardCoins: 120,
      rewardExp: 60,
    },
  ];

  return {
    userId: uid,
    userName: 'Bác Nông Dân',
    level: 1,
    exp: 0,
    expToNext: 80,
    coins: 150,
    gems: 10,
    fertilizers: 4,
    barn: {
      wheat: 5,
      corn: 2,
      carrot: 2,
      strawberry: 0,
    },
    barnCapacity: 60,
    plots: initialPlots,
    orders: initialOrders,
    stats: {
      totalHarvested: 0,
      ordersCompleted: 0,
      miniGamesWon: 0,
    },
    lastSaved: Date.now(),
  };
}

export function loadFarmState(): FarmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FarmState;
      if (parsed && Array.isArray(parsed.plots)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load local farm state:', e);
  }
  return createInitialFarmState();
}

export function saveFarmState(state: FarmState): void {
  try {
    const toSave: FarmState = { ...state, lastSaved: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    // Async sync to Firebase RTDB in background
    if (toSave.userId) {
      const farmRef = ref(db, `farms/${toSave.userId}`);
      set(farmRef, {
        userId: toSave.userId,
        userName: toSave.userName,
        level: toSave.level,
        coins: toSave.coins,
        gems: toSave.gems,
        stats: toSave.stats,
        lastSaved: toSave.lastSaved,
      }).catch((err) => {
        // Ignore RTDB offline transient warning
      });
    }
  } catch (e) {
    console.warn('Failed to save farm state:', e);
  }
}
