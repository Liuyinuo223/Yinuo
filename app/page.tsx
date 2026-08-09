"use client";

import { useEffect, useRef, useState } from "react";

type Stage = "cover" | "panorama" | "garden" | "rubbing" | "memory";
type Journey = "bayberry" | "path" | "tree" | "fish" | "wall" | "bridge";

const dialogues = [
  ["Grandmother", "Choose the darkest one. That will be the sweetest."],
  ["Xiaoman", "So tart it makes me close my eyes!"],
  ["Grandmother", "A pinch of salt with bayberries — then summer in the hills has truly arrived."],
  ["Xiaoman", "I’ll save the biggest, reddest one to take home."],
];

const pathDialogues = [
  ["Traveler", "The path grows quiet, but the street beyond it is waking."],
  ["Passerby", "Listen — footsteps, wheels, and voices are gathering ahead."],
  ["Traveler", "Every bend carries a sound from somewhere we have not reached."],
  ["Passerby", "Keep walking. The road remembers everyone who crossed it."],
];

const treeDialogues = [
  ["Listener", "A woodpecker is tapping somewhere beyond the pale trunks."],
  ["Forest", "Each hollow knock travels farther than a voice among the trees."],
  ["Listener", "The bark holds the rhythm long after the bird has moved on."],
  ["Forest", "Stand still. The woodland is speaking through the wood."],
];

const fishDialogues = [
  ["Listener", "The pond gathers every small sound and carries it in circles."],
  ["Water", "A pale fish passes beneath the surface without breaking the sky."],
  ["Listener", "Its tail turns once, and the whole reflection begins to move."],
  ["Water", "Stay a little longer. The current remembers every crossing."],
];

const wallDialogues = [
  ["Visitor", "Wait—is someone cooking inside the house?"],
  ["Companion", "Yes. Listen—the sound is coming through the brick wall."],
  ["Kitchen", "Oil begins to sing, and the warm scent slips through the window."],
  ["Kitchen", "Every wall keeps the sounds of the hands that make a home."],
];

