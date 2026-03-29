// Sound Manager - Gerencia efeitos sonoros da aplicação

export const soundManager = {
  play: (soundName: string) => {
    // Implementação futura de efeitos sonoros
    console.log(`[Sound] Playing: ${soundName}`);
  },

  stop: () => {
    console.log("[Sound] Stopped");
  },

  setVolume: (volume: number) => {
    console.log(`[Sound] Volume set to: ${volume}`);
  },
};

export default soundManager;
