import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  CircleUserRound,
  Download,
  Heart,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Signal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from "lucide-react";
import {
  duration,
  steps,
  storyAt,
  wardrobe,
  taps,
  cameraAt,
  ease,
} from "./story.mjs";
import { playSound, resumeSound } from "./sound.mjs";

const filmMode =
  new URLSearchParams(window.location.search).get("film") === "1";
const media = (name) => `./media/atelier/${name}`;
const outfitIds = ["jacket", "knit", "trousers", "sneakers", "tote"];
const defaultMessages = [
  {
    id: 1,
    side: "mira",
    text: "Morning. Let's keep today easy: soft sage, a little oat, and your favourite ink trousers.",
  },
  {
    id: 2,
    side: "mira",
    text: "The cloud sneakers keep it relaxed. Your walnut tote brings it all together.",
  },
];
const icons = {
  chat: MessageCircle,
  closet: ShoppingBag,
  lookbook: ListChecks,
  profile: CircleUserRound,
};

function ProductImage({ item, className = "" }) {
  return (
    <img className={className} src={media(`${item.id}.png`)} alt={item.name} />
  );
}

function alignStoryScroll(seconds) {
  const scroll = document.querySelector(".chat-content, .outfit-detail");
  if (!scroll) return;
  if (scroll.classList.contains("chat-content")) {
    scroll.scrollTop =
      seconds >= 26
        ? scroll.scrollHeight
        : Math.max(0, Math.min(1, (seconds - 7.6) / 2)) * 190;
  } else {
    scroll.scrollTop =
      seconds >= 22.5
        ? 160
        : Math.max(0, Math.min(1, (seconds - 12.4) / 2)) * 175;
  }
}

function updateDemoPointer(seconds) {
  for (const [index, dot] of [
    ...document.querySelectorAll(".typing i"),
  ].entries()) {
    dot.style.opacity = String(
      0.4 + (Math.sin(seconds * 7 - index * 0.8) + 1) * 0.3,
    );
    dot.style.transform = `translateY(${Math.sin(seconds * 7 - index * 0.8) * 1.4}px)`;
  }
  const cursor = document.querySelector(".tap-cursor");
  const screen = document.querySelector(".phone-screen");
  if (!cursor || !screen) return;
  const event = taps.find(
    (tap) => seconds <= tap.time + 0.5 && seconds >= tap.time - 1.15,
  );
  if (!event) {
    cursor.style.opacity = "0";
    return;
  }
  const target = document.querySelector(
    `.incoming [data-target="${event.target}"], .phone-dock [data-target="${event.target}"]`,
  );
  if (!target) {
    cursor.style.opacity = "0";
    return;
  }
  const bounds = target.getBoundingClientRect(),
    frame = screen.getBoundingClientRect();
  const x =
    ((bounds.left + bounds.width / 2 - frame.left) * screen.clientWidth) /
    frame.width;
  const y =
    ((bounds.top + bounds.height / 2 - frame.top) * screen.clientHeight) /
    frame.height;
  const move = ease((seconds - event.time + 1.15) / 0.85);
  const px = screen.clientWidth * 0.85 + (x - screen.clientWidth * 0.85) * move;
  const py =
    screen.clientHeight * 0.85 + (y - screen.clientHeight * 0.85) * move;
  cursor.style.opacity = String(
    seconds < event.time + 0.35
      ? 0.95
      : Math.max(0, 1 - (seconds - event.time - 0.35) / 0.15),
  );
  cursor.style.transform = `translate(${px}px, ${py}px)`;
  const delta = seconds - event.time;
  const dot = cursor.querySelector(".cursor-dot"),
    ring = cursor.querySelector(".tap-ring");
  dot.style.transform = `scale(${delta >= 0 && delta < 0.15 ? 0.7 : 1})`;
  ring.style.opacity = String(delta >= 0 && delta < 0.5 ? 1 - delta / 0.5 : 0);
  ring.style.transform = `scale(${1 + Math.max(0, delta) * 5})`;
  for (const pressed of document.querySelectorAll(".demo-pressed"))
    pressed.classList.remove("demo-pressed");
  if (delta >= 0 && delta < 0.16) target.classList.add("demo-pressed");
}