const bridgeDialogues = [
  ["Traveler", "From the crest of the bridge, an oar touches the water below."],
  ["Boatman", "One pull carries the boat forward; one pause lets the river speak."],
  ["Traveler", "The bridge stays still while every ripple passes beneath it."],
  ["River", "Stone remembers the crossing. Water remembers the journey."],
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("cover");
  const [coverOpening, setCoverOpening] = useState(false);
  const [journey, setJourney] = useState<Journey>("bayberry");
  const [entering, setEntering] = useState(false);
  const [picked, setPicked] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dialogue, setDialogue] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [backgroundOn, setBackgroundOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const points = useRef(0);
  const rubbingTrail = useRef<Array<{ x: number; y: number }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waveformSamplesRef = useRef<Float32Array | null>(null);
  const waveformLoadRef = useRef(0);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const waveformFrameRef = useRef<number | null>(null);
  const backgroundFadeRef = useRef<number | null>(null);
  const soundTransitionRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const background = new Audio("/background-music.wav");
    background.loop = true;
    background.volume = 0.3;
    background.preload = "auto";
    backgroundRef.current = background;
    background.addEventListener("play", () => setBackgroundOn(true));
    background.addEventListener("pause", () => setBackgroundOn(false));
    return () => background.pause();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = journey === "path" ? "/path-rubbing.png" : journey === "tree" ? "/tree-rubbing.png" : journey === "fish" ? "/fish-rubbing.png" : journey === "wall" ? "/wall-rubbing.png" : journey === "bridge" ? "/bridge-rubbing.png" : "/bayberry-rubbing.png";
    const audio = new Audio(journey === "path" ? "/street-sound.m4a" : journey === "tree" ? "/woodpecker-sound.m4a" : journey === "fish" ? "/water-sound.m4a" : journey === "wall" ? "/cooking-sound.m4a" : journey === "bridge" ? "/oar-sound.m4a" : "/leaf-sound.m4a");
    audio.loop = false;
    audio.preload = "auto";
    audio.addEventListener("ended", () => {
      setSoundOn(false);
      setAudioFinished(true);
      resumeBackground();
    });
    audioRef.current = audio;
    waveformSamplesRef.current = null;
    waveformLoadRef.current += 1;
    setAudioFinished(false);
    image.onload = () => {
      imageRef.current = image;
      prepareCanvas();
    };
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current);
      audio.pause();
    };
  }, [journey]);

  useEffect(() => {
    if (stage === "rubbing") requestAnimationFrame(prepareCanvas);
  }, [stage]);

  function prepareCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, box.width, box.height);
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = i % 2 ? "#9e8c68" : "#fffdf3";
      ctx.fillRect(Math.random() * box.width, Math.random() * box.height, Math.random() * 50 + 8, 0.7);
    }
    ctx.globalAlpha = 1;
    renderRubbing(ctx, box.width, box.height);
  }

  function renderRubbing(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const image = imageRef.current;
    if (!image || rubbingTrail.current.length === 0) return;
    const crop = journey === "fish"
      ? { x: 0, y: 500, width: image.naturalWidth, height: image.naturalHeight - 908 }
      : journey === "path" || journey === "tree" || journey === "wall" || journey === "bridge"
        ? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight }
        : { x: 430, y: 1050, width: 1550, height: 1550 };
    const scale = Math.min(width / crop.width, height / crop.height) * 0.88;
    const w = crop.width * scale;
    const h = crop.height * scale;
    ctx.save();
    ctx.beginPath();
    for (const point of rubbingTrail.current) {
      ctx.moveTo(point.x + 34, point.y);
      ctx.arc(point.x, point.y, 34, 0, Math.PI * 2);
    }
    ctx.clip();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      (width - w) / 2,
      (height - h) / 2,
      w,
      h,
    );
    ctx.restore();
  }

  function drawAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    rubbingTrail.current.push({ x, y });
    prepareCanvas();
    points.current += 1;
    setProgress(Math.min(100, Math.round(points.current * 1.15)));
  }

  function markDetail() {
    playClickSound();
    ensureBackground();
    setPicked(1);
    window.setTimeout(() => setStage("rubbing"), 360);
  }

  function enterGarden(nextJourney: Journey) {
    if (entering) return;
    playClickSound();
    ensureBackground();
    setJourney(nextJourney);
    setEntering(true);
    window.setTimeout(() => {
      setStage("garden");
      setEntering(false);
    }, 1050);
  }

  function moveGarden(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--garden-rx", `${y * -1.2}deg`);
    event.currentTarget.style.setProperty("--garden-ry", `${x * 1.8}deg`);
    event.currentTarget.style.setProperty("--garden-px", `${x * 10}px`);
    event.currentTarget.style.setProperty("--garden-py", `${y * 8}px`);
  }

  function restGarden(event: React.PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--garden-rx", "0deg");
    event.currentTarget.style.setProperty("--garden-ry", "0deg");
    event.currentTarget.style.setProperty("--garden-px", "0px");
    event.currentTarget.style.setProperty("--garden-py", "0px");
  }

  function beginMemory() {
    setStage("memory");
    setAudioFinished(false);
    playSoundscape();
    timerRef.current = window.setInterval(() => {
      const lines = journey === "path" ? pathDialogues : journey === "tree" ? treeDialogues : journey === "fish" ? fishDialogues : journey === "wall" ? wallDialogues : journey === "bridge" ? bridgeDialogues : dialogues;
      setDialogue((value) => (value + 1) % lines.length);
    }, 4200);
  }

  function playSoundscape() {
    const audio = audioRef.current;
    if (!audio) return;
    fadeBackgroundAndPlay(audio);
  }

  function fadeBackgroundAndPlay(audio: HTMLAudioElement) {
    const background = backgroundRef.current;
    if (backgroundFadeRef.current) cancelAnimationFrame(backgroundFadeRef.current);
    const transition = ++soundTransitionRef.current;
    const startVolume = background?.volume ?? 0;
    const startedAt = performance.now();
    const duration = 850;
    connectWaveform(audio);
    audio.currentTime = 0;
    audio.volume = 0;
    setAudioFinished(false);
    const revealAudio = () => {
      if (transition !== soundTransitionRef.current) return;
      if (background) {
        background.pause();
        background.volume = 0.3;
      }
      audio.currentTime = 0;
      audio.volume = 1;
      setSoundOn(true);
    };
    void audio.play().then(() => {
      if (transition !== soundTransitionRef.current) return;
      if (!background || background.paused) {
        revealAudio();
        return;
      }
      const fade = (now: number) => {
        if (transition !== soundTransitionRef.current) return;
        const amount = Math.min(1, (now - startedAt) / duration);
        background.volume = startVolume * (1 - amount);
        if (amount < 1) backgroundFadeRef.current = requestAnimationFrame(fade);
        else revealAudio();
      };
      backgroundFadeRef.current = requestAnimationFrame(fade);
    }).catch(() => {
      audio.volume = 1;
      setSoundOn(false);
      setAudioFinished(true);
      resumeBackground();
    });
  }

  function connectWaveform(audio: HTMLAudioElement) {
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    drawWaveform();
    if (!AudioContextConstructor) return;
    const context = audioContextRef.current || new AudioContextConstructor();
    audioContextRef.current = context;
    const load = ++waveformLoadRef.current;
    void fetch(audio.src)
      .then((response) => response.arrayBuffer())
      .then((buffer) => context.decodeAudioData(buffer))
      .then((decoded) => {
        if (load !== waveformLoadRef.current) return;
        const channel = decoded.getChannelData(0);
        const columns = 720;
        const block = Math.max(1, Math.floor(channel.length / columns));
        const samples = new Float32Array(columns);
        for (let column = 0; column < columns; column++) {
          let peak = 0;
          const start = column * block;
          const end = Math.min(channel.length, start + block);
          for (let index = start; index < end; index++) peak = Math.max(peak, Math.abs(channel[index]));
          samples[column] = peak;
        }
        waveformSamplesRef.current = samples;
      })
      .catch(() => {
        waveformSamplesRef.current = null;
      });
  }

  function drawWaveform() {
    if (waveformFrameRef.current) cancelAnimationFrame(waveformFrameRef.current);
    const render = () => {
      const canvas = waveformRef.current;
      const audio = audioRef.current;
      if (canvas && audio) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          const middle = height / 2;
          const samples = waveformSamplesRef.current;
          const count = samples?.length ?? 360;
          const progress = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
          for (let i = 0; i < count; i++) {
            const x = (i / Math.max(1, count - 1)) * width;
            const fallback = .12 + Math.abs(Math.sin(i * .41) * Math.cos(i * .087)) * .58;
            const amplitude = Math.max(.025, samples?.[i] ?? fallback);
            const bar = Math.min(height * .47, amplitude * height * .72);
            ctx.strokeStyle = i / count <= progress ? "rgba(23,37,31,.96)" : "rgba(23,37,31,.24)";
            ctx.lineWidth = Math.max(1, dpr * .72);
            ctx.beginPath();
            ctx.moveTo(x, middle - bar);
            ctx.lineTo(x, middle + bar);
            ctx.stroke();
          }
          const playhead = Math.max(0, Math.min(width, progress * width));
          ctx.fillStyle = "rgba(23,37,31,.78)";
          ctx.fillRect(playhead, 0, Math.max(1, dpr), height);
        }
      }
      waveformFrameRef.current = requestAnimationFrame(render);
    };
    waveformFrameRef.current = requestAnimationFrame(render);
  }

  function ensureBackground() {
    const background = backgroundRef.current;
    const texture = audioRef.current;
    if (!background || (texture && !texture.paused)) return;
    background.volume = 0.3;
    void background.play().catch(() => undefined);
  }

  function restoreBackgroundImmediately() {
    const background = backgroundRef.current;
    if (!background) return;
    soundTransitionRef.current += 1;
    if (backgroundFadeRef.current) cancelAnimationFrame(backgroundFadeRef.current);
    background.volume = 0.3;
    void background.play().catch(() => undefined);
    window.setTimeout(() => {
      const texture = audioRef.current;
      if (background.paused && (!texture || texture.paused)) {
        background.volume = 0.3;
        void background.play().catch(() => undefined);
      }
    }, 180);
  }

  function resumeBackground() {
    const background = backgroundRef.current;
    if (!background) return;
    const transition = ++soundTransitionRef.current;
    if (backgroundFadeRef.current) cancelAnimationFrame(backgroundFadeRef.current);
    background.volume = 0;
    const startedAt = performance.now();
    void background.play().catch(() => undefined);
    const rise = (now: number) => {
      if (transition !== soundTransitionRef.current) return;
      const amount = Math.min(1, (now - startedAt) / 900);
      background.volume = 0.3 * amount;
      if (amount < 1) backgroundFadeRef.current = requestAnimationFrame(rise);
    };
    backgroundFadeRef.current = requestAnimationFrame(rise);
  }

  function playClickSound() {
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = audioContextRef.current || new AudioContextConstructor();
    audioContextRef.current = context;
    if (context.state === "suspended") void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(760, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(470, context.currentTime + 0.085);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.105);
  }

  function toggleSound() {
    const audio = audioRef.current;
    if (stage === "memory" && audio) {
      if (audio.paused) playSoundscape();
      else {
        audio.pause();
        setSoundOn(false);
        resumeBackground();
      }
      return;
    }
    const background = backgroundRef.current;
    if (!background) return;
    if (background.paused) void background.play();
    else background.pause();
  }

  function reset() {
    soundTransitionRef.current += 1;
    if (backgroundFadeRef.current) cancelAnimationFrame(backgroundFadeRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSoundOn(false);
    setAudioFinished(false);
    setDialogue(0);
    setProgress(0);
    points.current = 0;
    rubbingTrail.current = [];
    setPicked(0);
    setStage("panorama");
    restoreBackgroundImmediately();
    requestAnimationFrame(prepareCanvas);
  }

  function startGame() {
    if (coverOpening) return;
    ensureBackground();
    setCoverOpening(true);
    window.setTimeout(() => {
      setStage("panorama");
      setCoverOpening(false);
    }, 1050);
  }

  return (
    <main className={`experience stage-${stage}${entering ? " is-entering" : ""}${coverOpening ? " is-cover-opening" : ""}`} onPointerDown={stage === "cover" ? undefined : ensureBackground}>
      {stage !== "cover" && stage !== "panorama" && <header className="topbar">
        <button className="brand" onClick={reset} aria-label="Start again">
          <span className="seal">{journey === "path" ? "P" : journey === "tree" ? "T" : journey === "fish" ? "F" : journey === "wall" ? "H" : journey === "bridge" ? "M" : "B"}</span>
          <span><b>{journey === "path" ? "A PATH THROUGH SUMMER" : journey === "tree" ? "THE WOOD REMEMBERS" : journey === "fish" ? "BENEATH THE STILL WATER" : journey === "wall" ? "THE HOUSE HOLDS WARMTH" : journey === "bridge" ? "ACROSS THE MOON BRIDGE" : "ECHOES BETWEEN PLACES"}</b><small>{journey === "path" ? "A ROAD RUBBING" : journey === "tree" ? "A TREE-BARK RUBBING" : journey === "fish" ? "A FISH RUBBING" : journey === "wall" ? "A BRICK-WALL RUBBING" : journey === "bridge" ? "A BRIDGE RUBBING" : "A BAYBERRY RUBBING"}</small></span>
        </button>
        <div className="steps" aria-label="Game progress">
          <span className={stage === "garden" ? "active" : ""}>01 {journey === "path" ? "FOLLOW" : journey === "tree" ? "TOUCH" : journey === "fish" ? "FIND" : journey === "wall" ? "APPROACH" : journey === "bridge" ? "CROSS" : "PICK"}</span>
          <i />
          <span className={stage === "rubbing" ? "active" : ""}>02 PRESS</span>
          <i />
          <span className={stage === "memory" ? "active" : ""}>03 LISTEN</span>
        </div>
        {stage !== "rubbing" && (
          <button className="sound" onClick={toggleSound} aria-label="Toggle sound">
            <span className={(stage === "memory" ? soundOn : backgroundOn) ? "soundwaves on" : "soundwaves"}>)))</span> SOUND
          </button>
        )}
      </header>}

      {stage === "cover" && (
        <section className="cover" aria-label="Echoes Between Places introduction">
          <img src="/cover.jpg" alt="Echoes Between Places — a translation of place, culture, and sound" />
          <button className="start-game" onClick={startGame}>start game</button>
        </section>
      )}

      {(stage === "panorama" || stage === "cover") && (
        <section className="panorama" aria-label="A panoramic garden">
          <div className="panorama-frame">
            <img src="/garden-panorama.jpg" alt="A dreamlike garden with a bayberry tree on the right hill" />
            <button className="tree-gate" onClick={() => enterGarden("bayberry")} aria-label="Enter the bayberry grove">
              <span>ENTER THE BAYBERRY GROVE</span>
            </button>
            <button className="path-gate" onClick={() => enterGarden("path")} aria-label="Follow the woodland path">
              <span>FOLLOW THE WOODLAND PATH</span>
            </button>
            <button className="wood-gate" onClick={() => enterGarden("tree")} aria-label="Enter the quiet tree grove">
              <span>ENTER THE QUIET GROVE</span>
            </button>
            <button className="pond-gate" onClick={() => enterGarden("fish")} aria-label="Look into the garden pond">
              <span>LOOK INTO THE POND</span>
            </button>
            <button className="house-gate" onClick={() => enterGarden("wall")} aria-label="Approach the brick house">
              <span>APPROACH THE HOUSE</span>
            </button>
            <button className="bridge-gate" onClick={() => enterGarden("bridge")} aria-label="Cross the moon bridge">
              <span>CROSS THE MOON BRIDGE</span>
            </button>
          </div>
          <div className="panorama-title">
            <small>A BAYBERRY RUBBING JOURNEY</small>
            <h1>Echoes Between Places</h1>
            <p>Find the bayberry tree and step into its memory.</p>
          </div>
          <div className="panorama-hint">CLICK THE BAYBERRY TREE <i>↗</i></div>
        </section>
      )}

      {stage === "garden" && (
        <section className={`garden ${journey}-journey`} onPointerMove={moveGarden} onPointerLeave={restGarden}>
          <img className="branch-photo" src={journey === "path" ? "/path-scene.jpg" : journey === "tree" ? "/tree-scene.jpg" : journey === "fish" ? "/fish-scene.png" : journey === "wall" ? "/wall-scene.jpg" : journey === "bridge" ? "/bridge-scene.png" : "/bayberry-scene.jpg"} alt={journey === "path" ? "A quiet woodland path between tall trees" : journey === "tree" ? "A contemplative grove of pale woodland trunks" : journey === "fish" ? "A pale koi swimming slowly through calm water" : journey === "wall" ? "A close view of a quiet brick house wall" : journey === "bridge" ? "The crest of a pale moon bridge above a garden river" : "A hanging bayberry branch"} />
          <div className="garden-wash" />
          <div className="intro">
            <p className="eyebrow">{journey === "path" ? "A QUIET WAY · BETWEEN THE WOODS AND DISTANT HOMES" : journey === "tree" ? "PALE TRUNKS · A RHYTHM HIDDEN IN THE GROVE" : journey === "fish" ? "STILL WATER · A PALE SHAPE BENEATH THE SKY" : journey === "wall" ? "BRICK AND LIGHT · A KITCHEN BREATHING BEYOND" : journey === "bridge" ? "MOON BRIDGE · AN OAR MOVING BELOW THE CREST" : "MINOR HEAT · THE HILLS SOUTH OF THE YANGTZE"}</p>
            <h1>{journey === "path" ? <>Follow the path.<br />Hear where it leads.</> : journey === "tree" ? <>Touch the bark.<br />Hear the wood.</> : journey === "fish" ? <>Follow the fish.<br />Keep the current.</> : journey === "wall" ? <>Touch the wall.<br />Hear the home.</> : journey === "bridge" ? <>Cross the bridge.<br />Hear the river.</> : <>Pick a bayberry.<br />Keep a summer.</>}</h1>
            <p>{journey === "path" ? "Touch the marked trace on the road and follow its bend toward the sounds beyond the trees." : journey === "tree" ? "Touch the marked trunk and enter the quiet rhythm held beneath its bark." : journey === "fish" ? "Touch the marked place on the koi and follow its quiet passage through the pond." : journey === "wall" ? "Is someone cooking inside? Touch the marked bricks and listen to the sounds coming through the wall." : journey === "bridge" ? "Touch the marked stone at the crest and listen for an oar moving through the water below." : "The fruit is ripe. Touch the marked bayberry and choose what will leave today’s impression."}</p>
            <div className="picked"><span className={picked ? "filled" : ""} /> <em>{picked} / 1</em></div>
          </div>
          <button className="berry berry-b" onClick={markDetail} aria-label={journey === "path" ? "Touch the marked trace on the path" : journey === "tree" ? "Touch the marked tree trunk" : journey === "fish" ? "Touch the marked place on the koi" : journey === "wall" ? "Touch the marked bricks" : journey === "bridge" ? "Touch the marked bridge stone" : "Pick the marked bayberry"}><span /></button>
          <div className="hint"><b>{journey === "path" ? "TOUCH THE PATH" : journey === "tree" ? "TOUCH THE TRUNK" : journey === "fish" ? "TOUCH THE FISH" : journey === "wall" ? "TOUCH THE WALL" : journey === "bridge" ? "TOUCH THE BRIDGE" : "TOUCH THE FRUIT"}</b><span>{journey === "path" ? "FOLLOW IT INTO THE WOODS" : journey === "tree" ? "LISTEN BENEATH THE BARK" : journey === "fish" ? "FOLLOW IT THROUGH THE WATER" : journey === "wall" ? "LISTEN TO THE ROOM BEYOND" : journey === "bridge" ? "LISTEN TO THE OAR BELOW" : "LET IT FALL INTO THE BASKET"}</span></div>
          <div className="vertical">{journey === "path" ? <>Every road holds the echo of a journey<br />Every bend carries a distant voice</> : journey === "tree" ? <>Every ring keeps a season<br />Every hollow carries a woodland rhythm</> : journey === "fish" ? <>Every ripple carries a reflection<br />Every turn gathers the sound of water</> : journey === "wall" ? <>Every brick keeps a touch<br />Every room carries the warmth of a meal</> : journey === "bridge" ? <>Every crossing joins two shores<br />Every oar leaves a circle in the river</> : <>In the fifth month, bayberries ripen<br />Red pearls scatter through the tree</>}</div>
        </section>
      )}

      {stage === "rubbing" && (
        <section className={`rubbing ${journey}-rubbing`}>
          <img
            className="rubbing-background"
            src={journey === "path" ? "/path-scene.jpg" : journey === "tree" ? "/tree-scene.jpg" : journey === "fish" ? "/fish-scene.png" : journey === "wall" ? "/wall-scene.jpg" : journey === "bridge" ? "/bridge-scene.png" : "/bayberry-scene.jpg"}
            alt=""
            aria-hidden="true"
          />
          <div className="rubbing-chapter">Chapter 1</div>
          <div className="rubbing-title">Print the translation</div>
          <div className="rubbing-copy">
            <p className="eyebrow">{journey === "path" ? "CHAPTER TWO · PRESS THE ROAD" : journey === "tree" ? "CHAPTER TWO · PRESS THE BARK" : journey === "fish" ? "CHAPTER TWO · PRESS THE CURRENT" : journey === "wall" ? "CHAPTER TWO · PRESS THE BRICKS" : journey === "bridge" ? "CHAPTER TWO · PRESS THE CROSSING" : "CHAPTER TWO · LEAVE AN IMPRESSION"}</p>
            <h2>{journey === "path" ? <>Your hand follows the path.<br />Press its passing into paper.</> : journey === "tree" ? <>Your hand meets the bark.<br />Press its years into paper.</> : journey === "fish" ? <>Your hand follows the water.<br />Press the fish into paper.</> : journey === "wall" ? <>Your hand meets the wall.<br />Press its touch into paper.</> : journey === "bridge" ? <>Your hand crosses the stone.<br />Press its passage into paper.</> : <>Your hand is the inkstone.<br />Press the fragrance into paper.</>}</h2>
            <p>{journey === "path" ? "Press and rub across the paper. Your movement will slowly reveal the scattered marks of the road." : journey === "tree" ? "Press and rub across the paper. Your movement will reveal the exact grain and broken texture of the tree." : journey === "fish" ? "Press and rub across the paper. Your movement will reveal only the dark traces of the fish and current." : journey === "wall" ? "Press and rub across the paper. Your movement will reveal only the dark broken traces of the brick surface." : journey === "bridge" ? "Press and rub across the paper. Your movement will reveal only the dark traces of the bridge and riverbank." : "Press and rub across the paper. Your movement will slowly reveal the textures of the fruit and leaf."}</p>
          </div>
          <div className="paper-wrap">
            <canvas
              ref={canvasRef}
              onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); drawAt(e.clientX, e.clientY); }}
              onPointerMove={(e) => drawing.current && drawAt(e.clientX, e.clientY)}
              onPointerUp={() => { drawing.current = false; }}
              onPointerCancel={() => { drawing.current = false; }}
              aria-label={journey === "path" ? "Rub the paper to reveal the road impression" : journey === "tree" ? "Rub the paper to reveal the tree-bark impression" : journey === "fish" ? "Rub the paper to reveal the fish impression" : journey === "wall" ? "Rub the paper to reveal the brick-wall impression" : journey === "bridge" ? "Rub the paper to reveal the bridge impression" : "Rub the paper to reveal the bayberry impression"}
            />
            {progress < 8 && <div className="rubbing-cursor">PRESS · RUB</div>}
            <div className="paper-progress">
              <div className="meter"><span style={{ width: `${progress}%` }} /><em>{progress}%</em></div>
              <small>{journey === "path" ? (progress < 32 ? "BEGIN WHERE THE ROAD BENDS" : progress < 72 ? "GOOD — FOLLOW THE SCATTERED STONES" : "THE PATH IS CLEAR") : journey === "tree" ? (progress < 32 ? "BEGIN AT THE HEART OF THE TRUNK" : progress < 72 ? "GOOD — FOLLOW THE GRAIN" : "THE BARK IS CLEAR") : journey === "fish" ? (progress < 32 ? "BEGIN ALONG THE FISH'S BACK" : progress < 72 ? "GOOD — FOLLOW THE CURRENT" : "THE FISH IS CLEAR") : journey === "wall" ? (progress < 32 ? "BEGIN AT THE CENTRE OF THE BRICKS" : progress < 72 ? "GOOD — FOLLOW THE MORTAR" : "THE WALL IS CLEAR") : journey === "bridge" ? (progress < 32 ? "BEGIN AT THE CREST OF THE BRIDGE" : progress < 72 ? "GOOD — FOLLOW THE STONE" : "THE CROSSING IS CLEAR") : (progress < 32 ? "BEGIN AT THE HEART OF THE FRUIT" : progress < 72 ? "GOOD — NOW REVEAL THE LEAF" : "THE IMPRESSION IS CLEAR")}</small>
              {progress >= 72 && (
                <button className="continue ready" onClick={beginMemory}>
                  <span>Click to hear</span><span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {stage === "memory" && (
        <section className={`memory ${journey}-memory`}>
          <img
            className="memory-background"
            src={journey === "path" ? "/path-scene.jpg" : journey === "tree" ? "/tree-scene.jpg" : journey === "fish" ? "/fish-scene.png" : journey === "wall" ? "/wall-scene.jpg" : journey === "bridge" ? "/bridge-scene.png" : "/bayberry-scene.jpg"}
            alt=""
            aria-hidden="true"
          />
          <div className="memory-wash" />
          <div className="memory-chapter">Chapter 2</div>
          <div className="memory-heading">Hear the translation</div>
          <div
            className={`final-print ${journey === "path" ? "path-print" : journey === "tree" ? "tree-print" : journey === "fish" ? "fish-print" : journey === "wall" ? "wall-print" : journey === "bridge" ? "bridge-print" : ""}`}
            role="img"
            aria-label={journey === "path" ? "The finished road rubbing" : journey === "tree" ? "The finished tree-bark rubbing" : journey === "fish" ? "The finished fish rubbing" : journey === "wall" ? "The finished brick-wall rubbing" : journey === "bridge" ? "The finished bridge rubbing" : "The finished bayberry and leaf rubbing"}
          />
          <div className="memory-copy">
            <h2>{journey === "path" ? "Road" : journey === "tree" ? "Tree" : journey === "fish" ? "Fish" : journey === "wall" ? "Wall" : journey === "bridge" ? "Bridge" : "Waxberry"}</h2>
            <p className="memory-location">{journey === "tree" ? "Location: Henan, China." : journey === "path" || journey === "wall" || journey === "bridge" ? "Location: Inner Mongolia, China." : "Location: Zhejiang, China."}</p>
          </div>
          <div className={`waveform-shell${soundOn ? " playing" : ""}`}>
            <canvas ref={waveformRef} className="memory-waveform" aria-label="Live waveform of the field recording" />
            <small>{soundOn ? "PLAYING FIELD RECORDING" : audioFinished ? "FIELD RECORDING COMPLETE" : "PREPARING FIELD RECORDING"}</small>
          </div>
          <button className="again" onClick={reset}>Make another <span>↺</span></button>
        </section>
      )}
      <div className="rotate-notice" aria-hidden="true">
        <span className="rotate-phone">▭</span>
        <b>ROTATE YOUR PHONE</b>
        <small>THIS JOURNEY PLAYS IN 16:9 LANDSCAPE</small>
      </div>
    </main>
  );
}
