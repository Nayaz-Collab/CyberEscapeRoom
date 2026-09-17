/* ============================================
   TIMER.JS — countdown that survives page loads
   ============================================ */

const CountdownTimer = (function(){
  let intervalId = null;

  function format(totalSeconds){
    const m = Math.floor(totalSeconds / 60).toString().padStart(2,'0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function secondsLeft(){
    const state = Game.getState();
    if(!state.timerEnd) return TOTAL_TIME_SECONDS;
    return Math.max(0, Math.round((state.timerEnd - Date.now()) / 1000));
  }

  function start({onTick=null, onExpire=null} = {}){
    Game.ensureStarted();
    stop();
    tick(); // immediate paint
    intervalId = setInterval(tick, 1000);

    function tick(){
      const left = secondsLeft();
      const hudTimer = document.getElementById('hudTimer');
      if(hudTimer){
        hudTimer.textContent = format(left);
        hudTimer.classList.toggle('timer-low', left <= 120);
      }
      if(onTick) onTick(left);

      if(left <= 0){
        stop();
        const state = Game.getState();
        if(!state.timedOut){
          state.timedOut = true;
          Game.persist();
        }
        if(onExpire) onExpire();
      }
    }
  }

  function stop(){
    if(intervalId){ clearInterval(intervalId); intervalId = null; }
  }

  return { start, stop, secondsLeft, format };
})();
