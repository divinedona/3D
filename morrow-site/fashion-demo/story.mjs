export const duration = 30;
export const steps = [
  {
    start: 0,
    view: "lock",
    title: "A new day",
    caption: "A little less deciding.",
  },
  {
    start: 3,
    view: "chat",
    title: "Meet your stylist",
    caption: "A stylist who gets your day.",
  },
  {
    start: 8,
    view: "chat",
    title: "Your morning look",
    caption: "Your closet. A fresh perspective.",
  },
  {
    start: 13,
    view: "outfit",
    title: "The little details",
    caption: "Every piece, already considered.",
  },
  {
    start: 18,
    view: "closet",
    title: "Your own wardrobe",
    caption: "Make more of what you own.",
  },
  {
    start: 23,
    view: "outfit",
    title: "Ready to wear",
    caption: "One less thing on your mind.",
  },
  {
    start: 26,
    view: "chat",
    title: "Your day, sorted",
    caption: "Tomorrow? Already thinking ahead.",
  },
  {
    start: 28,
    view: "outro",
    title: "Morrow Studio",
    caption: "Your day. Already styled.",
  },
];

export function storyAt(seconds) {
  const time = Math.max(0, Math.min(duration, seconds));
  let index = 0;
  for (let i = 0; i < steps.length; i += 1) {
    if (time >= steps[i].start) index = i;
  }
  const step = steps[index];
  const transition = Math.min(1, Math.max(0, (time - step.start) / 0.55));
  const eased = 1 - (1 - transition) ** 3;
  return { ...step, index, time, transition: eased };
}

export const wardrobe = [
  { id: "top", name: "Leopard one-shoulder top", category: "Tops" },
  { id: "jeans", name: "Blue loose jeans", category: "Bottoms" },
  { id: "boots", name: "Brown knee-high boots", category: "Shoes" },
  { id: "skirt", name: "Low-rise studded skirt", category: "Bottoms" },
  { id: "sneakers", name: "White low-top sneakers", category: "Shoes" },
  { id: "off-shoulder", name: "Off-shoulder print top", category: "Tops" },
  { id: "bag", name: "Brown studded bag", category: "Accessories" },
  { id: "sunglasses", name: "Black sunglasses", category: "Accessories" },
];
