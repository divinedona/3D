import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  CircleHelp,
  Folder,
  LayoutGrid,
  Lightbulb,
  Menu,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Scene } from "./scene.jsx";
import "./styles.css";

const CREW = [
  {
    name: "Pip",
    title: "The possibility finder",
    color: "#fa603d",
    role: "Turns your ‘what if’ into ‘why not’. A little push when your next big thing is still a small scribble.",
    good: "Getting the ball rolling",
    vibe: "Curious. Endlessly optimistic.",
    word: "Let's see what happens.",
  },
  {
    name: "Loop",
    title: "The connection maker",
    color: "#a2c873",
    role: "Connects the dots you didn't know belonged together. Finds the interesting bit in the in-between.",
    good: "Looking at it another way",
    vibe: "Thoughtful. A little sideways.",
    word: "These two things should meet.",
  },
  {
    name: "Bloom",
    title: "The wild idea person",
    color: "#bdafe6",
    role: "Big feelings, bigger ideas. Brings a fresh perspective and just the right amount of beautiful chaos.",
    good: "Getting out of your own way",
    vibe: "Expressive. Delightfully extra.",
    word: "Okay, but imagine this…",
  },
  {
    name: "Scout",
    title: "The make-it-happen one",
    color: "#f6c348",
    role: "Gives your ideas legs. Breaks the big, intimidating thing into a few small, very doable steps.",
    good: "Turning someday into today",
    vibe: "Resourceful. Always ready.",
    word: "One small step. Then another.",
  },
  {
    name: "Nova",
    title: "The detail spotter",
    color: "#7db9d2",
    role: "A fresh pair of eyes with a very good eye. Finds the tiny changes that make a big difference.",
    good: "Making a good thing better",
    vibe: "Honest. Never unkind.",
    word: "What if we nudged this a little?",
  },
  {
    name: "Mochi",
    title: "The gentle nudge",
    color: "#e79ab5",
    role: "For the days when making things feels like a lot. Makes space for your ideas, and for you.",
    good: "Finding your rhythm again",
    vibe: "Soft-hearted. Quietly brave.",
    word: "You've got more time than you think.",
  },
];
const WORKS = [
  {
    type: "character",
    category: "A NEW LITTLE FRIEND",
    title: "An idea with a personality",
    description: "A playful character, made from a very small ‘what if’.",
  },
  {
    type: "poster",
    category: "SOMETHING WORTH SAYING",
    title: "A poster with a point of view",
    description: "Big type. A little attitude. A whole lot of possibility.",
  },
  {
    type: "orbit",
    category: "JUST FOLLOWING A THOUGHT",
    title: "A tiny universe of your own",
    description: "An interactive constellation for connecting the dots.",
  },
];

function Logo({ light = false }) {
  return (
    <a
      href="#top"
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="Morrow home"
    >
      <Asterisk strokeWidth={3.2} />
      <span>morrow</span>
      <sup>®</sup>
    </a>
  );
}

