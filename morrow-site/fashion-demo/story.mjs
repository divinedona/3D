import timeline from "./timeline.json";

export const duration = 30;
export const taps = timeline.taps;
export const steps = [
  {
    start: 0,
    view: "lock",
    title: "A fresh morning",
    caption: "Less deciding. More you.",
  },
  {
    start: 3,
    view: "chat",
    title: "Your morning edit",
    caption: "A little inspiration from Mira.",
  },
  {
    start: 7,
    view: "chat",
    title: "The Olive Edit",
    caption: "Soft layers. An easy kind of day.",
  },
  {
    start: 11,
    view: "outfit",
    title: "Every piece considered",
    caption: "A complete look, made from your closet.",
  },
  {
    start: 16.2,
    view: "closet",
    title: "Make it yours",
    caption: "Pick a piece. Find a new possibility.",
  },
  {
    start: 22.5,
    view: "outfit",
    title: "Ready when you are",
    caption: "A small choice. A good start.",
  },
  {
    start: 26,
    view: "chat",
    title: "Your day, sorted",
    caption: "Mira has tomorrow in mind, too.",
  },
  {
    start: 28.5,
    view: "outro",
    title: "Morrow Atelier",
    caption: "A little more you.",
  },
];

export function ease(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function storyAt(seconds) {
  const time = Math.max(0, Math.min(duration, seconds));
  let index = 0;
  for (let i = 0; i < steps.length; i += 1)
    if (time >= steps[i].start) index = i;
  return {
    ...steps[index],
    index,
    time,
    transition: ease((time - steps[index].start) / 0.65),
  };
}

export function cameraAt(time) {
  const points = [
    [0, 1, -4, -1.3],
    [3, 1.035, 2, 0.2],
    [8, 1.11, 3, 0.6],
    [12, 1.06, -3, -0.6],
    [18, 1.095, 2, 0.5],
    [24, 1.12, -2, -0.4],
    [28.5, 1.045, 1, 0],
    [30, 1.02, 0, 0],
  ];
  let index = 0;
  while (index < points.length - 2 && time > points[index + 1][0]) index += 1;
  const left = points[index],
    right = points[index + 1];
  const t = ease((time - left[0]) / (right[0] - left[0]));
  return {
    scale: left[1] + (right[1] - left[1]) * t,
    y: left[2] + (right[2] - left[2]) * t,
    z: left[3] + (right[3] - left[3]) * t,
  };
}

export const wardrobe = [
  { id: "jacket", name: "Sage studio jacket", category: "Tops" },
  { id: "knit", name: "Oat ribbed knit", category: "Tops" },
  { id: "trousers", name: "Ink wide-leg trousers", category: "Bottoms" },
  { id: "jeans", name: "Washed blue jeans", category: "Bottoms" },
  { id: "sneakers", name: "Cloud leather sneakers", category: "Shoes" },
  { id: "loafers", name: "Walnut everyday loafers", category: "Shoes" },
  { id: "tote", name: "Walnut daily tote", category: "Accessories" },
  { id: "sunglasses", name: "Amber-frame sunglasses", category: "Accessories" },
];