export default function App() {
  const [view, setView] = useState("chat");
  const [messages, setMessages] = useState(defaultMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [wearing, setWearing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(outfitIds);
  const [notice, setNotice] = useState("");
  const [tour, setTour] = useState(false);
  const [time, setTime] = useState(0);
  const [filmTime, setFilmTime] = useState(0);
  const [occasion, setOccasion] = useState("Everyday");
  const musicRef = useRef(null);
  const lastSoundTime = useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualTap, setManualTap] = useState(null);
  const chatBottom = useRef(null);
  const replyTimer = useRef(null);
  const noticeTimer = useRef(null);
  const stage = storyAt(filmMode ? filmTime : time);
  const displayView = filmMode || tour ? stage.view : view;
  const displayWearing = filmMode || tour ? stage.time >= 24.1 : wearing;
  const movieSelected = [
    "jacket",
    "knit",
    "sneakers",
    ...(stage.time >= 17.8 ? ["trousers"] : []),
    ...(stage.time >= 19.4 ? ["tote"] : []),
  ];
  const displaySelected = filmMode || tour ? movieSelected : selected;
  const showOutfit = !(filmMode || tour) || stage.time >= 7;
  const displayedMessages =
    filmMode || tour
      ? defaultMessages.slice(
          0,
          stage.time >= 5.2 ? 2 : stage.time >= 3.8 ? 1 : 0,
        )
      : messages;

  useEffect(() => {
    if (!filmMode) return;
    // Deterministic rendering is used only by the portrait-video capture page.
    window.__setFilmTime = (seconds) => {
      flushSync(() => setFilmTime(seconds));
      alignStoryScroll(seconds);
      updateDemoPointer(seconds);
    };
    return () => {
      delete window.__setFilmTime;
    };
  }, []);

  useEffect(() => {
    if (!tour || filmMode) return;
    let frame;
    let previous;
    const tick = (stamp) => {
      if (previous !== undefined)
        setTime((value) =>
          Math.min(duration, value + (stamp - previous) / 1000),
        );
      previous = stamp;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tour]);

  useEffect(() => {
    if (tour && time >= duration) {
      setTour(false);
      setView("chat");
      setWearing(true);
      setMessages([
        ...defaultMessages,
        { id: 3, side: "you", text: "Wearing it ♥" },
        {
          id: 4,
          side: "mira",
          text: "That looks like you. Tomorrow, we can give those blue jeans a moment.",
        },
      ]);
    }
  }, [time, tour]);

  useEffect(() => {
    if (filmMode || tour || view !== "chat" || (!messages.length && !typing))
      return;
    chatBottom.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [messages, typing, tour, view]);

  useEffect(
    () => () => {
      clearTimeout(replyTimer.current);
      clearTimeout(noticeTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (tour) {
      alignStoryScroll(time);
      updateDemoPointer(time);
    }
    if (!tour)
      document.querySelector(".tap-cursor")?.style.setProperty("opacity", "0");
  }, [tour, time]);

  useEffect(() => {
    if (tour && !filmMode) {
      if (soundEnabled) {
        for (const tap of taps)
          if (tap.time > lastSoundTime.current && tap.time <= time)
            playSound(tap.kind);
        for (const at of [3.8, 5.2, 27.1])
          if (at > lastSoundTime.current && at <= time) playSound("message");
      }
      lastSoundTime.current = time;
    } else musicRef.current?.pause();
  }, [tour, time, soundEnabled]);

  function beginMusic(at) {
    lastSoundTime.current = at;
    if (soundEnabled && musicRef.current) {
      void resumeSound();
      musicRef.current.currentTime = at;
      musicRef.current.volume = 0.65;
      void musicRef.current
        .play()
        .catch(() => toast("Tap Play with sound to start the audio."));
    }
  }

  function toggleSound() {
    const enabled = !soundEnabled;
    setSoundEnabled(enabled);
    if (!enabled) musicRef.current?.pause();
    else {
      void resumeSound().then(() => playSound("select"));
      if (tour && musicRef.current) {
        musicRef.current.currentTime = time;
        musicRef.current.volume = 0.65;
        void musicRef.current.play();
      }
    }
  }

  function phoneTap(event) {
    const button = event.target.closest("button");
    if (!button || button.disabled || filmMode || tour) return;
    const screen = event.currentTarget;
    const rect = screen.getBoundingClientRect();
    setManualTap({
      x: ((event.clientX - rect.left) * screen.clientWidth) / rect.width,
      y: ((event.clientY - rect.top) * screen.clientHeight) / rect.height,
      id: Date.now(),
    });
    const kind = button.dataset.target?.startsWith("item-")
      ? "select"
      : button.dataset.target === "wear"
        ? "success"
        : "tap";
    if (soundEnabled) void resumeSound().then(() => playSound(kind));
  }

  function pauseTour() {
    setView(stage.view === "outro" ? "chat" : stage.view);
    setWearing(displayWearing);
    setTour(false);
  }

  function toast(text) {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(""), 2600);
  }

  function navigate(next) {
    if (tour) setWearing(displayWearing);
    setTour(false);
    setView(next);
  }

  function wear() {
    setTour(false);
    setWearing(true);
    setView("outfit");
    toast("Today's outfit is ready. Looking good.");
  }

  function saveLook() {
    setTour(false);
    setSaved(true);
    toast("Saved to your lookbook.");
  }

  function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    setTour(false);
    setMessages((items) => [...items, { id: Date.now(), side: "you", text }]);
    setDraft("");
    setTyping(true);
    const response = /rain|cold|tomorrow/i.test(text)
      ? "For rain, keep the sage jacket and switch to the walnut loafers. Your tote has room for a small umbrella."
      : /casual|comfort|jeans/i.test(text)
        ? "Try the oat knit, your washed blue jeans, and cloud sneakers. Select them in your closet and make it yours."
        : /work|office|meeting/i.test(text)
          ? "The sage jacket with ink trousers and walnut loafers is a lovely work edit. Add the daily tote and you are ready."
          : "I would start with your sage studio jacket today. Open The Olive Edit for all five pieces, or tell me what your day looks like.";
    clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      setMessages((items) => [
        ...items,
        { id: Date.now(), side: "mira", text: response },
      ]);
      setTyping(false);
    }, 1100);
  }

  function toggleItem(id) {
    setTour(false);
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  }

  function startTour() {
    setTime(0);
    beginMusic(0);
    setTour(true);
  }

  const camera = cameraAt(stage.time);
  const phoneStyle =
    filmMode || tour
      ? {
          transform: `rotateY(${camera.y}deg) rotateZ(${camera.z}deg) scale(${filmMode ? camera.scale * 1.04 : camera.scale})`,
          opacity: stage.view === "outro" ? 1 - stage.transition : 1,
        }
      : undefined;

  function outfitItems() {
    return (
      <div className="outfit-items">
        {outfitIds.map((id) => {
          const item = wardrobe.find((entry) => entry.id === id);
          return (
            <div className="item-line" key={id}>
              <ProductImage item={item} />
              <div>
                <strong>{item.name}</strong>
                <span>In your closet</span>
              </div>
              <Check size={14} />
            </div>
          );
        })}
      </div>
    );
  }

  function renderView(targetView = displayView) {
    if (targetView === "lock")
      return (
        <button
          type="button"
          className="lock-screen"
          data-target="unlock"
          onClick={() => navigate("chat")}
          aria-label="Unlock the stylist demo"
        >
          <LockKeyhole size={17} />
          <p>Wednesday, 11 November</p>
          <h2>9:41</h2>
          <span>
            <Sun size={12} />
            24° · a little sunshine
          </span>
          <div className="lock-bottom">
            <Sparkles size={18} />
            <p>Less deciding. More you.</p>
            <ArrowUp size={16} />
            <small>Tap to begin</small>
          </div>
        </button>
      );

    if (targetView === "chat" || targetView === "outro")
      return (
        <>
          <div className="app-title">
            <span className="stylist-avatar">m</span>
            <div>
              <strong>
                Mira <span>· Your stylist</span>
              </strong>
              <small>
                <i /> A little ahead of your day
              </small>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Open stylist profile"
              onClick={() => navigate("profile")}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div
            className="chat-content app-scroll"
            key={filmMode || tour ? stage.index : "chat"}
          >
            <p className="date-divider">A LITTLE INSPIRATION FOR TODAY</p>
            {displayedMessages.slice(0, 2).map((message) => (
              <p key={message.id} className={`bubble ${message.side}`}>
                {message.text}
              </p>
            ))}
            {(typing || ((filmMode || tour) && stage.time < 7)) && (
              <div className="typing" role="status" aria-label="Mira is typing">
                <i />
                <i />
                <i />
              </div>
            )}
            {showOutfit && (
              <div
                className="outfit-chat-card"
                style={
                  filmMode || tour
                    ? {
                        opacity: ease((stage.time - 7) / 0.6),
                        transform: `translateY(${(1 - ease((stage.time - 7) / 0.6)) * 16}px)`,
                      }
                    : undefined
                }
              >
                <div className="card-heading">
                  <Sparkles size={12} />
                  <span>FOR TODAY, FOR YOU</span>
                </div>
                <strong>The Olive Edit.</strong>
                <p>24° · clear skies · {occasion.toLowerCase()}</p>
                <button
                  type="button"
                  className="model-button"
                  onClick={() => navigate("outfit")}
                  aria-label="Open your Olive Edit outfit"
                >
                  <img
                    src={media("look.png")}
                    alt="Complete Olive Edit outfit with a studded skirt, knee-high boots, and brown bag"
                  />
                </button>
                <div className="item-chips">
                  {outfitIds.slice(0, 3).map((id) => {
                    const item = wardrobe.find((entry) => entry.id === id);
                    return (
                      <span key={id}>
                        <ProductImage item={item} />
                        {item.name}
                      </span>
                    );
                  })}
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className="secondary"
                    data-target="open-look"
                    onClick={() => navigate("outfit")}
                  >
                    Open outfit
                  </button>
                  <button type="button" className="primary" onClick={wear}>
                    {displayWearing ? (
                      <>
                        <Check size={12} /> Wearing it
                      </>
                    ) : (
                      "Wearing it"
                    )}
                  </button>
                </div>
              </div>
            )}
            {displayedMessages.slice(2).map((message) => (
              <p key={message.id} className={`bubble ${message.side}`}>
                {message.text}
              </p>
            ))}
            {(filmMode || tour) && stage.time >= 26 && (
              <>
                <p className="bubble you">Wearing it ♥</p>
                <p className="bubble mira">
                  That looks like you. Tomorrow, we can give those blue jeans a
                  moment.
                </p>
              </>
            )}
            <div ref={chatBottom} />
          </div>
          <form className="composer" onSubmit={send}>
            <button
              type="button"
              className="icon-button"
              onClick={() => navigate("closet")}
              aria-label="Choose a piece from your closet"
            >
              <Plus size={20} />
            </button>
            <label className="sr-only" htmlFor="stylist-message">
              Message Mira
            </label>
            <input
              id="stylist-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Chat with Mira"
              maxLength={300}
            />
            <button
              type="submit"
              className="send-button"
              aria-label="Send message"
              disabled={!draft.trim() || typing}
            >
              <ArrowUp size={15} />
            </button>
          </form>
        </>
      );

    if (targetView === "outfit")
      return (
        <>
          <div className="workspace-heading">
            <button
              type="button"
              className="icon-button"
              onClick={() => navigate("chat")}
              aria-label="Back to chat"
            >
              <ArrowLeft size={17} />
            </button>
            <span>YOUR LOOK / 01</span>
            <button
              type="button"
              className={`icon-button ${saved ? "saved" : ""}`}
              onClick={saveLook}
              aria-label={saved ? "Outfit saved" : "Save outfit"}
            >
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="outfit-detail app-scroll">
            <div className="detail-photo">
              <img
                src={media("look.png")}
                alt="Your complete Olive Edit outfit"
              />
              <span className="photo-label">
                <Sparkles size={11} /> Styled by Mira
              </span>
            </div>
            <p className="tiny-label">YOUR MORNING, SORTED</p>
            <h2>The Olive Edit</h2>
            <p className="muted">Everyday · 22–26°C</p>
            <button
              type="button"
              className="primary wear-button"
              data-target="wear"
              onClick={wear}
            >
              {displayWearing && <Check size={15} />}
              {displayWearing ? "Wearing today" : "Wear today"}
            </button>
            <div className="detail-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  navigate("chat");
                  toast("Ask Mira about this look in chat.");
                }}
              >
                Ask Mira
              </button>
              <button type="button" className="secondary" onClick={saveLook}>
                {saved ? "Saved to lookbook" : "Add to lookbook"}
              </button>
            </div>
            <p className="tiny-label">IN THIS LOOK</p>
            {outfitItems()}
            <div className="styling-note">
              <Sparkles size={14} />
              <p>
                The boots balance the mini. A gold ring is all the extra you
                need.
              </p>
            </div>
          </div>
        </>
      );

    if (targetView === "closet") {
      const filtered = wardrobe.filter(
        (item) =>
          (category === "All" || category === item.category) &&
          item.name.toLowerCase().includes(search.toLowerCase()),
      );
      return (
        <>
          <div className="workspace-heading">
            <div>
              <p className="tiny-label">YOUR WORKSPACE</p>
              <h2>Closet</h2>
              <small>{wardrobe.length} pieces, all yours</small>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => navigate("chat")}
              aria-label="Close closet"
            >
              <X size={18} />
            </button>
          </div>
          <div className="closet-search">
            <Search size={15} />
            <label className="sr-only" htmlFor="closet-search">
              Search your closet
            </label>
            <input
              id="closet-search"
              placeholder="Find a favourite..."
              value={search}
              onChange={(event) => {
                setTour(false);
                setSearch(event.target.value);
              }}
            />
          </div>
          <fieldset className="categories" aria-label="Filter wardrobe">
            {["All", "Tops", "Bottoms", "Shoes", "Accessories"].map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={category === name}
                className={category === name ? "active" : ""}
                onClick={() => {
                  setTour(false);
                  setCategory(name);
                }}
              >
                {name}
              </button>
            ))}
          </fieldset>
          <div className="closet-content app-scroll">
            <div className="closet-grid">
              {filtered.map((item) => (
                <button
                  type="button"
                  className={`closet-item ${displaySelected.includes(item.id) ? "selected" : ""}`}
                  key={item.id}
                  data-target={`item-${item.id}`}
                  onClick={() => toggleItem(item.id)}
                  aria-label={item.name}
                  aria-pressed={displaySelected.includes(item.id)}
                >
                  <div>
                    <ProductImage item={item} />
                    {displaySelected.includes(item.id) && (
                      <span className="selected-tick">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <strong>{item.name}</strong>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="empty-copy">No pieces found. Try another search.</p>
            )}
          </div>
          <div className="closet-selection">
            <span>{displaySelected.length} pieces selected</span>
            <button
              type="button"
              className="primary"
              data-target="view-edit"
              onClick={() => navigate("outfit")}
              disabled={!displaySelected.length}
            >
              View edit <ArrowRight size={12} />
            </button>
          </div>
        </>
      );
    }

    if (targetView === "lookbook")
      return (
        <>
          <div className="workspace-heading">
            <div>
              <p className="tiny-label">THE ONES TO COME BACK TO</p>
              <h2>Lookbook</h2>
              <small>
                {saved ? "1 saved look" : "Your favourite looks live here"}
              </small>
            </div>
            <Heart size={18} />
          </div>
          <div className="lookbook-content app-scroll">
            {saved ? (
              <button
                type="button"
                className="saved-look"
                onClick={() => navigate("outfit")}
              >
                <img
                  src={media("look.png")}
                  alt="Your saved Olive Edit outfit"
                />
                <strong>The Olive Edit</strong>
                <span>
                  Everyday · warm weather <ChevronRight size={12} />
                </span>
              </button>
            ) : (
              <div className="empty-lookbook">
                <Heart size={30} />
                <h3>A look worth keeping.</h3>
                <p>
                  Save today's outfit and find it here whenever you need a
                  little inspiration.
                </p>
                <button
                  type="button"
                  className="primary"
                  onClick={() => navigate("outfit")}
                >
                  Explore today's look
                </button>
              </div>
            )}
          </div>
        </>
      );

    return (
      <>
        <div className="workspace-heading">
          <div>
            <p className="tiny-label">A LITTLE MORE YOU</p>
            <h2>Your profile</h2>
          </div>
          <CircleUserRound size={20} />
        </div>
        <div className="profile-content app-scroll">
          <div className="profile-avatar">M</div>
          <h3>Good morning, you.</h3>
          <p>Mira's getting to know your everyday.</p>
          <div className="profile-panel">
            <span>Today's occasion</span>
            <div>
              {["Everyday", "Work", "Weekend"].map((name) => (
                <button
                  type="button"
                  className={occasion === name ? "active" : ""}
                  key={name}
                  aria-pressed={occasion === name}
                  onClick={() => setOccasion(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="profile-stat">
            <span>In your closet</span>
            <strong>{wardrobe.length} pieces</strong>
          </div>
          <div className="profile-stat">
            <span>Saved to lookbook</span>
            <strong>{saved ? "1 look" : "0 looks"}</strong>
          </div>
          <div className="profile-stat">
            <span>Today's outfit</span>
            <strong>{wearing ? "Ready to wear" : "Waiting for you"}</strong>
          </div>
          <p className="concept-note">
            This is an interactive concept. Mira's replies are scripted; your
            choices stay in this visit.
          </p>
        </div>
      </>
    );
  }

  return (
    <div
      className={`studio-page ${filmMode ? "film-mode" : ""} ${tour ? "tour-running" : ""}`}
    >
      {!filmMode && (
        <audio
          ref={musicRef}
          src={media("atelier-music.mp3")}
          preload="auto"
          aria-label="Walkthrough soundtrack"
        >
          <track
            kind="captions"
            src={media("atelier-captions.vtt")}
            srcLang="en"
            label="Music and sound descriptions"
          />
        </audio>
      )}
      {!filmMode && (
        <header className="studio-header">
          <a className="studio-brand" href="../">
            ✳ morrow<span>/ atelier</span>
          </a>
          <nav>
            <a href="/stories/">
              All experiments <ArrowRight size={13} />
            </a>
          </nav>
        </header>
      )}
      <main className="studio-main">
        {!filmMode && (
          <div className="editorial">
            <p className="eyebrow">
              <span /> A LITTLE AHEAD OF YOUR DAY
            </p>
            <h1>
              Less deciding.
              <br />
              <em>More you.</em>
            </h1>
            <p className="editorial-copy">
              Thoughtfully designed. Entirely your own.
              <br />
              An original wardrobe, and a calmer morning.
            </p>
            <div className="editorial-actions">
              <button type="button" className="tour-start" onClick={startTour}>
                <Play size={14} fill="currentColor" /> Play with sound
                <span>30s</span>
              </button>
              <a className="video-link" href="#film">
                The short film <ArrowDown size={13} />
              </a>
            </div>
            <div className="editorial-note">
              <div className="note-mark">m</div>
              <div>
                <strong>Meet Mira.</strong>
                <p>A little taste. A little less effort.</p>
              </div>
            </div>
            <p className="prototype-note">
              Original 3D wardrobe designs. A new story, from scratch.
            </p>
          </div>
        )}
        <section
          className="phone-stage"
          aria-label="Interactive personal stylist demo"
        >
          {filmMode && (
            <div className="film-wordmark">
              morrow <span>atelier</span>
            </div>
          )}
          <div className="phone-shadow" />
          <div
            className={`phone-device ${displayView === "lock" ? "locked" : ""}`}
            style={phoneStyle}
          >
            <div
              className="phone-screen"
              onClickCapture={phoneTap}
              role="presentation"
            >
              <div className="status-bar">
                <strong>9:41</strong>
                <div>
                  <Signal size={12} fill="currentColor" />
                  <Wifi size={12} />
                  <span className="battery">92</span>
                </div>
              </div>
              <div className="dynamic-island" />
              {(filmMode || tour) &&
                stage.index > 0 &&
                stage.transition < 1 &&
                steps[stage.index - 1].view !== displayView && (
                  <div
                    className={`phone-app outgoing ${steps[stage.index - 1].view === "lock" ? "is-lock" : ""}`}
                    aria-hidden="true"
                    inert
                    style={{
                      opacity: 1 - stage.transition,
                      transform: `translateX(${-28 * stage.transition}px)`,
                    }}
                  >
                    {renderView(steps[stage.index - 1].view)}
                  </div>
                )}
              <div
                className={`phone-app incoming ${displayView === "lock" ? "is-lock" : ""}`}
                style={
                  (filmMode || tour) &&
                  (stage.index === 0 ||
                    steps[stage.index - 1].view !== displayView)
                    ? {
                        opacity: stage.transition,
                        transform: `translateX(${(1 - stage.transition) * 28}px)`,
                      }
                    : undefined
                }
                key={displayView}
              >
                {renderView()}
              </div>
              {displayView !== "lock" && (
                <nav className="phone-dock" aria-label="App navigation">
                  {Object.entries(icons).map(([name, Icon]) => (
                    <button
                      type="button"
                      key={name}
                      className={
                        displayView === name ||
                        (name === "chat" && displayView === "outfit")
                          ? "active"
                          : ""
                      }
                      aria-label={
                        name === "chat"
                          ? "Chat with Mira"
                          : name[0].toUpperCase() + name.slice(1)
                      }
                      aria-current={displayView === name ? "page" : undefined}
                      data-target={`nav-${name}`}
                      onClick={() => navigate(name)}
                    >
                      <Icon size={19} strokeWidth={2.2} />
                      <span>{name}</span>
                    </button>
                  ))}
                </nav>
              )}
              <div className="home-indicator" />
              <div className="tap-cursor" aria-hidden="true">
                <span className="cursor-dot" />
                <span className="tap-ring" />
              </div>
              {manualTap && (
                <span
                  className="manual-ripple"
                  key={manualTap.id}
                  style={{ left: manualTap.x, top: manualTap.y }}
                  aria-hidden="true"
                />
              )}
              {notice && (
                <div className="phone-toast" role="status">
                  <Check size={13} />
                  {notice}
                </div>
              )}
            </div>
          </div>
          {(filmMode || tour) && (
            <div
              className={`brand-outro ${displayView === "outro" ? "visible" : ""}`}
              style={
                filmMode && displayView === "outro"
                  ? {
                      opacity: stage.transition,
                      transform: `translateY(${(1 - stage.transition) * 20}px)`,
                    }
                  : undefined
              }
            >
              <p>
                morrow<span>✳</span>
              </p>
              <h2>A little more you.</h2>
              <small>YOUR PERSONAL STYLIST</small>
            </div>
          )}
          <div className="stage-caption">
            <span>
              {filmMode || tour
                ? `${String(stage.index + 1).padStart(2, "0")} / ${stage.title}`
                : "01 / YOUR MORNING, SORTED"}
            </span>
            <p>
              {filmMode || tour
                ? stage.caption
                : "Try the chat, outfit, and closet."}
            </p>
          </div>
        </section>
      </main>
      {!filmMode && (
        <>
          <section className="tour-controls" aria-label="Walkthrough controls">
            <div className="transport">
              <button
                type="button"
                aria-label={tour ? "Pause walkthrough" : "Play walkthrough"}
                onClick={() => {
                  if (tour) {
                    pauseTour();
                    return;
                  }
                  if (!tour && time >= duration) setTime(0);
                  beginMusic(time >= duration ? 0 : time);
                  setTour(true);
                }}
              >
                {tour ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button
                type="button"
                aria-label="Restart walkthrough"
                onClick={startTour}
              >
                <RotateCcw size={14} />
              </button>
              <span>{String(Math.floor(time)).padStart(2, "0")} / 30s</span>
            </div>
            <div className="timeline" aria-hidden="true">
              <span style={{ width: `${(time / duration) * 100}%` }} />
            </div>
            <button
              type="button"
              className="sound-toggle"
              onClick={toggleSound}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              {soundEnabled ? "Sound on" : "Sound off"}
            </button>
            <div className="scene-shortcuts">
              {steps
                .filter((_, index) => [0, 2, 3, 4].includes(index))
                .map((step) => (
                  <button
                    type="button"
                    key={step.start}
                    onClick={() => {
                      setTime(step.start);
                      beginMusic(step.start);
                      setTour(true);
                    }}
                  >
                    {step.view === "lock"
                      ? "Morning"
                      : step.view === "chat"
                        ? "Chat"
                        : step.view === "outfit"
                          ? "Outfit"
                          : "Closet"}
                  </button>
                ))}
            </div>
          </section>
          <section
            className="film-section"
            id="film"
            aria-labelledby="film-title"
          >
            <div>
              <p className="eyebrow">THE SAME IDEA. IN MOTION.</p>
              <h2 id="film-title">
                A morning,
                <br />
                <em>in fifteen seconds.</em>
              </h2>
              <p>
                The phone reveal, the conversation, the outfit,
                <br />
                and a wardrobe full of possibility. Now at 2× speed.
              </p>
              <a
                className="film-download"
                href={media("atelier-film-2x.mp4")}
                download
              >
                <Download size={14} /> Download 2× portrait film{" "}
                <span>MP4</span>
              </a>
            </div>
            <video
              controls
              playsInline
              preload="metadata"
              poster={media("atelier-poster.jpg")}
              aria-label="15-second portrait film of the personal-stylist demo at 2× speed"
            >
              <source src={media("atelier-film-2x.mp4")} type="video/mp4" />
              <track
                kind="captions"
                src={media("atelier-captions-2x.vtt")}
                srcLang="en"
                label="English scene descriptions"
              />
            </video>
          </section>
          <footer className="studio-footer">
            <a className="studio-brand" href="../">
              ✳ morrow
            </a>
            <p>MADE FOR THE MAYBES.</p>
            <a href="/stories/">
              Back to the collection <ArrowRight size={12} />
            </a>
          </footer>
        </>
      )}
    </div>
  );
}
