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
  Wifi,
  X,
} from "lucide-react";
import { duration, steps, storyAt, wardrobe } from "./story.mjs";

const filmMode =
  new URLSearchParams(window.location.search).get("film") === "1";
const media = (name) => `./media/${name}`;
const outfitIds = ["top", "skirt", "boots", "bag"];
const defaultMessages = [
  {
    id: 1,
    side: "noor",
    text: "Morning. 24° and dry, so let's do the leopard set today.",
  },
  {
    id: 2,
    side: "noor",
    text: "Knee-highs, the studded bag, and keep the gold ring on.",
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
    <img className={className} src={media(`${item.id}.webp`)} alt={item.name} />
  );
}

function alignStoryScroll(seconds) {
  const scroll = document.querySelector(".chat-content, .outfit-detail");
  if (!scroll) return;
  if (scroll.classList.contains("chat-content")) {
    scroll.scrollTop =
      seconds >= 26
        ? scroll.scrollHeight
        : Math.max(0, Math.min(1, (seconds - 8.7) / 2)) * 190;
  } else {
    scroll.scrollTop =
      seconds >= 23
        ? 160
        : Math.max(0, Math.min(1, (seconds - 14.7) / 2)) * 175;
  }
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
  const chatBottom = useRef(null);
  const replyTimer = useRef(null);
  const noticeTimer = useRef(null);
  const stage = storyAt(filmMode ? filmTime : time);
  const displayView = filmMode || tour ? stage.view : view;
  const displayWearing = filmMode || tour ? stage.time >= 23 : wearing;
  const showOutfit = !(filmMode || tour) || stage.time >= 8;
  const displayedMessages =
    filmMode || tour
      ? defaultMessages.slice(
          0,
          stage.time >= 5.6 ? 2 : stage.time >= 3.8 ? 1 : 0,
        )
      : messages;

  useEffect(() => {
    if (!filmMode) return;
    // Deterministic rendering is used only by the portrait-video capture page.
    window.__setFilmTime = (seconds) => {
      flushSync(() => setFilmTime(seconds));
      alignStoryScroll(seconds);
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
          side: "noor",
          text: "Love. Tomorrow looks rainy — we'll plan a cosy layer.",
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
    if (tour) alignStoryScroll(time);
  }, [tour, time]);

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
      ? "For rain, keep the boots and add a light jacket. Your off-shoulder top is a lovely option for tomorrow."
      : /casual|comfort|jeans/i.test(text)
        ? "Let's keep it relaxed: the print top, your blue loose jeans, and white sneakers. You can select them in Closet."
        : /work|office|meeting/i.test(text)
          ? "Try the print top with your blue jeans and boots. Keep the bag simple; the gold ring adds just enough polish."
          : "I'd build around your leopard top today. Open the outfit for the complete look, or tell me if you're after something more casual.";
    clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      setMessages((items) => [
        ...items,
        { id: Date.now(), side: "noor", text: response },
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
    setTour(true);
  }

  const cameraScales = [1.04, 1.11, 1.18, 1.1, 1.09, 1.14, 1.15, 1.15];
  const previousScale = cameraScales[Math.max(0, stage.index - 1)];
  const cameraScale =
    previousScale +
    (cameraScales[stage.index] - previousScale) * stage.transition;
  const phoneStyle =
    filmMode || tour
      ? {
          transform: `rotateY(${Math.sin(stage.time * 0.23) * 4}deg) rotateZ(${Math.sin(stage.time * 0.2) * 0.7}deg) scale(${filmMode ? cameraScale : 1})`,
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

  function renderView() {
    if (displayView === "lock")
      return (
        <button
          type="button"
          className="lock-screen"
          onClick={() => navigate("chat")}
          aria-label="Unlock the stylist demo"
        >
          <LockKeyhole size={17} />
          <p>Tuesday, 14 October</p>
          <h2>7:02</h2>
          <span>
            <Sun size={12} />
            24° · a little sunshine
          </span>
          <div className="lock-bottom">
            <Sparkles size={18} />
            <p>Your day, already styled.</p>
            <ArrowUp size={16} />
            <small>Tap to begin</small>
          </div>
        </button>
      );

    if (displayView === "chat" || displayView === "outro")
      return (
        <>
          <div className="app-title">
            <span className="stylist-avatar">n</span>
            <div>
              <strong>
                Noor <span>· Your stylist</span>
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
            <p className="date-divider">TUESDAY, 14 OCTOBER</p>
            {displayedMessages.slice(0, 2).map((message) => (
              <p key={message.id} className={`bubble ${message.side}`}>
                {message.text}
              </p>
            ))}
            {(typing || ((filmMode || tour) && stage.time < 8)) && (
              <div className="typing" role="status" aria-label="Noor is typing">
                <i />
                <i />
                <i />
              </div>
            )}
            {showOutfit && (
              <div className="outfit-chat-card">
                <div className="card-heading">
                  <Sparkles size={12} />
                  <span>FOR TODAY, FOR YOU</span>
                </div>
                <strong>Your leopard moment.</strong>
                <p>24° · clear skies · {occasion.toLowerCase()}</p>
                <button
                  type="button"
                  className="model-button"
                  onClick={() => navigate("outfit")}
                  aria-label="Open your leopard outfit"
                >
                  <img
                    src={media("outfit.webp")}
                    alt="Complete leopard outfit with a studded skirt, knee-high boots, and brown bag"
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
                <p className="bubble noor">
                  Love. Tomorrow looks rainy — we'll plan a cosy layer.
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
              Message Noor
            </label>
            <input
              id="stylist-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Chat with Noor"
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

    if (displayView === "outfit")
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
                src={media("outfit.webp")}
                alt="Your complete leopard outfit"
              />
              <span className="photo-label">
                <Sparkles size={11} /> Styled by Noor
              </span>
            </div>
            <p className="tiny-label">YOUR MORNING, SORTED</p>
            <h2>Leopard Low-Rise</h2>
            <p className="muted">Everyday · 22–26°C</p>
            <button
              type="button"
              className="primary wear-button"
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
                  toast("Ask Noor about this look in chat.");
                }}
              >
                Ask Noor
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

    if (displayView === "closet") {
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
                  className={`closet-item ${selected.includes(item.id) ? "selected" : ""}`}
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  aria-label={item.name}
                  aria-pressed={selected.includes(item.id)}
                >
                  <div>
                    <ProductImage item={item} />
                    {selected.includes(item.id) && (
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
            <span>{selected.length} pieces selected</span>
            <button
              type="button"
              className="primary"
              onClick={() => {
                navigate("chat");
                setDraft(
                  `Help me style ${selected.map((id) => wardrobe.find((item) => item.id === id).name).join(", ")}.`,
                );
              }}
              disabled={!selected.length}
            >
              Ask Noor <ArrowRight size={12} />
            </button>
          </div>
        </>
      );
    }

    if (displayView === "lookbook")
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
                  src={media("outfit.webp")}
                  alt="Your saved leopard outfit"
                />
                <strong>Leopard Low-Rise</strong>
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
          <p>Noor's getting to know your everyday.</p>
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
            This is an interactive concept. Noor's replies are scripted; your
            choices stay in this visit.
          </p>
        </div>
      </>
    );
  }

  return (
    <div className={`studio-page ${filmMode ? "film-mode" : ""}`}>
      {!filmMode && (
        <header className="studio-header">
          <a className="studio-brand" href="../">
            ✳ morrow<span>/ studio</span>
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
              Your day.
              <br />
              <em>Already styled.</em>
            </h1>
            <p className="editorial-copy">
              A stylist who knows your wardrobe.
              <br />A morning that feels a little more you.
            </p>
            <div className="editorial-actions">
              <button type="button" className="tour-start" onClick={startTour}>
                <Play size={14} fill="currentColor" /> Watch the walkthrough
                <span>30s</span>
              </button>
              <a className="video-link" href="#film">
                The short film <ArrowDown size={13} />
              </a>
            </div>
            <div className="editorial-note">
              <div className="note-mark">n</div>
              <div>
                <strong>Meet Noor.</strong>
                <p>Your closet, with a fresh perspective.</p>
              </div>
            </div>
            <p className="prototype-note">
              An interactive concept inspired by your reference.
            </p>
          </div>
        )}
        <section
          className="phone-stage"
          aria-label="Interactive personal stylist demo"
        >
          {filmMode && (
            <div className="film-wordmark">
              morrow <span>studio</span>
            </div>
          )}
          <div className="phone-shadow" />
          <div
            className={`phone-device ${displayView === "lock" ? "locked" : ""}`}
            style={phoneStyle}
          >
            <div className="phone-screen">
              <div className="status-bar">
                <strong>7:02</strong>
                <div>
                  <Signal size={12} fill="currentColor" />
                  <Wifi size={12} />
                  <span className="battery">92</span>
                </div>
              </div>
              <div className="dynamic-island" />
              <div
                className="phone-app"
                style={
                  filmMode || tour
                    ? {
                        opacity: stage.transition,
                        transform: `translateY(${(1 - stage.transition) * 12}px)`,
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
                          ? "Chat with Noor"
                          : name[0].toUpperCase() + name.slice(1)
                      }
                      aria-current={displayView === name ? "page" : undefined}
                      onClick={() => navigate(name)}
                    >
                      <Icon size={19} strokeWidth={2.2} />
                      <span>{name}</span>
                    </button>
                  ))}
                </nav>
              )}
              <div className="home-indicator" />
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
              <h2>Your day. Already styled.</h2>
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
            <div className="scene-shortcuts">
              {steps
                .filter((_, index) => [0, 2, 3, 4].includes(index))
                .map((step) => (
                  <button
                    type="button"
                    key={step.start}
                    onClick={() => {
                      setTime(step.start);
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
                <em>in thirty seconds.</em>
              </h2>
              <p>
                The phone reveal, the conversation, the outfit,
                <br />
                and a wardrobe full of possibility.
              </p>
              <a
                className="film-download"
                href={media("morrow-studio-film.mp4")}
                download
              >
                <Download size={14} /> Download portrait film <span>MP4</span>
              </a>
            </div>
            <video
              controls
              playsInline
              preload="metadata"
              poster={media("film-poster.jpg")}
              aria-label="30-second portrait film of the personal-stylist demo"
            >
              <source src={media("morrow-studio-film.mp4")} type="video/mp4" />
              <track
                kind="captions"
                src={media("film-captions.vtt")}
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
