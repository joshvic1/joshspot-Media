import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiPlay, FiStar, FiX } from 'react-icons/fi';
import { inboxApi } from './api';
import c from '../../styles/BirthdayCelebration.module.css';

const slides = [
  { src: '/images/birthday/happy-birthday-okolosi-marvel.png', alt: 'Happy Birthday, Okolosi Marvel' },
  { src: '/images/birthday/thank-you-okolosi-marvel.png', alt: 'Thank You, Okolosi Marvel' },
  { src: '/images/birthday/more-amazing-years-okolosi-marvel.png', alt: "Here's to More Amazing Years, Okolosi Marvel" },
];

const previewAllowed = () => typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).has('birthdayPreview');

function particles() {
  return Array.from({ length: 54 }, (_, index) => ({
    id: index,
    kind: index % 9 === 0 ? 'ribbon' : index % 7 === 0 ? 'sparkle' : 'confetti',
    left: `${(index * 37 + 11) % 101}%`,
    delay: `${((index * 19) % 650) / 1000}s`,
    duration: `${3.4 + ((index * 13) % 22) / 10}s`,
    drift: `${-120 + ((index * 47) % 240)}px`,
    spin: `${160 + ((index * 71) % 540)}deg`,
  }));
}

export default function BirthdayCelebration({ session }) {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState(null);
  const [open, setOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  const [screen, setScreen] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const confetti = useMemo(particles, []);

  useEffect(() => {
    let mounted = true;
    const preview = previewAllowed();
    if (preview) {
      const allowed = session.actor.admin || session.actor.id === '6a4fa5d7bf99d3294e4f2258';
      if (mounted && allowed) { setState({ available: true, authorized: true, initialCompletedAt: null, preview: true }); setOpen(true); }
      return () => { mounted = false; };
    }
    inboxApi('/birthday').then((result) => {
      if (!mounted || !result.available || !result.authorized) return;
      setState(result);
      if (!result.initialCompletedAt) setOpen(true);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [session.actor.admin, session.actor.id]);

  useEffect(() => {
    if (!open || replay) return undefined;
    const keepMandatoryOpen = (event) => { if (event.key === 'Escape') event.preventDefault(); };
    window.addEventListener('keydown', keepMandatoryOpen, true);
    return () => window.removeEventListener('keydown', keepMandatoryOpen, true);
  }, [open, replay]);

  const startReplay = () => { setScreen(0); setError(''); setReplay(true); setOpen(true); };
  const closeReplay = () => { if (!celebrating) { setOpen(false); setReplay(false); setScreen(0); } };
  const finish = async () => {
    setBusy(true); setError('');
    try {
      if (!state.preview) await inboxApi('/birthday/complete', { method: 'POST', body: {} });
      setState(old => ({ ...old, initialCompletedAt: old?.initialCompletedAt || new Date().toISOString() }));
      setCelebrating(true);
      window.setTimeout(() => { setCelebrating(false); setOpen(false); setReplay(false); setScreen(0); }, reducedMotion ? 500 : 5100);
    } catch (err) { setError(err.message || 'Could not complete the celebration. Please try again.'); }
    finally { setBusy(false); }
  };

  if (!state?.available || !state?.authorized) return null;
  const initialViewing = !replay && !state.initialCompletedAt;
  return <>
    <button className={c.badge} type="button" onClick={startReplay} aria-label="Replay Okolosi Marvel's birthday celebration">
      <FiPlay /><span>🎉 Happy Birthday</span><i aria-hidden="true" />
    </button>
    <AnimatePresence>
      {open && <motion.div className={c.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {celebrating && <div className={c.celebration} aria-hidden="true">
          <div className={c.celebrationGlow} />
          {confetti.map(piece => <span key={piece.id} className={c[piece.kind]} style={{ '--left': piece.left, '--delay': piece.delay, '--duration': piece.duration, '--drift': piece.drift, '--spin': piece.spin }} />)}
        </div>}
        <motion.section className={c.card} role="dialog" aria-modal="true" aria-labelledby="birthday-card-title" initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: .97 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          {replay && <button className={c.close} type="button" onClick={closeReplay} disabled={celebrating} aria-label="Close birthday celebration"><FiX /></button>}
          <div className={c.progress} aria-label={`Card ${screen + 1} of ${slides.length}`}>{slides.map((_, index) => <i key={index} className={index === screen ? c.current : index < screen ? c.complete : ''} />)}</div>
          <div className={c.imageViewport}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.img key={slides[screen].src} src={slides[screen].src} alt={slides[screen].alt} className={c.image} initial={{ opacity: 0, x: screen ? 28 : 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: reducedMotion ? 0 : .28, ease: 'easeOut' }} />
            </AnimatePresence>
          </div>
          <h2 id="birthday-card-title" className={c.srOnly}>Birthday celebration for Okolosi Marvel</h2>
          <footer className={c.actions}>
            {screen > 0 && <button type="button" className={c.back} disabled={celebrating || busy} onClick={() => setScreen(value => value - 1)}><FiArrowLeft /> Back</button>}
            {screen < slides.length - 1 ? <button type="button" className={c.next} disabled={celebrating || busy} onClick={() => setScreen(value => value + 1)}>Next <FiArrowRight /></button> : <button type="button" className={c.finish} disabled={celebrating || busy} onClick={finish}><FiStar />{busy ? 'Starting…' : 'Finish Celebration 🎉'}</button>}
          </footer>
          {initialViewing && <p className={c.initialHint}>A special birthday message from the Joshspot Media team.</p>}
          {error && <p className={c.error} role="alert">{error}</p>}
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </>;
}
