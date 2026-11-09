/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDujRdCRVs1NSfNE6M_sThcSzzEOZLJdRg",
  authDomain: "meme-party-game.firebaseapp.com",
  databaseURL: "https://meme-party-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meme-party-game",
  storageBucket: "meme-party-game.firebasestorage.app",
  messagingSenderId: "480834974401",
  appId: "1:480834974401:web:2b09ad7f2aceb7bb4c5a40",
  measurementId: "G-DS5FMM8Q23"
};

const app = initializeApp(firebaseConfig);
// Explicitly pass databaseURL to ensure regional asia-southeast1 (Singapore) connection
export const db = getDatabase(app, firebaseConfig.databaseURL);
export { ref, set, onValue, update, get, push };