function Workspace({ ideas, addIdea, expanded = false }) {
  const [tab, setTab] = useState("Home");
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!input.trim()) {
      setHint("Start with a little thought. Anything goes.");
      return;
    }
    addIdea(input.trim());
    setInput("");
    setTab("Your ideas");
    setHint("A new idea, with room to grow.");
  };
  const tabs = [
    { name: "Home", icon: LayoutGrid },
    { name: "Your ideas", icon: Lightbulb },
    { name: "Your crew", icon: Users },
    { name: "Inspiration", icon: Folder },
  ];
  return (
    <div className={`workspace ${expanded ? "workspace-expanded" : ""}`}>
      <div className="window-bar">
        <div className="traffic" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>morrow / your little corner of the internet</span>
        <span className="window-dot" />
      </div>
      <div className="workspace-inner">
        <aside className="workspace-sidebar">
          <div className="workspace-wordmark">
            <Asterisk size={20} strokeWidth={3} />
            morrow
          </div>
          <div className="workspace-nav">
            {tabs.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                className={tab === name ? "active" : ""}
                onClick={() => {
                  setTab(name);
                  setHint("");
                }}
              >
                <Icon size={14} />
                <span>{name}</span>
                {name === "Your ideas" && (
                  <small>{ideas.length.toString().padStart(2, "0")}</small>
                )}
              </button>
            ))}
          </div>
          <div className="sidebar-projects">
            <span>YOUR SPACES</span>
            <button
              type="button"
              onClick={() => {
                setTab("Your ideas");
                setHint("A fresh space starts with an idea. Add yours below.");
              }}
            >
              <Plus size={13} /> A new beginning
            </button>
            <span className="project-dot">
              ● <span>The someday project</span>
            </span>
          </div>
          <button
            className="workspace-help"
            type="button"
            onClick={() =>
              setHint(
                "Explore the tabs, drag the cube, or add an idea. This playground keeps your ideas here for this visit.",
              )
            }
          >
            <CircleHelp size={14} /> A little help
          </button>
        </aside>
        <div className="workspace-canvas">
          <div className="canvas-greeting">
            <span>GOOD THINGS START SMALL</span>
            <p>
              {tab === "Home"
                ? "Hello, possibility."
                : tab === "Your ideas"
                  ? "A little room to grow."
                  : tab === "Your crew"
                    ? "Better, together."
                    : "Follow your curiosity."}
            </p>
          </div>
          {tab === "Home" && (
            <>
              <div className="cube-playground">
                <Scene variant="cube" />
                <span>your world. give it a spin.</span>
              </div>
              <div className="sticky-note">
                <span>
                  NOTE TO SELF <Asterisk size={12} />
                </span>
                <p>
                  It doesn't have to be perfect.
                  <br />
                  It just has to begin.
                </p>
                <small>you've got this. ↗</small>
              </div>
              <div className="mood-pill">
                <span /> open to anything
              </div>
              <div className="canvas-spark" aria-hidden="true">
                ✳
              </div>
            </>
          )}
          {tab === "Your ideas" && (
            <div className="idea-grid">
              {ideas.map((idea) => (
                <div className="idea-note" key={idea.id}>
                  <span>IDEA / {idea.id.toString().padStart(2, "0")}</span>
                  <p>{idea.text}</p>
                  <Asterisk size={16} />
                </div>
              ))}
            </div>
          )}
          {tab === "Your crew" && (
            <div className="mini-crew">
              {CREW.map((person) => (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => setHint(`${person.name}: “${person.word}”`)}
                >
                  <span style={{ background: person.color }}>
                    <span>••</span>
                  </span>
                  <strong>{person.name}</strong>
                  <small>{person.title}</small>
                </button>
              ))}
            </div>
          )}
          {tab === "Inspiration" && (
            <div className="inspiration">
              <Asterisk size={52} />
              <p>Take the scenic route.</p>
              <span>
                Put two unlikely things together.
                <br />
                Make something just for the fun of it.
                <br />
                Ask a question with no right answer.
              </span>
              <button
                type="button"
                onClick={() =>
                  setHint(
                    [
                      "What would your favorite song look like as a room?",
                      "Design a tiny creature that collects good ideas.",
                      "Make a poster for a feeling you can't quite name.",
                    ][Math.floor(Math.random() * 3)],
                  )
                }
              >
                Give me a starting point <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <form className="workspace-composer" onSubmit={submit}>
            <input
              aria-label="Your next idea"
              placeholder="What's on your mind? Start anywhere…"
              value={input}
              maxLength={160}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" aria-label="Add your idea">
              <ArrowUpRight size={16} />
            </button>
          </form>
          <div className="workspace-status" aria-live="polite">
            {hint}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkArt({ type, live = false }) {
  if (type === "character")
    return (
      <div className="work-art character-art">
        {live ? (
          <Scene variant="art" selected={2} />
        ) : (
          <div className="paper-bloom" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <b>••</b>
          </div>
        )}
        <span className="art-sticker">
          a good kind
          <br />
          of different.
        </span>
      </div>
    );
  if (type === "poster")
    return (
      <div className="work-art poster-art">
        <span>AN OPEN INVITATION</span>
        <strong>
          make
          <br />
          <em>believe.</em>
        </strong>
        <Asterisk size={100} strokeWidth={1.7} />
        <small>THERE'S SOMETHING IN THAT LITTLE IDEA.</small>
      </div>
    );
  return (
    <div className="work-art orbit-art">
      <div className="orbit-ring ring-one" />
      <div className="orbit-ring ring-two" />
      <div className="orbit-ring ring-three" />
      <i className="planet planet-one" />
      <i className="planet planet-two" />
      <i className="planet planet-three" />
      <span>
        everything
        <br />
        is connected.
      </span>
      <small>A SMALL UNIVERSE / 001</small>
    </div>
  );
}

export default function App() {
  const [party, setParty] = useState(false);
  const [selected, setSelected] = useState(0);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [ideas, setIdeas] = useState([
    { id: 1, text: "A tiny studio for very big dreams." },
    { id: 2, text: "What if Mondays felt more like Saturdays?" },
    { id: 3, text: "Make something that makes someone smile." },
  ]);
  const [footerWord, setFooterWord] = useState("a little possibility.");
  const dialog = useRef(null);
  const cursor = useRef(null);
  const addIdea = (text) =>
    setIdeas((current) => [
      ...current,
      { id: (current.at(-1)?.id || 0) + 1, text },
    ]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((element) => {
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (modal && !dialog.current.open) dialog.current.showModal();
    if (!modal && dialog.current.open) dialog.current.close();
    document.body.classList.toggle("modal-open", !!modal);
    return () => document.body.classList.remove("modal-open");
  }, [modal]);
  useEffect(() => {
    const element = cursor.current;
    const move = (event) => {
      element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      element.classList.add("cursor-visible");
      element.classList.toggle(
        "cursor-big",
        !!event.target.closest(
          "button, a, input, .cube-playground, .footer-creature",
        ),
      );
    };
    const hide = () => element.classList.remove("cursor-visible");
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
    };
  }, []);
  useEffect(() => {
    const closeNavigation = () => setMenu(false);
    window.addEventListener("hashchange", closeNavigation);
    return () => window.removeEventListener("hashchange", closeNavigation);
  }, []);
  const person = CREW[selected];
  return (
    <>
      <div className="custom-cursor" ref={cursor} aria-hidden="true" />
      <header className="site-header">
        <Logo />
        <nav className={menu ? "nav-open" : ""} aria-label="Main navigation">
          <a href="#playground">The playground</a>
          <a href="#crew">Meet the crew</a>
          <a href="#work">Made with Morrow</a>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setModal({ type: "workspace" })}
          >
            Try Morrow <ArrowUpRight size={16} />
          </button>
          <button
            className="mobile-menu"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <main>
        <section className={`hero ${party ? "party" : ""}`} id="top">
          <div className="hero-scene">
            <Scene party={party} />
          </div>
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> YOUR NEXT BIG THING STARTS HERE
            </p>
            <h1>
              A little weird.
              <br />
              <em>A lot of possible.</em>
            </h1>
            <p className="hero-description">
              A place for your ideas. A crew to bring them to life.
              <br />
              And a little room to see what happens.
            </p>
          </div>
          <button
            type="button"
            className="party-button"
            aria-pressed={party}
            onClick={() => setParty(!party)}
          >
            <span>{party ? "okay, that's enough." : "seriously, don't."}</span>
            <Asterisk size={28} />
          </button>
          <div className="hero-window" id="playground">
            <Workspace ideas={ideas} addIdea={addIdea} />
          </div>
          <div className="hero-foot">
            <p>
              <span /> A LITTLE PLAYGROUND FOR VERY BIG IDEAS
            </p>
            <a href="#possibilities">
              See what’s possible <ArrowDown size={16} />
            </a>
            <span className="hero-counter">SCROLL TO EXPLORE / 001</span>
          </div>
        </section>

        <section className="possibilities section-space" id="possibilities">
          <div className="section-label reveal">
            <span>01 / MAKE YOURSELF AT HOME</span>
            <Asterisk size={20} />
          </div>
          <h2 className="reveal">
            Less overthinking.
            <br />
            <em>More making.</em>
          </h2>
          <div className="features-grid">
            {[
              {
                title: "Your space.\nYour kind of chaos.",
                text: "Pin a thought. Start a project. Keep your inspiration close. This little corner is entirely yours.",
              },
              {
                title: "Good company.\nGreat possibilities.",
                text: "Meet a crew of creative personalities. Each brings a different way of seeing—and making—things.",
              },
              {
                title: "From a little ‘what if’\nto something real.",
                text: "Sketch the first thought. Play with the next one. Give unfinished ideas a place to become something.",
              },
              {
                title: "Follow the idea.\nSee where it goes.",
                text: "No perfect starting point required. Just a little curiosity and the freedom to try something different.",
              },
            ].map((feature, index) => (
              <article
                className="feature reveal"
                key={feature.title}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <span className="feature-number">
                  0{index + 1}
                  <Asterisk size={16} />
                </span>
                <h3>
                  {feature.title.split("\n").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="work-section" id="work">
          <div className="work-heading reveal">
            <div>
              <p className="eyebrow">02 / HAPPY LITTLE ACCIDENTS</p>
              <h2>
                A thought.
                <br />
                <em>Then a thing.</em>
              </h2>
            </div>
            <p>
              Sometimes all it takes is a small idea
              <br />
              and a little company. Look what happens.
            </p>
          </div>
          <div className="marquee-window">
            <div className="work-marquee">
              {[false, true].map((duplicate) => (
                <div
                  className="work-group"
                  key={String(duplicate)}
                  aria-hidden={duplicate || undefined}
                >
                  {WORKS.map((work) => (
                    <article className="work-card" key={work.title}>
                      {duplicate ? (
                        <WorkArt type={work.type} />
                      ) : (
                        <button
                          type="button"
                          className="work-art-button"
                          aria-label={`Explore ${work.title}`}
                          onClick={() => setModal({ type: "work", work })}
                        >
                          <WorkArt
                            type={work.type}
                            live={work.type === "character"}
                          />
                          <span className="work-open">
                            <ArrowUpRight size={20} />
                          </span>
                        </button>
                      )}
                      <div className="work-card-copy">
                        <span>{work.category}</span>
                        <h3>{work.title}</h3>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="work-bottom">
            <span>BUILT FROM CURIOSITY. FINISHED WITH A SMILE.</span>
            <span>
              TAKE A CLOSER LOOK <ArrowUpRight size={14} />
            </span>
          </div>
        </section>

        <section className="crew-section section-space" id="crew">
          <div className="crew-intro reveal">
            <p className="eyebrow">03 / YOUR KIND OF PEOPLE. SORT OF.</p>
            <h2>
              Little characters.
              <br />
              <em>Big energy.</em>
            </h2>
            <p>
              Every good idea deserves good company.
              <br />
              Find your people, give them a role, and
              <br className="desktop-break" /> make something you couldn't make
              alone.
            </p>
            <fieldset className="crew-selector">
              <legend className="sr-only">Choose a creative companion</legend>
              {CREW.map((member, index) => (
                <button
                  type="button"
                  key={member.name}
                  className={selected === index ? "selected" : ""}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  <span style={{ background: member.color }}>
                    <i />
                    <i />
                  </span>
                  {member.name}
                </button>
              ))}
            </fieldset>
          </div>
          <div
            className="crew-card reveal"
            style={{ "--crew-color": person.color }}
          >
            <div className="crew-card-top">
              <span>MORROW COMPANION</span>
              <span>00{selected + 1} / 006</span>
            </div>
            <div className="crew-portrait">
              <Scene variant="crew" selected={selected} />
              <span className="crew-caption">“{person.word}”</span>
            </div>
            <div className="crew-card-info" aria-live="polite">
              <div>
                <h3>
                  {person.name}
                  <Asterisk size={27} />
                </h3>
                <span className="crew-role">{person.title}</span>
              </div>
              <p>{person.role}</p>
              <div className="crew-meta">
                <div>
                  <span>GOOD FOR</span>
                  <p>{person.good}</p>
                </div>
                <div>
                  <span>THE VIBE</span>
                  <p>{person.vibe}</p>
                </div>
              </div>
            </div>
            <div className="crew-controls">
              <button
                type="button"
                aria-label="Previous companion"
                onClick={() => setSelected((selected + 5) % 6)}
              >
                <ArrowLeft size={18} />
              </button>
              <span>GOOD COMPANY, SIX WAYS.</span>
              <button
                type="button"
                aria-label="Next companion"
                onClick={() => setSelected((selected + 1) % 6)}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="footer-playground" id="hello">
          <div className="footer-top">
            <p className="eyebrow">04 / LEAVE WITH A LITTLE SOMETHING</p>
            <span>GO ON. GIVE IT A LITTLE POKE. ↙</span>
          </div>
          <div className="footer-message">
            <h2>
              You came with a thought.
              <br />
              Leave with <em>{footerWord}</em>
            </h2>
            <button
              type="button"
              className="footer-cta"
              onClick={() => setModal({ type: "workspace" })}
            >
              Make room for your next big thing <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="footer-creature">
            <Scene variant="footer" />
          </div>
          <button
            type="button"
            className="poke-button"
            onClick={() =>
              setFooterWord(
                [
                  "a happy accident.",
                  "a very good ‘what if’.",
                  "a new little beginning.",
                  "a little possibility.",
                ][Math.floor(Math.random() * 4)],
              )
            }
          >
            <span>
              something
              <br />
              good is
              <br />
              in here.
            </span>
            <Sparkles size={20} />
          </button>
          <div className="footer-bottom">
            <Logo />
            <p>MADE FOR THE MAYBES. © {new Date().getFullYear()} MORROW</p>
            <div>
              <button type="button" onClick={() => setModal({ type: "about" })}>
                About this playground
              </button>
              <a href="#top">
                Back to top <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <div
        className={`party-message ${party ? "party-message-visible" : ""}`}
        role="status"
      >
        A little more weird. <Asterisk size={16} /> You asked for it.
      </div>
      <dialog
        ref={dialog}
        className={`site-dialog ${modal?.type === "workspace" ? "workspace-dialog" : ""}`}
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
      >
        <div className="dialog-bar">
          <span>
            {modal?.type === "workspace"
              ? "YOUR CREATIVE PLAYGROUND"
              : modal?.type === "work"
                ? "A CLOSER LOOK"
                : "HELLO, CURIOUS PERSON."}
          </span>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>
        </div>
        {modal?.type === "workspace" && (
          <>
            <Workspace ideas={ideas} addIdea={addIdea} expanded />
            <p className="demo-note">
              <Check size={14} /> A working local playground. Your ideas stay in
              this page for this visit.
            </p>
          </>
        )}
        {modal?.type === "work" && (
          <div className="project-dialog">
            <WorkArt type={modal.work.type} live />
            <p className="eyebrow">{modal.work.category}</p>
            <h2>{modal.work.title}</h2>
            <p>{modal.work.description}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                addIdea(`My take on: ${modal.work.title}`);
                setModal({ type: "workspace" });
              }}
            >
              Make it a starting point <Plus size={16} />
            </button>
          </div>
        )}
        {modal?.type === "about" && (
          <div className="about-dialog">
            <Asterisk size={50} />
            <h2>
              A little weird.
              <br />
              Entirely yours to explore.
            </h2>
            <p>
              Morrow is an original interactive landing-page concept, inspired
              by playful creative tools. Its characters are real, procedural 3D
              objects, lit and animated in your browser.
            </p>
            <p>
              The workspace is a local demo. Ideas are kept in memory for your
              current visit. No account, AI provider, or form submission is
              involved.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setModal({ type: "workspace" })}
            >
              Have a little play <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
