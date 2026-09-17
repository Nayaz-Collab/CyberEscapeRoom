/* ============================================
   STORAGE.JS — localStorage persistence layer
   ============================================ */

const STORAGE_KEY = 'cyberEscapeRoom_v1';
const TOTAL_TIME_SECONDS = 15 * 60; // "the hacker will wipe the server in 15 minutes"

const ROOM_ORDER = ['room1', 'room2', 'room3', 'room4', 'room5', 'room6'];

const KEY_FRAGMENTS = {
  room1: 'FLAG{C1PH3R_',
  room2: 'PH1SH_',
  room3: 'PA55_',
  room4: 'SQL1_',
  room5: 'L0GS_',
  room6: 'URL5}'
};

function defaultState(){
  return {
    started: false,
    timerEnd: null,          // epoch ms when timer expires
    timedOut: false,
    score: 0,
    maxScore: 0,
    inventory: {},           // roomKey -> fragment string
    achievements: [],        // list of achievement ids
    hintsUsed: {},           // roomKey -> count
    attempts: {},            // roomKey -> wrong attempt count
    roomsCompleted: {},      // roomKey -> true
    soundOn: true,
    finished: false
  };
}

const GameStorage = {
  load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    }catch(e){
      console.warn('GameStorage.load failed, resetting.', e);
      return defaultState();
    }
  },
  save(state){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){
      console.warn('GameStorage.save failed', e);
    }
  },
  reset(){
    localStorage.removeItem(STORAGE_KEY);
    return defaultState();
  }
};
