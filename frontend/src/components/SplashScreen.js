import React, { useEffect, useState, useRef } from 'react';
import Logo from './Logo';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('logo');
  const [fadeOut, setFadeOut] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('brand'), 800);
    const t2 = setTimeout(() => setPhase('welcome'), 1400);
    const t3 = setTimeout(() => setFadeOut(true), 4000);
    const t4 = setTimeout(() => onFinish(), 4800);

    try {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance('44 Taxi');
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.lang = 'pt-BR';
      const voices = synth.getVoices();
      const brVoice = voices.find(v => v.lang.startsWith('pt'));
      if (brVoice) utterance.voice = brVoice;
      setTimeout(() => synth.speak(utterance), 300);
    } catch {}

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #1e3a5f 0%, #2563eb 40%, #3b82f6 70%, #60a5fa 100%)',
      transition: 'opacity 0.8s ease',
      opacity: fadeOut ? 0 : 1,
    }}>
      <div style={{
        transition: 'all 0.6s ease',
        transform: phase === 'welcome' ? 'translateY(-30px)' : 'translateY(0)',
        textAlign: 'center',
      }}>
        <div style={{
          transition: 'all 0.5s ease',
          transform: phase === 'brand' ? 'scale(1)' : 'scale(0.7)',
          opacity: phase === 'logo' ? (phase === 'logo' ? 1 : 0) : 1,
        }}>
          <Logo size={90} color="#fff" />
        </div>

        {phase === 'welcome' && (
          <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginTop: 20, fontFamily: 'system-ui, sans-serif' }}>
              Bem-vindo ao 44Taxi
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 8, fontFamily: 'system-ui, sans-serif' }}>
              Mobilidade e delivery na palma da sua mão
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              {['🚗', '🍕', '💰'].map((emoji, i) => (
                <div key={i} style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, animation: `bounce 1.5s ease ${i * 0.2}s infinite`,
                }}>{emoji}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {phase === 'welcome' && (
        <div style={{ position: 'absolute', bottom: 60, animation: 'fadeInUp 0.8s ease 0.5s both' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
