class VoiceService {
  constructor() {
    this.voices = [];
    this.brVoice = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.voices = this.synth.getVoices();
      this.brVoice = this.voices.find(v => v.lang.startsWith('pt'));
      if (this.voices.length === 0) {
        this.synth.onvoiceschanged = () => {
          this.voices = this.synth.getVoices();
          this.brVoice = this.voices.find(v => v.lang.startsWith('pt'));
        };
      }
    }
  }

  speak(text, options = {}) {
    try {
      if (!this.synth) return;
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = options.rate || 0.85;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1;
      if (this.brVoice) utterance.voice = this.brVoice;
      this.synth.speak(utterance);
    } catch {}
  }

  welcomePassenger(passengerName, driverName, vehicleModel) {
    this.speak(
      `Olá ${passengerName}, seja bem-vindo ao carro do ${driverName}. ${vehicleModel} à sua disposição.`,
      { rate: 0.85 }
    );
  }

  arrivedDestination(destination) {
    this.speak(
      `Você chegou ao seu destino: ${destination}. Obrigado por viajar com 44 Taxi!`,
      { rate: 0.85 }
    );
  }

  driverOnWay(driverName, minutes) {
    this.speak(
      `${driverName} está a caminho. Chega em aproximadamente ${minutes} minutos.`,
      { rate: 0.9 }
    );
  }

  orderReceived() {
    this.speak('Novo pedido recebido!', { rate: 1.0, pitch: 1.2 });
  }
}

export default new VoiceService();
