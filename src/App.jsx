import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Bookmark, RotateCcw, Trash2, X, Share2, Download,
  Shuffle, Settings, Clock, ShoppingCart, Repeat, Minus, Plus, Check, BookOpen, Info,
  CalendarDays, Play, Flag, ChevronRight,
  Sun, Moon, Sparkles, Flame, Droplet, Star, Users, BarChart3, Mail, Mic, Beaker, Bell, Copy, ListChecks,
  Camera, MapPin, Wind, Heart,
} from 'lucide-react';

/* Credible sources Brim's guidance leans on. Shown in-app on the Evidence screen. */
const SOURCES = [
  { name: 'Harvard T.H. Chan — The Nutrition Source', note: 'Vegetables & fruits, eye/antioxidant and carotenoid evidence', url: 'https://nutritionsource.hsph.harvard.edu/what-should-you-eat/vegetables-and-fruits/' },
  { name: 'World Health Organization — Healthy diet', note: 'Daily produce & fiber targets; limiting free sugars in juice', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' },
  { name: 'U.S. FDA — Nutrition info for raw fruits & vegetables', note: 'Per-item nutrition facts for common produce', url: 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-fruits-vegetables-and-fish' },
];

/* Theme tokens. C is mutated in place by applyTheme so every component that
   reads C.* (including ones defined outside App) re-skins on a dark-mode toggle. */
const LIGHT = {
  bg: '#F8F4FC', card: '#FFFFFF', ink: '#3F3A4A', inkSoft: '#938CA3',
  line: 'rgba(63,58,74,0.10)', herb: '#8B6FD8', panel: '#F0EAFA',
};
const DARK = {
  bg: '#1C1925', card: '#272233', ink: '#EEE9F6', inkSoft: '#ABA3BC',
  line: 'rgba(255,255,255,0.12)', herb: '#B9A0F0', panel: '#322B44',
};
const C = { ...LIGHT };
function applyTheme(dark) { Object.assign(C, dark ? DARK : LIGHT); }
/* pick black-ish or white text for legibility on a given solid color */
function readableOn(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return '#fff';
  const v = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(v(0)) + 0.7152 * lin(v(2)) + 0.0722 * lin(v(4));
  return L > 0.4 ? '#2A2535' : '#FFFFFF';
}
/* darken a (possibly pastel) color so it stays legible as text on a pale background */
function darkenForText(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return '#4A4350';
  const mix = (i, t) => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.5 + t * 0.5);
  const to2 = (n) => n.toString(16).padStart(2, '0');
  return '#' + to2(mix(0, 44)) + to2(mix(2, 36)) + to2(mix(4, 58));
}

/* ---------- amount formatting ---------- */
const REL = ['pinch', 'thumb', 'knob', 'handful', 'leaves', 'slice', 'sprig'];
function toFrac(x) {
  const whole = Math.floor(x + 1e-9);
  const rem = x - whole;
  let f = '';
  if (Math.abs(rem - 0.25) < 0.06) f = '¼';
  else if (Math.abs(rem - 0.5) < 0.06) f = '½';
  else if (Math.abs(rem - 0.75) < 0.06) f = '¾';
  if (whole === 0 && f) return f;
  if (whole > 0 && f) return whole + f;
  return String(whole || 0);
}
function plural(unit, x) {
  if (x <= 1) return unit;
  const m = { cup: 'cups', thumb: 'thumbs', knob: 'knobs', handful: 'handfuls', pinch: 'pinches', slice: 'slices', sprig: 'sprigs' };
  return m[unit] || unit;
}
function fmtAmt(amt, unit, servings) {
  if (amt == null) return '';
  if (REL.includes(unit)) {
    const n = Math.max(1, Math.round(amt * servings));
    return `${n} ${plural(unit, n)}`;
  }
  const step = unit === '' ? 0.5 : 0.25;
  let s = Math.round((amt * servings) / step) * step;
  if (s < step) s = step;
  const fr = toFrac(s);
  return unit ? `${fr} ${plural(unit, s)}` : fr;
}

/* ---------- data ---------- */
const FEELINGS = [
  {
    key: 'sleep', label: "Didn't sleep well", juiceName: 'Sleepy Girl Sip',
    blurb: 'A deep, calming purple to wind the day down.', gradient: ['#AB86A1', '#836F7D'],
    ingredients: [
      { name: 'Tart cherries', richIn: 'a natural source of melatonin', amt: 1, unit: 'cup' },
      { name: 'Banana', richIn: 'magnesium + potassium', amt: 0.5, unit: '', tags: ['banana'], subs: [{ name: 'Mango', richIn: 'sweetness + vitamin A', amt: 0.5, unit: 'cup' }] },
      { name: 'Baby spinach', richIn: 'magnesium (you won’t taste it)', amt: 1, unit: 'cup' },
      { name: 'Almond milk', richIn: 'a creamy base', amt: 1, unit: 'cup', tags: ['nut', 'milk'], subs: [{ name: 'Oat milk', richIn: 'a creamy, nut-free base', amt: 1, unit: 'cup', tags: ['milk'] }] },
    ],
    booster: { name: 'Extra tart cherries', richIn: 'more melatonin', amt: 0.5, unit: 'cup' },
    method: ['Blend milk + spinach smooth.', 'Add cherries + banana; blend.', 'Chill; top with whole cherries.'],
    snack: { name: 'Cherry-Almond Night Bowl', line: 'No blender, same calm.', items: [{ amt: 1, unit: 'cup', name: 'Tart cherries' }, { amt: 1, unit: '', name: 'Banana, sliced' }, { amt: 2, unit: 'tbsp', name: 'Almonds, chopped' }, { amt: 0.5, unit: 'cup', name: 'Plain yogurt' }], steps: ['Spoon yogurt into a bowl.', 'Top with cherries, banana, almonds.'], taste: 'A little honey if cherries are sharp; a pinch of cinnamon warms it.', look: 'Fruit on one side, almonds on the other; pale bowl for contrast.' },
    taste: 'Cherry runs tart, so add half a ripe banana for natural sweetness and blend until silky. Serve lightly chilled, not over ice.',
    look: 'Pour into a short, heavy tumbler and float two whole cherries on top. The wine color glows in clear glass under warm light.',
    quotes: ['Running on four hours of sleep and pure spite.', 'My sleep schedule ghosted me, so I made a juice.', 'Awake against my will. Hydrating anyway.', 'Sleep is a skill I have not unlocked.', 'Tired girl autumn, all year round.'],
  },
  {
    key: 'energy', label: 'Low energy, sluggish', juiceName: 'Beast Mode Beet',
    blurb: 'A bright, earthy ruby to get you moving.', gradient: ['#DC7B88', '#A76D79'],
    ingredients: [
      { name: 'Beetroot', richIn: 'nitrates, linked to blood flow', amt: 1, unit: '', tags: ['beet'], subs: [{ name: 'Pomegranate', richIn: 'antioxidants + color', amt: 0.5, unit: 'cup' }] },
      { name: 'Orange', richIn: 'vitamin C', amt: 2, unit: '' },
      { name: 'Apple', richIn: 'natural sweetness + fiber', amt: 1, unit: '' },
      { name: 'Fresh ginger', richIn: 'a warming kick', amt: 1, unit: 'thumb', tags: ['ginger'], subs: [{ name: 'Fresh turmeric', richIn: 'a warm, golden kick', amt: 1, unit: 'thumb' }] },
    ],
    booster: { name: 'Double the ginger', richIn: 'more kick', amt: 1, unit: 'thumb', tags: ['ginger'] },
    method: ['Juice beet, apple, orange, ginger.', 'Taste; add orange if earthy.', 'Over ice; orange wheel.'],
    snack: { name: 'Citrus-Beet Plate', line: 'Crunch instead of sip.', items: [{ amt: 1, unit: '', name: 'Orange, segmented' }, { amt: 1, unit: '', name: 'Apple, sliced' }, { amt: 0.5, unit: 'cup', name: 'Cooked beet, cubed' }, { amt: 1, unit: 'tbsp', name: 'Pumpkin seeds' }], steps: ['Arrange orange, apple, beet on a plate.', 'Scatter seeds; squeeze of lime.'], taste: 'A pinch of flaky salt pops the citrus; lime keeps beet bright.', look: 'Fan the apple, alternate colors; ruby beet against orange.' },
    taste: 'Go one small beet to two oranges and one apple. The citrus brightens the earthiness and ginger lifts the whole glass.',
    look: 'Strain for a clear, jewel-like juice over a few cubes. A thin orange wheel on the rim plays off the deep red.',
    quotes: ['Powered by beets and the refusal to nap.', 'Low battery, high standards.', 'Tired, but make it aesthetic.', 'Battery at 12% and declining.', 'Caffeine stopped working, so here we are.'],
  },
  {
    key: 'eyes', label: 'Tired eyes, screens', juiceName: 'Eye Candy',
    blurb: 'A glowing orange, loaded for tired eyes.', gradient: ['#F7AE79', '#D5916B'],
    ingredients: [
      { name: 'Carrot', richIn: 'beta-carotene → vitamin A', amt: 2, unit: '' },
      { name: 'Mango', richIn: 'vitamin A + sweetness', amt: 1, unit: 'cup' },
      { name: 'Orange', richIn: 'vitamin C', amt: 1, unit: '' },
      { name: 'Turmeric', richIn: 'warm and golden', amt: 1, unit: 'pinch' },
    ],
    booster: { name: 'Extra carrot', richIn: 'more beta-carotene', amt: 1, unit: '' },
    method: ['Juice carrot + orange.', 'Blend in mango, turmeric, pepper.', 'Squeeze lime; over ice.'],
    snack: { name: 'Carrot-Mango Snack', line: 'Grab-and-go for screen days.', items: [{ amt: 2, unit: '', name: 'Carrots, in sticks' }, { amt: 1, unit: 'cup', name: 'Mango, cubed' }, { amt: 2, unit: 'tbsp', name: 'Hummus' }], steps: ['Cut carrots into sticks.', 'Serve with mango + hummus to dip.'], taste: 'Lime and a pinch of chili on the mango lifts it.', look: 'Stand carrot sticks in a glass; mango in a small bowl beside.' },
    taste: 'Carrot and mango are sweet enough alone. Black pepper with the turmeric helps absorption; a squeeze of lime keeps it light.',
    look: 'All sunset orange — serve in clear glass and let it settle so it glows. A mint sprig adds a green pop.',
    quotes: ['My eyes have seen things. Mostly screens.', 'Touched grass once. This juice is the sequel.', 'Blinking is my cardio now.', 'I have a screen tan.', 'My optometrist is in my prayers.'],
  },
  {
    key: 'stress', label: 'Stressed, wired', juiceName: 'Unbothered',
    blurb: 'A cool, green pour to take the edge off.', gradient: ['#9DC397', '#789A82'],
    ingredients: [
      { name: 'Cucumber', richIn: 'hydrating + cooling', amt: 0.5, unit: '', tags: ['cucumber'], subs: [{ name: 'Honeydew', richIn: 'hydrating + sweet', amt: 1, unit: 'cup' }] },
      { name: 'Green apple', richIn: 'crisp natural sweetness', amt: 1, unit: '' },
      { name: 'Baby spinach', richIn: 'magnesium', amt: 1, unit: 'cup' },
      { name: 'Lemon', richIn: 'a bright, calming lift', amt: 0.5, unit: '' },
      { name: 'Fresh mint', richIn: 'cooling aroma', amt: 1, unit: 'handful' },
    ],
    booster: { name: 'Extra greens', richIn: 'more magnesium', amt: 1, unit: 'handful' },
    method: ['Juice cucumber, apple, spinach.', 'Add lemon + mint; stir.', 'Tall over ice; cucumber ribbon.'],
    snack: { name: 'Cool Cucumber Plate', line: 'Crisp and calming.', items: [{ amt: 1, unit: '', name: 'Cucumber, sliced' }, { amt: 1, unit: '', name: 'Green apple, sliced' }, { amt: 1, unit: 'handful', name: 'Mint leaves' }, { amt: 1, unit: 'tbsp', name: 'Lemon juice' }], steps: ['Slice cucumber + apple.', 'Toss with lemon + torn mint.'], taste: 'A tiny pinch of salt; a little honey balances the lemon.', look: 'Overlap thin slices in a ring; scatter mint on top.' },
    taste: 'Lead with cucumber and green apple so it reads crisp, not grassy. Lemon and mint keep it fresh — thin with cold water and plenty of ice.',
    look: 'Tall over ice with a long cucumber ribbon down the glass and a few mint leaves. Pale green and spa-clean.',
    quotes: ['Inner peace is one cucumber away, allegedly.', 'Calm is a personality I’m renting for the afternoon.', 'Deep breaths and questionable life choices.', 'Cortisol is my love language, apparently.', 'Romanticizing my breakdown with a green juice.'],
  },
  {
    key: 'stomach', label: 'Stomach feels off', juiceName: 'Tummy TLC',
    blurb: 'A gentle, soothing blend to calm things down.', gradient: ['#EFDBA9', '#9DAE8E'],
    ingredients: [
      { name: 'Fresh ginger', richIn: 'long used to ease nausea', amt: 1, unit: 'knob', tags: ['ginger'], subs: [{ name: 'Fresh turmeric', richIn: 'soothing and golden', amt: 1, unit: 'knob' }] },
      { name: 'Pineapple', richIn: 'bromelain, aids digestion', amt: 1, unit: 'cup' },
      { name: 'Fresh mint', richIn: 'soothing and cooling', amt: 1, unit: 'handful' },
      { name: 'Cucumber', richIn: 'light + hydrating', amt: 0.5, unit: '', tags: ['cucumber'], subs: [{ name: 'Honeydew', richIn: 'light + hydrating', amt: 1, unit: 'cup' }] },
    ],
    booster: { name: 'Extra ginger', richIn: 'more settling power', amt: 1, unit: 'knob', tags: ['ginger'] },
    method: ['Blend pineapple, cucumber, mint.', 'Grate in ginger to taste.', 'Top with sparkling water.'],
    snack: { name: 'Ginger-Pineapple Bowl', line: 'Gentle to chew.', items: [{ amt: 1, unit: 'cup', name: 'Pineapple, cubed' }, { amt: 0.5, unit: '', name: 'Cucumber, sliced' }, { amt: 1, unit: 'handful', name: 'Mint' }, { amt: 1, unit: 'pinch', name: 'Grated ginger' }], steps: ['Combine pineapple + cucumber.', 'Add mint + a little grated ginger.'], taste: 'Keep ginger light; a squeeze of lime sharpens it gently.', look: 'Serve cold in a clear bowl; mint sprig on top.' },
    taste: 'Pineapple balances the ginger’s heat — start with a small knob and add more to taste. Top with water to keep it light.',
    look: 'Lightly chilled in clear glass with a mint sprig and a thin cucumber wheel. Keep it pale — it should read “gentle.”',
    quotes: ['We don’t discuss what I ate. We drink the ginger.', 'My stomach and I are in a disagreement.', 'Ginger: the apology my gut deserves.', 'My gut filed a complaint.', 'Eating like a raccoon has consequences.'],
  },
  {
    key: 'workout', label: 'Post-workout', juiceName: 'Gains o’Clock',
    blurb: 'A creamy berry blend with a protein backbone.', gradient: ['#F0A9B8', '#C88797'],
    ingredients: [
      { name: 'Banana', richIn: 'potassium to replace sweat', amt: 1, unit: '', tags: ['banana'], subs: [{ name: 'Mango', richIn: 'potassium + sweetness', amt: 1, unit: 'cup' }] },
      { name: 'Mixed berries', richIn: 'antioxidants + refuel sugar', amt: 1, unit: 'cup' },
      { name: 'Greek yogurt', richIn: 'a protein-rich base', amt: 0.5, unit: 'cup', tags: ['dairy'], subs: [{ name: 'Coconut yogurt', richIn: 'a plant-based creamy base', amt: 0.5, unit: 'cup' }] },
      { name: 'Coconut water', richIn: 'natural electrolytes', amt: 1, unit: 'cup' },
    ],
    booster: { name: 'Nut or seed butter', richIn: 'staying power', amt: 1, unit: 'tbsp' },
    method: ['Add coconut water + yogurt.', 'Add banana + berries; blend.', 'Top with berries + chia.'],
    snack: { name: 'Berry Recovery Bowl', line: 'Spoon it, don’t sip it.', items: [{ amt: 0.5, unit: 'cup', name: 'Greek yogurt' }, { amt: 1, unit: 'cup', name: 'Mixed berries' }, { amt: 1, unit: '', name: 'Banana, sliced' }, { amt: 2, unit: 'tbsp', name: 'Granola' }], steps: ['Spoon yogurt into a bowl.', 'Top with berries, banana, granola.'], taste: 'A drizzle of honey + nut butter adds protein and richness.', look: 'Rows of each fruit; granola in one corner, parfait-style.' },
    taste: 'Banana, berries and yogurt make this sweet and creamy. Too thick? Loosen with coconut water; a spoon of nut butter adds staying power.',
    look: 'It’s a smoothie — serve thick in a wide glass. Top with whole berries and a dusting of granola or chia.',
    quotes: ['Did one workout. Basically an athlete now.', 'Sore in places I didn’t know I owned.', 'Earned this. Probably.', 'Legs? Never heard of them.', 'Protein and delusion.'],
  },
  {
    key: 'cold', label: 'Catching a cold', juiceName: 'Sick Day Slay',
    blurb: 'A punchy citrus shot to circle the wagons.', gradient: ['#FAD06E', '#E5997C'],
    ingredients: [
      { name: 'Orange', richIn: 'vitamin C', amt: 1, unit: '' },
      { name: 'Lemon', richIn: 'vitamin C', amt: 0.5, unit: '' },
      { name: 'Fresh ginger', richIn: 'warming and soothing', amt: 1, unit: 'thumb', tags: ['ginger'], subs: [{ name: 'Fresh turmeric', richIn: 'warming and golden', amt: 1, unit: 'thumb' }] },
      { name: 'Pineapple', richIn: 'vitamin C, soothes the throat', amt: 0.5, unit: 'cup' },
    ],
    booster: { name: 'Pinch of cayenne', richIn: 'extra heat', amt: 1, unit: 'pinch' },
    method: ['Juice orange, lemon, pineapple, ginger.', 'Stir; honey if sharp.', 'Serve as a small glass.'],
    snack: { name: 'Citrus-Ginger Bites', line: 'Whole-fruit version.', items: [{ amt: 1, unit: '', name: 'Orange, segmented' }, { amt: 0.5, unit: 'cup', name: 'Pineapple, cubed' }, { amt: 1, unit: 'pinch', name: 'Grated ginger' }], steps: ['Segment orange; cube pineapple.', 'Toss with a little grated ginger.'], taste: 'A drizzle of honey rounds the ginger heat.', look: 'Small tight bowl; a twist of lemon peel on top.' },
    taste: 'Citrus and pineapple carry the sweetness; ginger brings the heat. Keep it small and concentrated — a touch of honey rounds it out.',
    look: 'A short glass or shot — the deep gold reads potent. A thin lemon slice on the rim signals citrus before the first sip.',
    quotes: ['Fighting this cold with citrus and false confidence.', 'Sniffling like it’s a competitive sport.', 'Vitamin C and vibes only.', 'Patient zero of my own apartment.', 'Tea, tissues, and theatrics.'],
  },
  {
    key: 'skin', label: 'Skin feels dull', juiceName: 'Glow-Up Juice',
    blurb: 'A hydrating pink pour for a fresh face.', gradient: ['#F69EB6', '#CA7694'],
    ingredients: [
      { name: 'Watermelon', richIn: 'hydrating + lycopene', amt: 2, unit: 'cup' },
      { name: 'Strawberries', richIn: 'vitamin C, supports collagen', amt: 1, unit: 'cup' },
      { name: 'Cucumber', richIn: 'hydrating + cooling', amt: 0.5, unit: '', tags: ['cucumber'], subs: [{ name: 'Honeydew', richIn: 'hydrating + sweet', amt: 1, unit: 'cup' }] },
      { name: 'Lemon', richIn: 'a bright vitamin C lift', amt: 0.5, unit: '' },
    ],
    booster: { name: 'Extra strawberries', richIn: 'more vitamin C', amt: 0.5, unit: 'cup' },
    method: ['Blend watermelon, strawberry, cucumber.', 'Squeeze lemon; strain if thin.', 'Very cold; strawberry on top.'],
    snack: { name: 'Watermelon Glow Plate', line: 'Hydration you can chew.', items: [{ amt: 2, unit: 'cup', name: 'Watermelon, cubed' }, { amt: 1, unit: 'cup', name: 'Strawberries' }, { amt: 0.5, unit: '', name: 'Cucumber, sliced' }, { amt: 1, unit: 'tbsp', name: 'Lime juice' }], steps: ['Cube watermelon; slice strawberries + cucumber.', 'Squeeze over lime; chill.'], taste: 'A little mint and lime; a tiny pinch of salt sweetens the melon.', look: 'Big pink cubes with a green cucumber edge; mint for contrast.' },
    taste: 'Watermelon and strawberry are sweet and refreshing alone — just a squeeze of lemon to sharpen. Serve very cold.',
    look: 'Lovely over clear ice — the pink is the point. Garnish with a strawberry on the rim and a thin cucumber ribbon.',
    quotes: ['Manifesting a glow I have not earned.', 'Hydrating from the inside, since the outside gave up.', 'Main character skin, loading…', 'Glazing myself like a doughnut, internally.', 'Dewy is a lifestyle, not a filter.'],
  },
  {
    key: 'focus', label: 'Brain fog', juiceName: 'Big Brain Blend',
    blurb: 'A deep blue-violet blend to help you lock in.', gradient: ['#9BA4D7', '#7C7EA1'],
    ingredients: [
      { name: 'Blueberries', richIn: 'antioxidants, brain health', amt: 1, unit: 'cup' },
      { name: 'Beetroot', richIn: 'nitrates, support blood flow', amt: 0.5, unit: '', tags: ['beet'], subs: [{ name: 'Pomegranate', richIn: 'antioxidants + color', amt: 0.5, unit: 'cup' }] },
      { name: 'Banana', richIn: 'steady natural energy', amt: 0.5, unit: '', tags: ['banana'], subs: [{ name: 'Mango', richIn: 'steady natural energy', amt: 0.5, unit: 'cup' }] },
      { name: 'Baby spinach', richIn: 'folate', amt: 1, unit: 'cup' },
    ],
    booster: { name: 'Extra blueberries', richIn: 'more antioxidants', amt: 0.5, unit: 'cup' },
    method: ['Blend spinach + cold water/tea.', 'Add blueberries, beet, banana; blend.', 'Drop in whole blueberries.'],
    snack: { name: 'Blueberry Focus Bowl', line: 'No blender needed.', items: [{ amt: 1, unit: 'cup', name: 'Blueberries' }, { amt: 0.5, unit: '', name: 'Banana, sliced' }, { amt: 0.5, unit: 'cup', name: 'Plain yogurt' }, { amt: 1, unit: 'tbsp', name: 'Walnuts' }], steps: ['Spoon yogurt into a bowl.', 'Top with blueberries, banana, walnuts.'], taste: 'A drizzle of honey; walnuts add a brain-friendly crunch.', look: 'Cluster blueberries, fan banana, walnuts in the middle.' },
    taste: 'Blueberry and banana keep it sweet and smooth; a little beet deepens it. Blend with cold water or green tea for a gentle lift.',
    look: 'The deep blue-violet is striking in clear glass. Drop a few whole blueberries in and keep the surface smooth.',
    quotes: ['Brain buffering. Please hold.', 'Two brain cells, both blueberry-powered.', 'I came, I saw, I forgot why.', 'My attention span left on read.', 'Thirteen tabs open, none of them me.'],
  },
  {
    key: 'pomheart', label: 'Heart health, vitality', juiceName: 'Heartthrob',
    blurb: 'A jewel-red antioxidant pour with three times the power of green tea.', gradient: ['#AF6363', '#D17686'],
    ingredients: [
      { name: 'Pomegranate arils', richIn: 'polyphenols, ellagic acid (antioxidant powerhouse)', amt: 1, unit: 'cup' },
      { name: 'Tart cherry', richIn: 'anthocyanins, supports heart rhythm', amt: 0.5, unit: 'cup' },
      { name: 'Apple', richIn: 'fiber, vitamin C', amt: 1, unit: '' },
      { name: 'Lemon', richIn: 'bright lift', amt: 0.5, unit: '' },
    ],
    booster: { name: 'Extra pomegranate arils', richIn: 'more antioxidants', amt: 0.5, unit: 'cup' },
    method: ['Juice pomegranate, apple, cherry.', 'Squeeze lemon; stir cold.', 'Pour over ice; pomegranate seeds float.'],
    snack: { name: 'Ruby Pomegranate Bowl', line: 'Crunchy antioxidants.', items: [{ amt: 1, unit: 'cup', name: 'Pomegranate arils' }, { amt: 1, unit: '', name: 'Apple, sliced' }, { amt: 0.5, unit: 'cup', name: 'Tart cherries' }, { amt: 2, unit: 'tbsp', name: 'Walnuts' }], steps: ['Combine pomegranate, apple, cherries.', 'Top with walnuts.'], taste: 'A tiny bit of honey; lemon zest brings out the tartness.', look: 'Seeds catch light; deep reds against pale apple.' },
    taste: '[Harvard] Pomegranate juice contains three times the antioxidant activity of red wine. One tart cherry for richness; let the tartness shine.',
    look: 'Deep crimson in clear glass; pomegranate seeds suspended like tiny rubies. A thin apple slice on the rim.',
    quotes: ['Drinking my way to a longer life, one antioxidant at a time.', 'Pomegranate season is the only season that matters.', 'Feeling heart health-coded.', 'Antioxidants over everything.', 'My cardiologist would approve of this aesthetic.'],
  },
  {
    key: 'cherryrecov', label: 'Post-workout, recovery', juiceName: 'Cherry on Top',
    blurb: 'A tart, earthy pour to ease soreness and replenish minerals.', gradient: ['#BF9581', '#B38D71'],
    ingredients: [
      { name: 'Tart cherry juice', richIn: 'anthocyanins, reduce inflammation & DOMS', amt: 1, unit: 'cup' },
      { name: 'Orange', richIn: 'vitamin C, coconut water aids absorption', amt: 1, unit: '' },
      { name: 'Turmeric', richIn: 'curcumin, natural inflammation fighter', amt: 1, unit: 'pinch' },
      { name: 'Coconut water', richIn: 'electrolytes, potassium', amt: 1, unit: 'cup' },
    ],
    booster: { name: 'Hemp seeds', richIn: 'plant protein, omega-3s', amt: 1, unit: 'tbsp' },
    method: ['Mix cherry juice, coconut water, orange juice.', 'Stir in turmeric + black pepper.', 'Chill over ice; hemp seeds on top.'],
    snack: { name: 'Cherry-Turmeric Smoothie', line: 'Sip for muscle recovery.', items: [{ amt: 1, unit: 'cup', name: 'Tart cherries (frozen)' }, { amt: 0.5, unit: '', name: 'Orange' }, { amt: 1, unit: 'cup', name: 'Greek yogurt' }, { amt: 1, unit: 'pinch', name: 'Turmeric' }], steps: ['Blend cherries + orange with yogurt.', 'Dust with turmeric.'], taste: 'Black pepper + turmeric blend; a touch of honey softens the tart.', look: 'Deep burgundy with golden turmeric swirl.' },
    taste: '[Harvard] Tart cherry reduces delayed-onset muscle soreness (DOMS) by reducing inflammation. Turmeric amplifies this; black pepper aids absorption.',
    look: 'Warm burgundy with a golden swirl from turmeric. Serve in a wider glass to let it settle.',
    quotes: ['My muscles are yelling, so I made this.', 'Sore but make it wellness.', 'Inflammation who? She doesn\'t know me.', 'Post-gym pour to avoid a painful Monday.', 'Cherry juice: the only thing standing between me and regret.'],
  },
  {
    key: 'tarttropic', label: 'Tart tropical bliss', juiceName: 'Tropic Like It’s Hot',
    blurb: 'Bold, zesty tropical fruits — tart, tangy, alive.', gradient: ['#E1C8AD', '#F4D3A3'],
    ingredients: [
      { name: 'Passion fruit', richIn: 'fiber, vitamin C, mood-supporting compounds', amt: 0.5, unit: 'cup' },
      { name: 'Dragon fruit', richIn: 'prebiotic fiber, antioxidants, gut health', amt: 1, unit: 'cup' },
      { name: 'Tamarind paste', richIn: 'tart, tropical tartness', amt: 1, unit: 'tbsp' },
      { name: 'Mango', richIn: 'natural sweetness, vitamin A', amt: 0.5, unit: 'cup' },
      { name: 'Lime', richIn: 'brightness', amt: 0.5, unit: '' },
    ],
    booster: { name: 'Extra passion fruit', richIn: 'more tangy tropical pop', amt: 0.25, unit: 'cup' },
    method: ['Blend dragon fruit, mango, passion fruit pulp.', 'Whisk in tamarind paste.', 'Lime juice + cold water to taste; ice.'],
    snack: { name: 'Tropical Tart Bowl', line: 'Eat the tropics.', items: [{ amt: 1, unit: 'cup', name: 'Dragon fruit, cubed' }, { amt: 0.5, unit: 'cup', name: 'Mango, cubed' }, { amt: 0.25, unit: 'cup', name: 'Passion fruit pulp' }, { amt: 1, unit: 'tbsp', name: 'Lime juice' }], steps: ['Combine all fruits.', 'Squeeze lime; toss gently.'], taste: 'Tamarind is tart — let it balance with mango sweetness. Serve very cold.', look: 'Pale pink + golden yellow with passion fruit black seeds visible.' },
    taste: 'Passion fruit brings mood-boosting compounds; dragon fruit adds prebiotic fiber for your gut. Tamarind is the star here — a little goes a long way.',
    look: 'A gradient of pink to gold with black seeds suspended. Serve in a chilled glass; passion fruit seeds float like tiny jewels.',
    quotes: ['Tart tropical energy personified.', 'Tastes like a vacation I can afford.', 'Passion fruit hitting different today.', 'My mouth is having a moment.', 'Zesty, alive, and calling me back to the islands.'],
  },
  {
    key: 'dragonglow', label: 'Skin glow, radiance', juiceName: 'Dragon Glow-Up',
    blurb: 'A vibrant pink pour loaded with skin-brightening compounds.', gradient: ['#F7A5CE', '#F272B7'],
    ingredients: [
      { name: 'Dragon fruit', richIn: 'vitamin C, antioxidants, fiber for gut-skin axis', amt: 1, unit: 'cup' },
      { name: 'Pomegranate', richIn: 'polyphenols, supports collagen', amt: 0.5, unit: 'cup' },
      { name: 'Raspberry', richIn: 'ellagic acid, skin health', amt: 0.5, unit: 'cup' },
      { name: 'Coconut milk', richIn: 'creamy, hydrating', amt: 0.5, unit: 'cup' },
    ],
    booster: { name: 'Extra dragon fruit', richIn: 'more vitamin C + fiber', amt: 0.5, unit: 'cup' },
    method: ['Blend dragon fruit, berries, coconut milk.', 'Strain if preferred (or keep seeds).', 'Very cold; rose petal on top (optional).'],
    snack: { name: 'Glow Bowl', line: 'Beauty foods, spoon-by-spoon.', items: [{ amt: 1, unit: 'cup', name: 'Dragon fruit, cubed' }, { amt: 0.5, unit: 'cup', name: 'Pomegranate arils' }, { amt: 0.5, unit: 'cup', name: 'Raspberries' }, { amt: 0.5, unit: 'cup', name: 'Greek yogurt' }], steps: ['Layer dragon fruit + berries in yogurt.'], taste: 'Dragon fruit is subtle, so berries shine. A squeeze of lime brightens.', look: 'Hot pink gradient with seeds and berries scattered.' },
    taste: '[Harvard] Dragon fruit is rich in vitamin C for collagen synthesis and inflammation-fighting antioxidants. Pomegranate adds deep polyphenols.',
    look: 'Vivid fuchsia with black seeds visible throughout. Serve in a clear glass and watch it glow under light.',
    quotes: ['Drinking my way to good skin one dragon fruit at a time.', 'Main character glow, unlocked.', 'Skin glowing, confidence flowing.', 'This is what radiance tastes like.', 'Beauty from the inside out, literally.'],
  },
  {
    key: 'adaptzen', label: 'Adaptogen calm', juiceName: 'Cortisol, Cancelled',
    blurb: 'Herbal adaptogens to soothe stress and support resilience.', gradient: ['#E1D1BB', '#C2B2A6'],
    ingredients: [
      { name: 'Ashwagandha powder', richIn: 'regulates cortisol, supports calm alertness', amt: 1, unit: 'tsp' },
      { name: 'Reishi mushroom powder', richIn: 'activation of rest-and-digest nervous system', amt: 0.5, unit: 'tsp' },
      { name: 'Apple', richIn: 'natural sweetness', amt: 1, unit: '' },
      { name: 'Oat milk', richIn: 'grounding, creamy base', amt: 1, unit: 'cup' },
      { name: 'Vanilla', richIn: 'warm comfort', amt: 0.5, unit: 'tsp' },
    ],
    booster: { name: 'L-Theanine powder', richIn: 'calm focus without drowsiness', amt: 1, unit: 'tsp' },
    method: ['Blend apple + oat milk smooth.', 'Whisk in ashwagandha, reishi, vanilla.', 'Chill; sprinkle extra adaptogen on top.'],
    snack: { name: 'Adaptogen Apple Snack', line: 'Stress relief you can chew.', items: [{ amt: 1, unit: '', name: 'Apple, sliced' }, { amt: 2, unit: 'tbsp', name: 'Almond butter' }, { amt: 1, unit: 'pinch', name: 'Ashwagandha powder' }], steps: ['Slice apple.', 'Dip in almond butter mixed with ashwagandha.'], taste: 'Ashwagandha can be earthy — vanilla and apple mask it gently. Serve cool.', look: 'Warm tan with a sprinkle of golden powder on top.' },
    taste: 'Ashwagandha takes 2–4 weeks to show full benefits; reishi supports sleep and calm. Not sedating, but balancing.',
    look: 'A soft, creamy tan. Serve in a warm mug or chilled glass depending on your mood.',
    quotes: ['Cortisol? I don\'t know her.', 'Stress management in a glass.', 'Feeling balanced and adaptable today.', 'My nervous system is so grateful.', 'Resilience tastes like vanilla and apples.'],
  },
  {
    key: 'guthealth', label: 'Gut harmony, prebiotics', juiceName: 'Gut Feeling',
    blurb: 'Dragon fruit fiber feeds good bacteria; ginger soothes.', gradient: ['#81CAA0', '#79B191'],
    ingredients: [
      { name: 'Dragon fruit', richIn: 'insoluble + soluble fiber, prebiotic compounds', amt: 1, unit: 'cup' },
      { name: 'Apple', richIn: 'pectin, feeds good bacteria', amt: 1, unit: '' },
      { name: 'Fresh ginger', richIn: 'soothing, aids motility', amt: 1, unit: 'knob' },
      { name: 'Aloe vera gel', richIn: 'soothes intestinal lining', amt: 2, unit: 'tbsp' },
      { name: 'Coconut water', richIn: 'hydration, electrolytes', amt: 1, unit: 'cup' },
    ],
    booster: { name: 'Fennel seeds (steeped)', richIn: 'carminative, eases bloating', amt: 1, unit: 'tsp' },
    method: ['Blend dragon fruit, apple, ginger, aloe.', 'Mix in chilled coconut water.', 'Strain fennel; stir in gently. Serve immediately.'],
    snack: { name: 'Gut-Happy Bowl', line: 'Prebiotic whole foods.', items: [{ amt: 1, unit: 'cup', name: 'Dragon fruit, cubed' }, { amt: 1, unit: '', name: 'Apple, sliced' }, { amt: 1, unit: 'tbsp', name: 'Raw almonds' }, { amt: 1, unit: 'pinch', name: 'Ginger' }], steps: ['Combine all.', 'Squeeze of lemon brightens.'], taste: 'Ginger can be sharp — let apple balance. Aloe is mild; chill well.', look: 'Pale green-pink with visible seeds.' },
    taste: 'Dragon fruit\'s fiber feeds Bifidobacterium; ginger aids digestion. Drink fresh — aloe gel oxidizes quickly.',
    look: 'A soft pale green with dragon fruit seeds visible. Serve immediately in a clear glass over ice.',
    quotes: ['Feeding my gut bacteria one dragon fruit at a time.', 'Gut health is wealth.', 'Digestion? More like digestion!', 'My microbiome is thriving.', 'Prebiotics, probiotics, and peace of mind.'],
  },
  {
    key: 'sleeprest', label: 'Deep rest, melatonin', juiceName: 'Goodnight Era',
    blurb: 'Tart cherry melatonin + lavender for a gentle descent into sleep.', gradient: ['#9990B2', '#867C97'],
    ingredients: [
      { name: 'Tart cherry juice', richIn: 'natural melatonin, improves sleep onset', amt: 1, unit: 'cup' },
      { name: 'Lavender', richIn: 'activates parasympathetic nervous system', amt: 1, unit: 'tbsp', tags: ['dried'] },
      { name: 'Chamomile', richIn: 'mild sedative compounds (apigenin)', amt: 1, unit: 'tbsp', tags: ['dried'] },
      { name: 'Honey', richIn: 'tryptophan precursor for melatonin synthesis', amt: 1, unit: 'tbsp' },
      { name: 'Almond milk', richIn: 'tryptophan, magnesium', amt: 0.5, unit: 'cup' },
    ],
    booster: { name: 'Passionflower (dried)', richIn: 'GABA-like relaxation', amt: 1, unit: 'tsp' },
    method: ['Steep lavender + chamomile in hot water 5 min.', 'Add tart cherry juice, honey, almond milk.', 'Let cool; serve warm 1 hour before bed.'],
    snack: { name: 'Sleep Snack', line: 'Cozy, wind-down ritual.', items: [{ amt: 1, unit: 'cup', name: 'Warm almond milk' }, { amt: 2, unit: 'tbsp', name: 'Raw almonds' }, { amt: 1, unit: 'tbsp', name: 'Raw honey' }, { amt: 1, unit: 'pinch', name: 'Cinnamon' }], steps: ['Warm milk gently.', 'Stir in honey; top with almonds + cinnamon.'], taste: 'Lavender is floral — honey balances. Serve warm, not hot.', look: 'Soft purple-pink, steaming, aromatic.' },
    taste: '[WHO] Tart cherry juice contains 0.135–0.269 mg/mL of melatonin. Lavender + chamomile extend the calming effect without creating dependence.',
    look: 'A deep lavender-rose color, steaming gently. Serve in a warm mug 1 hour before bed.',
    quotes: ['Sleep, the one thing I need to earn again.', 'Tart cherry for those 3 AM intrusive thoughts.', 'My sleep schedule thanks me.', 'Sip, settle, sleep.', 'Goodnight moon, goodnight tart cherry juice.'],
  },
  {
    key: 'braincognit', label: 'Cognitive boost', juiceName: 'Galaxy Brain',
    blurb: 'Rhodiola, blueberry, and mint for sharp focus and sustained mental energy.', gradient: ['#7D8791', '#828E99'],
    ingredients: [
      { name: 'Blueberry', richIn: 'anthocyanins support memory and learning', amt: 1, unit: 'cup' },
      { name: 'Green tea', richIn: 'L-theanine + EGCG, calm focused alertness', amt: 1, unit: 'cup', tags: ['brewed'] },
      { name: 'Beet', richIn: 'nitrates improve cerebral blood flow', amt: 0.5, unit: '' },
      { name: 'Fresh basil', richIn: 'rosmarinic acid, neuroprotective', amt: 1, unit: 'handful' },
      { name: 'Lemon', richIn: 'brightness', amt: 0.5, unit: '' },
    ],
    booster: { name: 'Rhodiola extract', richIn: 'adapts brain to stress, boosts dopamine', amt: 1, unit: 'tsp' },
    method: ['Brew green tea, cool.', 'Blend blueberries, beet, basil with cooled tea.', 'Squeeze lemon; strain if preferred. Ice.'],
    snack: { name: 'Brain Bowl', line: 'Cognitive snacking.', items: [{ amt: 1, unit: 'cup', name: 'Blueberries' }, { amt: 0.5, unit: '', name: 'Beet, roasted + cubed' }, { amt: 1, unit: 'handful', name: 'Fresh basil' }, { amt: 1, unit: 'tbsp', name: 'Walnuts' }], steps: ['Toss berries, beet, basil.', 'Top with walnuts.'], taste: 'Basil is unexpected — use sparingly. Lemon bridges the flavors.', look: 'Deep blue-purple with beet reds and green basil flecks.' },
    taste: '[Harvard] Blueberry anthocyanins cross the blood-brain barrier; beet nitrates increase oxygen delivery to the prefrontal cortex.',
    look: 'A striking deep blue-violet with dark red flecks from beet. Serve over ice in a tall glass.',
    quotes: ['Brain go brrr.', 'Blueberry cognition unlocked.', 'Thinking clearly for the first time in weeks.', 'My focus is LOCKED IN.', 'This is what mental clarity tastes like.'],
  },
  {
    key: 'immunity', label: 'Deep immunity boost', juiceName: 'Immune Flex',
    blurb: 'Spirulina, bee pollen, and citrus for all-day immune support.', gradient: ['#E7928A', '#C3827B'],
    ingredients: [
      { name: 'Orange', richIn: 'vitamin C, natural sweetness', amt: 2, unit: '' },
      { name: 'Strawberry', richIn: 'ellagic acid, immune activation', amt: 1, unit: 'cup' },
      { name: 'Spirulina powder', richIn: 'phycocyanin, polysaccharides boost immune cells', amt: 1, unit: 'tsp' },
      { name: 'Bee pollen', richIn: 'amino acids, nutrient-dense superfood', amt: 1, unit: 'tbsp' },
      { name: 'Lemon', richIn: 'vitamin C, absorption aid', amt: 0.5, unit: '' },
    ],
    booster: { name: 'Extra bee pollen', richIn: 'more nutrient density', amt: 1, unit: 'tbsp' },
    method: ['Blend orange, strawberries, spirulina.', 'Mix in cold water; lemon juice.', 'Stir in bee pollen at the end (preserves enzymes).'],
    snack: { name: 'Immunity Power Snack', line: 'Defense foods.', items: [{ amt: 2, unit: '', name: 'Orange segments' }, { amt: 1, unit: 'cup', name: 'Strawberries' }, { amt: 1, unit: 'tbsp', name: 'Bee pollen' }, { amt: 1, unit: 'tbsp', name: 'Raw almonds' }], steps: ['Combine all.', 'Eat slowly; let flavors build.'], taste: 'Bee pollen can be grainy — blend well or add last. Spirulina is strong; citrus masks it.', look: 'Bright orange with red berries and golden pollen specks.' },
    taste: 'Bee pollen is a complete protein with amino acids; spirulina is ~70% protein. This is serious immune support.',
    look: 'A vibrant orange-red with golden spirulina shimmer and bee pollen flecks floating on top.',
    quotes: ['Immune system: activated.', 'Spirulina and bee pollen, my new personality.', 'Feeling protected and nourished.', 'My white blood cells are partying.', 'Nutrient density in a glass.'],
  },
];
const byKey = (k) => FEELINGS.find((f) => f.key === k);

/* Multi-day "feel-good resets" — NOT cleanses. Each day = one drink + one easy add-a-good-thing
   habit. You keep eating normal meals. Drinks reuse the recipe engine so they respect your filters. */
const RESETS = [
  {
    id: 'bright3', name: '3-Day Bright Start', length: 3,
    blurb: 'Three gentle days of vivid, feel-good drinks. Not a cleanse — keep eating real meals.',
    days: [
      { feel: 'energy', habit: 'Have a glass of water before your first coffee.' },
      { feel: 'eyes', habit: 'Look out a window for 20 seconds each hour of screen time.' },
      { feel: 'skin', habit: 'Add one extra handful of vegetables to a meal today.' },
    ],
  },
  {
    id: 'steady5', name: '5-Day Steady', length: 5,
    blurb: 'Five easy days to feel a little more even. Add the drink, keep your normal food.',
    days: [
      { feel: 'stress', habit: 'Three slow breaths before you start the day.' },
      { feel: 'sleep', habit: 'Screens off 30 minutes before bed.' },
      { feel: 'focus', habit: 'Pick one task to finish before lunch.' },
      { feel: 'stomach', habit: 'Eat one meal slowly, away from a screen.' },
      { feel: 'energy', habit: 'Take a 10-minute walk outside.' },
    ],
  },
  {
    id: 'weekend', name: 'Weekend Glow', length: 2,
    blurb: 'Two bright days to reset and feel fresh before the week.',
    days: [
      { feel: 'skin', habit: 'Drink an extra glass of water with each meal.' },
      { feel: 'workout', habit: 'A little movement you enjoy — a walk or a stretch.' },
    ],
  },
];
const byReset = (id) => RESETS.find((r) => r.id === id);

/* Free-text matching: what typed words point to each feeling. */
const KEYWORDS = {
  sleep: ['tired', 'sleep', 'exhausted', 'insomnia', 'restless', 'awake', 'drained', 'sleepy', 'fatigued', 'no sleep', 'up all night'],
  energy: ['low energy', 'sluggish', 'lethargic', 'no energy', 'flat', 'groggy', 'unmotivated', 'heavy', 'slow', 'meh', 'lazy'],
  eyes: ['eyes', 'screen', 'eye strain', 'blurry', 'computer', 'staring', 'dry eyes', 'monitor', 'phone'],
  stress: ['stressed', 'anxious', 'wired', 'tense', 'overwhelmed', 'nervous', 'panic', 'frazzled', 'on edge', 'burnt out', 'burnout'],
  stomach: ['stomach', 'nausea', 'bloated', 'gut', 'digestion', 'queasy', 'sick', 'indigestion', 'tummy', 'ache', 'cramp'],
  workout: ['workout', 'gym', 'exercise', 'run', 'sore', 'training', 'lifted', 'muscles', 'recovery', 'post workout', 'cardio'],
  cold: ['cold', 'flu', 'sniffle', 'sore throat', 'congested', 'runny nose', 'immune', 'sneezing', 'fever', 'sick', 'unwell'],
  skin: ['skin', 'dull', 'dry skin', 'breakout', 'complexion', 'glow', 'acne', 'blotchy', 'tired skin', 'spots'],
  focus: ['focus', 'foggy', 'brain fog', 'distracted', 'concentrate', 'scattered', 'unfocused', 'cant think', 'hazy', 'forgetful', 'zoned out'],
};

/* One-line "why this helps" used in the analyzed recommendation. */
const REASONS = {
  sleep: 'its tart cherry and magnesium lean toward winding down',
  energy: 'its beets and citrus are about a natural lift, not a caffeine spike',
  eyes: 'its carrot and mango are rich in vitamin A, which is tied to eye health',
  stress: 'its cucumber and leafy greens are cooling and magnesium-rich',
  stomach: 'its ginger and pineapple are gentle on digestion',
  workout: 'it replaces electrolytes and adds protein to help you recover',
  cold: "it's loaded with vitamin C and soothing ginger",
  skin: "it's hydrating, with collagen-supporting vitamin C",
  focus: 'its blueberries and beets support blood flow and steady energy',
};
/* ---------- AI multi-day plan ---------- */
const PURPOSE_CHIPS = ['Better sleep', 'More energy', 'Glowing skin', 'Less stress', 'Post-workout recovery', 'Immunity boost', 'Gut reset', 'Sharper focus'];
/* maps a free-text purpose to the most fitting drink keys (first = strongest) */
const PURPOSE_HINTS = [
  { re: /sleep|rest|insomnia|wind ?down|night/, keys: ['sleep', 'sleeprest', 'stress'] },
  { re: /energy|tired|sluggish|fatigue|wake|awake|boost/, keys: ['energy', 'focus', 'workout'] },
  { re: /skin|glow|complexion|acne|radian|beauty/, keys: ['skin', 'dragonglow'] },
  { re: /stress|anxi|calm|relax|cortisol|overwhelm|burnout/, keys: ['stress', 'adaptzen', 'sleep'] },
  { re: /workout|gym|muscle|recover|sore|train|run|lift|fitness/, keys: ['workout', 'cherryrecov'] },
  { re: /immun|sick|cold|flu|defense|defence|virus/, keys: ['cold', 'immunity'] },
  { re: /gut|digest|bloat|stomach|microbiome|tummy/, keys: ['stomach', 'guthealth'] },
  { re: /focus|brain|concentrat|memory|study|productiv|clarity/, keys: ['focus', 'braincognit'] },
  { re: /heart|cardio|vitality|blood/, keys: ['pomheart', 'energy'] },
  { re: /detox|cleanse|reset|fresh start|clean/, keys: ['stomach', 'guthealth', 'skin'] },
];

/* Evidence base — paraphrased strictly from Brim's provided sources:
   Harvard T.H. Chan "The Nutrition Source: Vegetables and Fruits", the WHO
   "Healthy diet" fact sheet, and the FDA "Nutrition Information for Raw Fruits
   & Vegetables". Plan reasoning is grounded ONLY in these. No invented claims. */
const PLAN_EVIDENCE = {
  sleep: { t: 'leans on whole fruit eaten with its fiber rather than strained juice — the pattern WHO recommends', s: 'WHO' },
  energy: { t: 'pairs vitamin-C-rich citrus (documented in the FDA’s raw-fruit facts) with beets, helping you absorb iron from produce', s: 'FDA' },
  eyes: { t: 'centers on carrot and mango for vitamin A and beta-carotene, which Harvard links to eye health', s: 'Harvard' },
  stress: { t: 'is a hydrating, vegetable-forward blend, in line with Harvard’s case for eating more vegetables and fruit', s: 'Harvard' },
  stomach: { t: 'keeps the fruit fiber WHO favors and stays gentle and low in added sugar', s: 'WHO' },
  workout: { t: 'restores potassium — a nutrient the FDA documents in bananas — lost through sweat', s: 'FDA' },
  cold: { t: 'is built on vitamin-C-rich citrus, documented in the FDA’s raw-fruit nutrition facts', s: 'FDA' },
  skin: { t: 'is water-rich produce plus vitamin C, fitting Harvard’s case for eating more fruits and vegetables', s: 'Harvard' },
  focus: { t: 'features berries and leafy greens — the produce Harvard ties to heart and brain health', s: 'Harvard' },
  pomheart: { t: 'is a fruit-and-vegetable-rich pour, and Harvard links such diets to lower heart-disease risk', s: 'Harvard' },
  cherryrecov: { t: 'rehydrates with fruit and electrolytes while keeping the fiber WHO recommends', s: 'WHO' },
  tarttropic: { t: 'adds a variety of whole fruits — Harvard’s “eat the rainbow” advice for a protective diet', s: 'Harvard' },
  dragonglow: { t: 'is vitamin-C-rich fruit, which Harvard connects to the benefits of eating more produce', s: 'Harvard' },
  adaptzen: { t: 'is a low-added-sugar, fruit-based blend, aligned with WHO’s limit on free sugars', s: 'WHO' },
  guthealth: { t: 'keeps whole-fruit fiber intact rather than juicing it away, as WHO advises', s: 'WHO' },
  sleeprest: { t: 'is a gentle, low-sugar evening option, consistent with WHO’s free-sugar guidance', s: 'WHO' },
  braincognit: { t: 'is built on berries and greens, the produce Harvard associates with brain and heart health', s: 'Harvard' },
  immunity: { t: 'delivers vitamin C from fruit, a nutrient documented in the FDA’s raw-produce facts', s: 'FDA' },
};
const PLAN_SOURCE_NOTE = 'Picks are grounded in Harvard’s Nutrition Source, the WHO healthy-diet guidance, and the FDA’s raw-produce nutrition facts.';

function partOfDay(h) {
  if (h < 5) return 'late night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}
const TIME_BIAS = {
  morning: { energy: 1, focus: 1 },
  afternoon: { eyes: 1, stress: 0.5, skin: 0.5 },
  evening: { stress: 1, sleep: 0.5, skin: 0.5 },
  night: { sleep: 1.5 },
  'late night': { sleep: 1.5 },
};
const GREETINGS = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Winding down?', 'late night': 'Up late?' };
const GOOD_TO_KNOW = {
  sleep: 'Tart cherries are one of the few foods with natural melatonin, and banana adds magnesium — both linked to winding down. Blend rather than strain to keep the fiber, and keep it to one small evening glass.',
  energy: 'Beets carry nitrates tied to blood flow, and the orange’s vitamin C helps you absorb iron from greens. Whole beet keeps more fiber than strained juice — go easy, it’s naturally sweet.',
  eyes: 'Carrot and mango are rich in beta-carotene and vitamin A, which Harvard links to eye health; a little fat helps you absorb it. No drink beats the basics, though — look away from screens often and rest your eyes.',
  stress: 'Cucumber and leafy greens are hydrating and rich in magnesium, which is involved in the stress response. Treat this as a calming ritual, not a sedative — pair it with a real break.',
  stomach: 'Ginger has a long track record for easing nausea and pineapple’s bromelain supports digestion. Keep portions small and sip slowly; if stomach trouble lingers, see a doctor rather than self-treating.',
  workout: 'Banana and coconut water replace potassium and electrolytes lost in sweat, and yogurt adds protein to recover. Unlike a plain juice, this one earns its sugars — have it close to your workout.',
  cold: 'Citrus and pineapple are rich in vitamin C and ginger is soothing — but no drink prevents or cures a cold. Think of it as a comforting, hydrating boost; rest and fluids do the real work.',
  skin: 'Watermelon and cucumber are mostly water, and the vitamin C in berries and citrus supports collagen. Hydration shows on skin — but sleep and sunscreen matter far more than any single drink.',
  focus: 'Blueberries bring antioxidants tied to brain health and beet nitrates support blood flow, while banana gives steady energy without a crash. Plain hydration sharpens focus too.',
};

/* Concise, benefit-forward one-liners for the preset drinks (top "why" card).
   Kept distinct from GOOD_TO_KNOW, which carries the longer usage note below. */
const BENEFIT_LINE = {
  sleep: 'Tart cherry brings natural melatonin and banana adds magnesium — a calm, wind-down glass that helps you ease toward sleep.',
  energy: 'Beet nitrates support blood flow and the orange’s vitamin C helps you absorb iron — a clean lift with no caffeine.',
  eyes: 'Carrot and mango are loaded with beta-carotene and vitamin A, which support healthy eyes and a little screen-tired relief.',
  stress: 'Hydrating cucumber and leafy greens deliver magnesium, which is involved in calming the body’s stress response.',
  stomach: 'Ginger has a long track record for settling the stomach, and pineapple’s bromelain gently supports digestion.',
  workout: 'Coconut water and banana replace the electrolytes and potassium you sweat out, and yogurt adds protein to rebuild.',
  cold: 'Vitamin C from citrus and pineapple plus soothing ginger make a warm, hydrating comfort drink while you rest.',
  skin: 'Water-rich fruit and the vitamin C in berries and citrus support hydration and the collagen behind healthy-looking skin.',
  focus: 'Blueberry antioxidants and beet nitrates support brain blood flow, while banana gives steady energy without a crash.',
};
/* A short, plain-language "why this is good for you" for ANY drink —
   preset, AI/recipe, or fully custom (derived from each ingredient's richIn). */
function benefitsFor(juice, resolved) {
  const base = juice && juice.primaryKey ? byKey(juice.primaryKey) : null;
  if (base && base.why) return base.why;
  if (juice && juice.primaryKey && BENEFIT_LINE[juice.primaryKey]) return BENEFIT_LINE[juice.primaryKey];
  const bits = (resolved || [])
    .filter((r) => r && r.richIn && !r.boost && !/^(cold )?water$/i.test(r.name))
    .slice(0, 4)
    .map((r) => `${r.name.toLowerCase()} for ${r.richIn}`);
  if (bits.length) { const s = bits.join(', '); return 'This blend gives you ' + s.charAt(0).toUpperCase() + s.slice(1) + '.'; }
  return 'A feel-good mix of whole fruits and vegetables — hydration and everyday nutrients with the fiber kept in.';
}
/* Generic, filter-aware swaps offered on any matching ingredient by name match. */
const SWAPS = {
  banana: ['½ avocado', 'pear', '½ cup mango'],
  'almond milk': ['oat milk', 'soy milk', 'coconut milk', 'cashew milk'],
  apple: ['pear', 'peach', 'orange'],
  'green apple': ['pear', 'kiwi'],
  'baby spinach': ['kale', 'swiss chard', 'romaine'],
  spinach: ['kale', 'swiss chard'],
  honey: ['maple syrup', 'agave', 'date paste'],
  'plain yogurt': ['coconut yogurt', 'soy yogurt', 'cashew cream'],
  'greek yogurt': ['coconut yogurt', 'skyr', 'silken tofu'],
  'coconut water': ['watermelon juice', 'cucumber water'],
  orange: ['tangerine', 'blood orange', 'grapefruit'],
  mango: ['papaya', 'pineapple', 'peach'],
  ginger: ['turmeric', 'a pinch of cayenne'],
  beetroot: ['pomegranate', 'red cabbage'],
  cucumber: ['celery', 'honeydew', 'zucchini'],
  almonds: ['walnuts', 'pumpkin seeds', 'sunflower seeds'],
  blueberries: ['blackberries', 'raspberries', 'pomegranate'],
};
function swapsFor(name) {
  const k = (name || '').toLowerCase().replace(/,.*$/, '').trim();
  if (SWAPS[k]) return SWAPS[k];
  for (const key of Object.keys(SWAPS)) if (k.includes(key)) return SWAPS[key];
  return null;
}

/* ---------- per-ingredient source citations (#6, #15) ---------- */
/* substring match on ingredient name -> {src, note, url}. Sources are the 3 project links. */
const URL_HARVARD = SOURCES[0].url, URL_WHO = SOURCES[1].url, URL_FDA = SOURCES[2].url;
const CITES = [
  { m: 'carrot', src: 'Harvard', url: URL_HARVARD, note: 'beta-carotene & vitamin A for eyes' },
  { m: 'mango', src: 'Harvard', url: URL_HARVARD, note: 'carotenoids & vitamin A' },
  { m: 'blueberr', src: 'Harvard', url: URL_HARVARD, note: 'anthocyanins linked to brain health' },
  { m: 'beet', src: 'Harvard', url: URL_HARVARD, note: 'dietary nitrates & blood flow' },
  { m: 'spinach', src: 'Harvard', url: URL_HARVARD, note: 'lutein, magnesium & folate' },
  { m: 'tart cherr', src: 'Harvard', url: URL_HARVARD, note: 'a natural source of melatonin' },
  { m: 'orange', src: 'FDA', url: URL_FDA, note: 'vitamin C, per FDA raw-produce facts' },
  { m: 'ginger', src: 'WHO', url: URL_WHO, note: 'soothing; part of a varied diet' },
  { m: 'cucumber', src: 'WHO', url: URL_WHO, note: 'hydrating, counts toward 400g/day' },
  { m: 'watermelon', src: 'FDA', url: URL_FDA, note: 'mostly water + lycopene' },
];
function citeFor(name) {
  const n = (name || '').toLowerCase();
  return CITES.find((c) => n.includes(c.m)) || null;
}

/* ---------- seasonal spotlight (#25) ---------- */
const SEASONAL = {
  winter: { key: 'cold', tag: 'In season: citrus', note: 'Cold-weather citrus is at its peak — lean on vitamin C.' },
  spring: { key: 'skin', tag: 'In season: berries', note: 'Spring greens and early berries brighten skin.' },
  summer: { key: 'skin', tag: 'In season: watermelon', note: 'Hot days reward hydration — watermelon & cucumber shine.' },
  autumn: { key: 'sleep', tag: 'In season: tart cherry', note: 'Shorter days pair well with calming, melatonin-rich cherries.' },
};
function seasonNow(d = new Date()) {
  const m = d.getMonth();
  if (m <= 1 || m === 11) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

/* ---------- in-app tips / "nurture" inbox (#20) ---------- */
/* In a sandbox we can't send email; this is the same content as an in-app inbox. */
const TIPS = [
  { id: 't0', day: 0, title: 'Welcome to Brim', body: 'Tell Brim how you feel and it finds a drink for right now — plus a no-blender snack version of every recipe. Everything here is food ideas, not medical advice.' },
  { id: 't1', day: 2, title: 'Why whole fruit beats juice', body: 'Straining removes fiber, which blunts the sugar spike and keeps you full. WHO suggests ~25g fiber a day and limiting free sugars — so blend (don’t strain) and lean on the snack versions.' },
  { id: 't2', day: 4, title: 'The 400g habit', body: 'WHO’s target is about 400g of fruit & veg a day across at least 5 portions. A Brim drink is one portion — variety across the week matters more than any single glass.' },
  { id: 't3', day: 7, title: 'You’re building a streak', body: 'Small, repeatable beats big and rare. Keep your streak alive with a 2-minute snack version on busy days.' },
];

/* ---------- custom builder pool (#27) ---------- */
/* ============ PANTRY: large categorized ingredient library ============
   Heroes (fruit/veg) carry a color used for gradients; boosters & liquids don't. */
const PANTRY = [
  // ---- FRUITS ----
  { name: 'Orange', cat: 'fruit', richIn: 'vitamin C', color: ['#F9C387', '#EAAB7A'], flavor: 'citrus', amt: 1, unit: '' },
  { name: 'Mango', cat: 'fruit', richIn: 'vitamin A + sweetness', color: ['#FAD284', '#EFB76C'], flavor: 'tropical', amt: 0.75, unit: 'cup' },
  { name: 'Pineapple', cat: 'fruit', richIn: 'bromelain for digestion', color: ['#F5E293', '#E1C479'], flavor: 'tropical', amt: 0.75, unit: 'cup' },
  { name: 'Banana', cat: 'fruit', richIn: 'magnesium + creaminess', color: ['#F6EB9B', '#E8D16E'], flavor: 'creamy', amt: 0.5, unit: '', tags: ['banana'] },
  { name: 'Strawberry', cat: 'fruit', richIn: 'vitamin C for collagen', color: ['#ED8C9A', '#CE737F'], flavor: 'berry', amt: 0.75, unit: 'cup' },
  { name: 'Blueberry', cat: 'fruit', richIn: 'brain-friendly antioxidants', color: ['#909ABC', '#7B829D'], flavor: 'berry', amt: 0.5, unit: 'cup' },
  { name: 'Raspberry', cat: 'fruit', richIn: 'ellagic acid + fiber', color: ['#D37F97', '#B27486'], flavor: 'berry', amt: 0.5, unit: 'cup' },
  { name: 'Blackberry', cat: 'fruit', richIn: 'anthocyanins', color: ['#8E7E91', '#7A707D'], flavor: 'berry', amt: 0.5, unit: 'cup' },
  { name: 'Pomegranate', cat: 'fruit', richIn: 'polyphenols (3x green tea)', color: ['#C97581', '#A66B75'], flavor: 'tart', amt: 0.5, unit: 'cup' },
  { name: 'Tart cherry', cat: 'fruit', richIn: 'natural melatonin', color: ['#B2757E', '#946B73'], flavor: 'tart', amt: 0.5, unit: 'cup' },
  { name: 'Watermelon', cat: 'fruit', richIn: 'hydration + lycopene', color: ['#F69EAC', '#E28291'], flavor: 'sweet', amt: 1, unit: 'cup' },
  { name: 'Apple', cat: 'fruit', richIn: 'fiber + crisp sweetness', color: ['#C4DD8F', '#A8C17C'], flavor: 'sweet', amt: 1, unit: '' },
  { name: 'Pear', cat: 'fruit', richIn: 'gentle fiber', color: ['#DAE6AA', '#BECB8E'], flavor: 'sweet', amt: 1, unit: '' },
  { name: 'Kiwi', cat: 'fruit', richIn: 'more vitamin C than orange', color: ['#B2CD8D', '#97AB7A'], flavor: 'tart', amt: 1, unit: '' },
  { name: 'Grape', cat: 'fruit', richIn: 'resveratrol', color: ['#A189BE', '#89799F'], flavor: 'sweet', amt: 0.75, unit: 'cup' },
  { name: 'Peach', cat: 'fruit', richIn: 'vitamin A + soft sweetness', color: ['#FACFB3', '#EAB294'], flavor: 'sweet', amt: 1, unit: '' },
  { name: 'Dragon fruit', cat: 'fruit', richIn: 'prebiotic fiber', color: ['#E892B5', '#CA769D'], flavor: 'tropical', amt: 0.75, unit: 'cup' },
  { name: 'Passion fruit', cat: 'fruit', richIn: 'mood-supporting compounds', color: ['#E8C987', '#CAAF74'], flavor: 'tropical', amt: 0.33, unit: 'cup' },
  { name: 'Papaya', cat: 'fruit', richIn: 'papain for digestion', color: ['#F8BD94', '#E4A479'], flavor: 'tropical', amt: 0.75, unit: 'cup' },
  { name: 'Guava', cat: 'fruit', richIn: 'huge vitamin C', color: ['#F1B0B0', '#DB9292'], flavor: 'tropical', amt: 0.5, unit: 'cup' },
  { name: 'Lychee', cat: 'fruit', richIn: 'vitamin C + copper', color: ['#F6D9D9', '#ECBCBC'], flavor: 'tropical', amt: 0.5, unit: 'cup' },
  { name: 'Lime', cat: 'fruit', richIn: 'a bright lift', color: ['#C8DA8D', '#AEBF7C'], flavor: 'citrus', amt: 0.5, unit: '' },
  { name: 'Lemon', cat: 'fruit', richIn: 'vitamin C + brightness', color: ['#F5EC9B', '#E2D67A'], flavor: 'citrus', amt: 0.5, unit: '' },
  { name: 'Grapefruit', cat: 'fruit', richIn: 'vitamin C, low sugar', color: ['#F7B1A7', '#E39186'], flavor: 'citrus', amt: 0.5, unit: '' },
  { name: 'Cantaloupe', cat: 'fruit', richIn: 'beta-carotene + water', color: ['#FACEA5', '#EAB48C'], flavor: 'sweet', amt: 1, unit: 'cup' },
  { name: 'Cranberry', cat: 'fruit', richIn: 'urinary-tract support', color: ['#BE6F86', '#9F6979'], flavor: 'tart', amt: 0.5, unit: 'cup' },
  { name: 'Apricot', cat: 'fruit', richIn: 'vitamin A', color: ['#F4C9A0', '#E0AE83'], flavor: 'sweet', amt: 0.75, unit: 'cup' },
  { name: 'Plum', cat: 'fruit', richIn: 'gut-friendly sorbitol', color: ['#A97E8A', '#90727B'], flavor: 'tart', amt: 1, unit: '' },
  { name: 'Fig', cat: 'fruit', richIn: 'minerals + natural sweetness', color: ['#AA92A4', '#907E8C'], flavor: 'sweet', amt: 2, unit: '' },
  { name: 'Avocado', cat: 'fruit', richIn: 'healthy fats + creaminess', color: ['#BBC897', '#9CA883'], flavor: 'creamy', amt: 0.5, unit: '' },
  { name: 'Coconut', cat: 'fruit', richIn: 'creamy electrolytes', color: ['#EBE4D5', '#D4CCB6'], flavor: 'creamy', amt: 0.5, unit: 'cup' },

  // ---- VEGETABLES ----
  { name: 'Carrot', cat: 'veg', richIn: 'beta-carotene → vitamin A', color: ['#F8B88E', '#E4A079'], flavor: 'earthy', amt: 1, unit: '' },
  { name: 'Beetroot', cat: 'veg', richIn: 'nitrates for blood flow', color: ['#CF7986', '#A76D79'], flavor: 'earthy', amt: 0.5, unit: '', tags: ['beet'] },
  { name: 'Cucumber', cat: 'veg', richIn: 'hydration + cooling', color: ['#B0D0A2', '#95B68A'], flavor: 'fresh', amt: 0.5, unit: '', tags: ['cucumber'] },
  { name: 'Celery', cat: 'veg', richIn: 'electrolytes, very light', color: ['#CADBAA', '#AEBF8E'], flavor: 'fresh', amt: 2, unit: 'stalk' },
  { name: 'Tomato', cat: 'veg', richIn: 'lycopene', color: ['#E8928A', '#CB7E77'], flavor: 'savory', amt: 1, unit: '' },
  { name: 'Sweet potato', cat: 'veg', richIn: 'beta-carotene + fiber', color: ['#E6B38C', '#C99A78'], flavor: 'earthy', amt: 0.5, unit: 'cup' },
  { name: 'Pumpkin', cat: 'veg', richIn: 'vitamin A', color: ['#E5AE79', '#C89968'], flavor: 'earthy', amt: 0.5, unit: 'cup' },
  { name: 'Bell pepper', cat: 'veg', richIn: 'vitamin C (more than orange)', color: ['#E78E89', '#CA7B77'], flavor: 'fresh', amt: 0.5, unit: '' },
  { name: 'Fennel', cat: 'veg', richIn: 'eases bloating', color: ['#DEE6C4', '#C1CCA7'], flavor: 'fresh', amt: 0.5, unit: 'cup' },

  // ---- GREENS ----
  { name: 'Baby spinach', cat: 'green', richIn: 'magnesium (you won’t taste it)', color: ['#94BF94', '#81A281'], flavor: 'green', amt: 1, unit: 'cup' },
  { name: 'Kale', cat: 'green', richIn: 'vitamin K + iron', color: ['#8BAD8B', '#799577'], flavor: 'green', amt: 1, unit: 'cup' },
  { name: 'Swiss chard', cat: 'green', richIn: 'magnesium + potassium', color: ['#92B68F', '#7F997D'], flavor: 'green', amt: 1, unit: 'cup' },
  { name: 'Romaine', cat: 'green', richIn: 'folate, very mild', color: ['#B1D198', '#98B583'], flavor: 'green', amt: 1, unit: 'cup' },
  { name: 'Mint', cat: 'green', richIn: 'cooling aroma', color: ['#A0CEAF', '#83B595'], flavor: 'herb', amt: 1, unit: 'handful' },
  { name: 'Basil', cat: 'green', richIn: 'neuroprotective compounds', color: ['#96C19C', '#80A285'], flavor: 'herb', amt: 1, unit: 'handful' },
  { name: 'Parsley', cat: 'green', richIn: 'vitamin K + chlorophyll', color: ['#93BF8C', '#7FA27A'], flavor: 'herb', amt: 1, unit: 'handful' },
  { name: 'Wheatgrass', cat: 'green', richIn: 'chlorophyll boost', color: ['#9DC284', '#88A574'], flavor: 'green', amt: 1, unit: 'tbsp' },

  // ---- BOOSTERS ----
  { name: 'Fresh ginger', cat: 'boost', richIn: 'a warming, settling kick', color: null, flavor: 'spice', amt: 1, unit: 'thumb', tags: ['ginger'] },
  { name: 'Turmeric', cat: 'boost', richIn: 'curcumin, anti-inflammatory', color: null, flavor: 'spice', amt: 1, unit: 'pinch' },
  { name: 'Cinnamon', cat: 'boost', richIn: 'blood-sugar balance', color: null, flavor: 'spice', amt: 1, unit: 'pinch' },
  { name: 'Cayenne', cat: 'boost', richIn: 'a metabolism kick', color: null, flavor: 'spice', amt: 1, unit: 'pinch' },
  { name: 'Chia seeds', cat: 'boost', richIn: 'omega-3 + fiber', color: null, flavor: 'neutral', amt: 1, unit: 'tbsp' },
  { name: 'Flax seeds', cat: 'boost', richIn: 'omega-3 + lignans', color: null, flavor: 'neutral', amt: 1, unit: 'tbsp' },
  { name: 'Hemp seeds', cat: 'boost', richIn: 'plant protein', color: null, flavor: 'neutral', amt: 1, unit: 'tbsp' },
  { name: 'Spirulina', cat: 'boost', richIn: 'protein + immune support', color: null, flavor: 'earthy', amt: 1, unit: 'tsp' },
  { name: 'Matcha', cat: 'boost', richIn: 'L-theanine calm focus', color: null, flavor: 'earthy', amt: 1, unit: 'tsp' },
  { name: 'Cacao', cat: 'boost', richIn: 'mood-lifting flavanols', color: null, flavor: 'rich', amt: 1, unit: 'tbsp' },
  { name: 'Ashwagandha', cat: 'boost', richIn: 'cortisol balance', color: null, flavor: 'earthy', amt: 1, unit: 'tsp' },
  { name: 'Maca', cat: 'boost', richIn: 'steady energy', color: null, flavor: 'earthy', amt: 1, unit: 'tsp' },
  { name: 'Bee pollen', cat: 'boost', richIn: 'amino acids', color: null, flavor: 'sweet', amt: 1, unit: 'tbsp', tags: ['honey'] },
  { name: 'Honey', cat: 'boost', richIn: 'natural sweetness', color: null, flavor: 'sweet', amt: 1, unit: 'tbsp', tags: ['honey'] },
  { name: 'Vanilla', cat: 'boost', richIn: 'warm aroma', color: null, flavor: 'sweet', amt: 0.5, unit: 'tsp' },
  { name: 'Aloe vera', cat: 'boost', richIn: 'soothes the gut', color: null, flavor: 'neutral', amt: 2, unit: 'tbsp' },
  { name: 'Collagen peptides', cat: 'boost', richIn: 'skin + joint support', color: null, flavor: 'neutral', amt: 1, unit: 'scoop' },
  { name: 'Protein powder', cat: 'boost', richIn: 'muscle recovery', color: null, flavor: 'neutral', amt: 1, unit: 'scoop' },

  // ---- LIQUIDS (bases) ----
  { name: 'Coconut water', cat: 'liquid', richIn: 'electrolytes', color: null, flavor: 'light', amt: 1, unit: 'cup' },
  { name: 'Almond milk', cat: 'liquid', richIn: 'a creamy base', color: null, flavor: 'creamy', amt: 1, unit: 'cup', tags: ['nut', 'milk'] },
  { name: 'Oat milk', cat: 'liquid', richIn: 'a creamy, nut-free base', color: null, flavor: 'creamy', amt: 1, unit: 'cup', tags: ['milk'] },
  { name: 'Coconut milk', cat: 'liquid', richIn: 'rich and tropical', color: null, flavor: 'creamy', amt: 1, unit: 'cup', tags: ['milk'] },
  { name: 'Green tea', cat: 'liquid', richIn: 'calm, focused lift', color: null, flavor: 'light', amt: 1, unit: 'cup' },
  { name: 'Cold water', cat: 'liquid', richIn: 'a clean base', color: null, flavor: 'light', amt: 1, unit: 'cup' },
  { name: 'Greek yogurt', cat: 'liquid', richIn: 'protein + probiotics', color: null, flavor: 'creamy', amt: 0.5, unit: 'cup', tags: ['dairy'] },
];
const PANTRY_BY_NAME = Object.fromEntries(PANTRY.map((p) => [p.name, p]));
const CAT_LABELS = { fruit: 'Fruits', veg: 'Vegetables', green: 'Greens & herbs', boost: 'Boosters', liquid: 'Liquid base' };
const CAT_ORDER = ['fruit', 'veg', 'green', 'boost', 'liquid'];
/* The custom builder draws from the whole pantry. */
const CUSTOM_POOL = PANTRY;

/* ---------- weather (open-meteo, keyless) ---------- */
/* WMO weather code → {label, emoji}. https://open-meteo.com/en/docs */
const WMO = {
  0: ['Clear', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Foggy', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
  80: ['Showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Heavy showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm', '⛈️'], 99: ['Thunderstorm', '⛈️'],
};
function wmoInfo(code) { return WMO[code] || ['Weather', '🌡️']; }
/* Pick a few FEELINGS keys that suit the current weather + time. Returns [{key, why}]. */
function weatherSuggest(w, pod) {
  const out = [];
  const add = (key, why) => { if (byKey(key) && !out.some((o) => o.key === key)) out.push({ key, why }); };
  const t = w && w.ok ? w.tempC : null;
  const rainy = w && w.ok && [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(w.code);
  const snowy = w && w.ok && [71, 73, 75, 77, 85, 86].includes(w.code);
  const hot = t != null && t >= 27;
  const warm = t != null && t >= 20 && t < 27;
  const cold = t != null && t < 10;
  if (hot) { add('skin', 'It’s hot out — this hydrating, cooling pour is perfect right now.'); add('stress', 'A cool green glass to beat the heat.'); }
  else if (cold || snowy) { add('cold', 'It’s chilly — a warm, immune-supporting drink fits the day.'); add('focus', 'Something deep and warming for a cold day.'); }
  else if (rainy) { add('sleep', 'Grey skies — a calm, cozy blend to match the mood.'); add('stress', 'Rainy-day calm in a glass.'); }
  else if (warm) { add('eyes', 'Mild and bright out — a fresh, vitamin-rich pour.'); add('energy', 'A lift to make the most of a nice day.'); }
  // time-of-day backfill
  if (pod === 'morning') add('energy', 'A natural morning lift.');
  if (pod === 'evening' || pod === 'night' || pod === 'late night') add('sleep', 'Winding down — something calming.');
  // Rotate fallbacks by time-of-day so home screen doesn't always show the same pair
  const fallbacks = {
    morning: [['energy', 'A clean lift to start the day.'], ['focus', 'Fuel for a sharp morning.']],
    afternoon: [['stomach', 'A gentle, easy-drinking option.'], ['eyes', 'A refresh for screen-tired eyes.']],
    evening: [['stress', 'Wind down with something cooling.'], ['skin', 'A hydrating evening glass.']],
    night: [['sleep', 'Something calming before bed.'], ['stress', 'Ease into rest mode.']],
    'late night': [['sleep', 'A calming late-night pour.'], ['stomach', 'Gentle on the system.']],
  };
  const fb = fallbacks[pod] || fallbacks.afternoon;
  fb.forEach(([k, why]) => add(k, why));
  return out.slice(0, 3);
}

/* ---------- tiny utilities ---------- */
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} } // haptics (#38)
function weekKey(d = new Date()) { const o = new Date(d); o.setHours(0, 0, 0, 0); o.setDate(o.getDate() - o.getDay()); return o.toISOString().slice(0, 10); }
function timeAgo(ts) { const s = Math.max(1, Math.floor((Date.now() - ts) / 1000)); if (s < 60) return s + 's ago'; const m = Math.floor(s / 60); if (m < 60) return m + 'm ago'; const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; return Math.floor(h / 24) + 'd ago'; }
async function copyText(text) { // clipboard for grocery export (#7)
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    try { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); return true; } catch (e2) { return false; }
  }
}

/* ---------- minimal QR (numeric/byte, version 3, ECC-L) for share cards (#24) ----------
   Compact self-contained encoder so the card can carry a real, scannable code. */
function qrMatrix(text) {
  // Reed–Solomon + bit placement for QR Version 3 (29x29), byte mode, ECC level L (55 data codewords).
  const GF_EXP = new Array(512), GF_LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  const gmul = (a, b) => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]);
  function rsGen(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= gmul(g[j], 1); ng[j + 1] ^= gmul(g[j], GF_EXP[i]); } g = ng; } return g; }
  function rsEnc(data, n) { const gen = rsGen(n); const res = new Array(n).fill(0); for (let i = 0; i < data.length; i++) { const f = data[i] ^ res[0]; res.shift(); res.push(0); if (f !== 0) for (let j = 0; j < n; j++) res[j] ^= gmul(gen[j], f); } return res; }
  const CAP = 55; // data codewords for v3-L
  const bytes = []; for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); if (c < 128) bytes.push(c); else { bytes.push(63); } } // ASCII; non-ascii -> '?'
  if (bytes.length > CAP - 3) bytes.length = CAP - 3;
  // bit stream: mode(0100) + len(8 bits, v3 byte) + data + terminator + pad
  let bits = []; const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(4, 4); push(bytes.length, 8); bytes.forEach((b) => push(b, 8));
  for (let i = 0; i < 4 && bits.length < CAP * 8; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const dataCw = []; for (let i = 0; i < bits.length; i += 8) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; dataCw.push(v); }
  const pads = [0xec, 0x11]; let pi = 0; while (dataCw.length < CAP) dataCw.push(pads[pi++ % 2]);
  const ecc = rsEnc(dataCw, 15); // 15 ECC codewords for v3-L
  const all = dataCw.concat(ecc);
  // place into 29x29
  const N = 29; const m = Array.from({ length: N }, () => new Array(N).fill(null));
  const setFinder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const rr = r + i, cc = c + j; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue; const inb = i >= 0 && i <= 6 && j >= 0 && j <= 6; const ring = i === 0 || i === 6 || j === 0 || j === 6; const core = i >= 2 && i <= 4 && j >= 2 && j <= 4; m[rr][cc] = inb && (ring || core) ? 1 : 0; } };
  setFinder(0, 0); setFinder(0, N - 7); setFinder(N - 7, 0);
  for (let i = 0; i < N; i++) { if (m[6][i] === null) m[6][i] = i % 2 === 0 ? 1 : 0; if (m[i][6] === null) m[i][6] = i % 2 === 0 ? 1 : 0; } // timing
  // alignment pattern at (22,22)
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const ring = Math.max(Math.abs(i), Math.abs(j)); m[22 + i][22 + j] = ring === 1 ? 0 : 1; }
  m[N - 8][8] = 1; // dark module
  // reserve format areas
  const reserve = (r, c) => { if (m[r][c] === null) m[r][c] = 'F'; };
  for (let i = 0; i <= 8; i++) { reserve(8, i); reserve(i, 8); }
  for (let i = 0; i < 8; i++) { reserve(8, N - 1 - i); reserve(N - 1 - i, 8); }
  // data placement zigzag
  let dir = -1, row = N - 1, col = N - 1, bit = 0; const stream = []; all.forEach((cw) => { for (let b = 7; b >= 0; b--) stream.push((cw >> b) & 1); });
  let si = 0;
  for (let c = N - 1; c > 0; c -= 2) { if (c === 6) c--; for (let rr = 0; rr < N; rr++) { row = dir < 0 ? N - 1 - rr : rr; for (let k = 0; k < 2; k++) { const cc = c - k; if (m[row][cc] === null) { let v = si < stream.length ? stream[si++] : 0; if (((row + cc) % 2) === 0) v ^= 1; m[row][cc] = v; } } } dir = -dir; }
  // format info (ECC L, mask 0) = 111011111000100
  const fmt = [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0];
  const fpos1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  fpos1.forEach((p, i) => { m[p[0]][p[1]] = fmt[i]; });
  const fpos2 = [[N-1,8],[N-2,8],[N-3,8],[N-4,8],[N-5,8],[N-6,8],[N-7,8],[8,N-8],[8,N-7],[8,N-6],[8,N-5],[8,N-4],[8,N-3],[8,N-2],[8,N-1]];
  fpos2.forEach((p, i) => { m[p[0]][p[1]] = fmt[i]; });
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (m[r][c] === 'F' || m[r][c] === null) m[r][c] = 0;
  return m;
}

/* ---------- profile / build ---------- */
const DEFAULT_PROFILE = { vegan: false, dairyFree: false, nutFree: false, dislikes: [], customDislikes: '' };
const DISLIKES = [
  { key: 'banana', label: 'No banana' }, { key: 'beet', label: 'No beet' },
  { key: 'ginger', label: 'No ginger' }, { key: 'cucumber', label: 'No cucumber' },
];
function violates(c, p) {
  const t = c.tags || [];
  if (p.vegan && (t.includes('dairy') || t.includes('honey'))) return true;
  if (p.dairyFree && t.includes('dairy')) return true;
  if (p.nutFree && t.includes('nut')) return true;
  for (const d of p.dislikes) if (t.includes(d)) return true;
  if (p.customDislikes) {
    const name = (c.name || '').toLowerCase();
    const toks = p.customDislikes.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
    if (toks.some((tok) => name.includes(tok))) return true;
  }
  return false;
}
function allowedOptions(ing, p) {
  const cands = [ing, ...(ing.subs || [])];
  return cands.filter((c) => !violates(c, p));
}
function buildJuice(keys, profile, intensity) {
  const base = byKey(keys[0]);
  const items = [];
  const removed = [];
  base.ingredients.forEach((ing) => {
    const opts = allowedOptions(ing, profile);
    if (opts.length) items.push({ options: opts, idx: 0 });
    else removed.push(ing.name);
  });
  const bonuses = [];
  keys.slice(1).forEach((k) => {
    const f = byKey(k);
    const opts = allowedOptions(f.addOnRef || f.ingredients[0], profile);
    const cur = opts[0];
    if (cur) {
      const exists = items.some((it) => it.options[it.idx].name === cur.name) || bonuses.some((b) => b.name === cur.name);
      if (!exists) bonuses.push({ ...cur, forLabel: f.label });
    }
  });
  let booster = null;
  if (intensity === 'strong' && base.booster && !violates(base.booster, profile)) booster = { ...base.booster };
  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2),
    primaryKey: keys[0], name: base.juiceName, blurb: base.blurb, gradient: base.gradient,
    items, bonuses, booster, method: base.method, removed,
    feelingLabels: keys.map((k) => byKey(k).label), intensity, createdAt: new Date().toISOString(),
  };
}

/* Build a juice object from a set of pantry ingredient names (#27 + Recipe Book). */
function buildFromNames(names, name, gradient, meta) {
  const chosen = names.map((n) => PANTRY_BY_NAME[n]).filter(Boolean);
  const hero = chosen.find((c) => c.color) || null;
  const grad = gradient || (hero ? hero.color
    : chosen.some((c) => /beet/i.test(c.name)) ? ['#E5A6B0', '#C98591']
    : chosen.some((c) => /blue/i.test(c.name)) ? ['#A9B6DE', '#8B96C4']
    : chosen.some((c) => /spinach|cucumber|kale/i.test(c.name)) ? ['#B6D6A8', '#8FB587']
    : ['#FFD2A8', '#F0A773']);
  // order: liquid first conceptually, but display fruits/veg then boosters then liquid
  const order = { fruit: 0, veg: 1, green: 2, boost: 3, liquid: 4 };
  const sorted = [...chosen].sort((a, b) => (order[a.cat] ?? 9) - (order[b.cat] ?? 9));
  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2),
    primaryKey: null, name: name || 'My blend', blurb: (meta && meta.blurb) || 'Your own mix.', gradient: grad,
    items: sorted.map((c) => ({ options: [c], idx: 0 })), bonuses: [], booster: null,
    method: ['Add the liquid or softest item first.', 'Blend everything until smooth.', 'Taste; thin with water or add citrus to brighten.'],
    removed: [], feelingLabels: [(meta && meta.label) || 'Custom'], intensity: 'standard', custom: true, createdAt: new Date().toISOString(),
  };
}
function buildCustom(pickedNames, name) { return buildFromNames(pickedNames, name); }

/* Suggest a trendy/funny name in the same voice as the preset drinks
   (e.g. "Mango Glow-Up", "Lowkey Potion", "Beet o'Clock"). */
const BLEND_ADJ = ['Lowkey', 'Big', 'Hot Girl', 'Main Character', 'Certified', 'Iconic', 'Soft', 'Cozy', 'Zesty', 'Sassy', 'Feral', 'Elite', 'That Girl', 'Glowy', 'Wholesome', 'Unbothered'];
const BLEND_NOUN = ['Glow', 'Fuel', 'Era', 'Mood', 'Bestie', 'Energy', 'Sip', 'Slay', 'Boost', 'Juice', 'Moment', 'Vibe', 'Magic', 'Potion', 'Reset', 'Agenda'];
const BLEND_TAIL = ['Glow-Up', 'Era', 'Moment', 'Bestie', 'o\u2019Clock', 'Mood', 'Agenda', 'Slay', 'Szn'];
function suggestBlendName(names) {
  const chosen = (names || []).map((n) => PANTRY_BY_NAME[n]).filter(Boolean);
  const hero = chosen.find((c) => c.cat === 'fruit') || chosen.find((c) => c.color) || chosen[0];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  if (hero && Math.random() < 0.5) return `${hero.name.split(/[ ,]/)[0]} ${pick(BLEND_TAIL)}`;
  return `${pick(BLEND_ADJ)} ${pick(BLEND_NOUN)}`;
}

/* ---------- share card ---------- */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function wrapText(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}
function drawGlass(ctx, cx, topY, h, cream) {
  const topW = 180, botW = 124, x1 = cx - topW / 2, x2 = cx + topW / 2, x3 = cx + botW / 2, x4 = cx - botW / 2;
  const yb = topY + h, liqTop = topY + h * 0.3;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x1, topY); ctx.lineTo(x2, topY); ctx.lineTo(x3, yb); ctx.lineTo(x4, yb); ctx.closePath();
  ctx.globalAlpha = 0.18; ctx.fillStyle = cream; ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = cream; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, topY); ctx.lineTo(x2, topY); ctx.lineTo(x3, yb); ctx.lineTo(x4, yb); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = 0.42; ctx.fillStyle = cream; ctx.fillRect(0, liqTop, 1080, h);
  ctx.restore();
  ctx.save(); ctx.strokeStyle = cream; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + 18, liqTop + 50); ctx.lineTo(cx + 52, topY - 46); ctx.stroke(); ctx.restore();
}
function makeCardDataURL(juice, quote, names, square, photo) {
  const W = 1080, H = square ? 1080 : 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const [g0, g1] = juice.gradient;
  const cream = '#F6F3EC', paper = '#F4ECDD', ink = '#1C1A17', inkSoft = '#6B655C';
  const topH = square ? 430 : 600;
  const glassTop = square ? 96 : 140;
  const glassH = square ? 230 : 300;
  const nameY = square ? 366 : 500;
  const forY = nameY + 50;
  const quoteY0 = topH + (square ? 120 : 130);

  ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
  if (photo && photo.width) {
    // cover-fit the user's photo into the hero area
    const ar = photo.width / photo.height; const tar = W / topH;
    let sw, sh, sx, sy;
    if (ar > tar) { sh = photo.height; sw = sh * tar; sx = (photo.width - sw) / 2; sy = 0; }
    else { sw = photo.width; sh = sw / tar; sx = 0; sy = (photo.height - sh) / 2; }
    ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, W, topH);
    // legibility scrim: darken top (for BRIM) and bottom (for name)
    const sc = ctx.createLinearGradient(0, 0, 0, topH);
    sc.addColorStop(0, 'rgba(0,0,0,0.42)'); sc.addColorStop(0.32, 'rgba(0,0,0,0.08)');
    sc.addColorStop(0.62, 'rgba(0,0,0,0.12)'); sc.addColorStop(1, 'rgba(0,0,0,0.66)');
    ctx.fillStyle = sc; ctx.fillRect(0, 0, W, topH);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, topH);
    grad.addColorStop(0, g0); grad.addColorStop(1, g1);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, topH);
    ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(120, 100, 130, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1000, topH - 90, 160, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  const heroInk = (photo && photo.width) ? cream : readableOn(g1);
  ctx.fillStyle = heroInk; ctx.textAlign = 'left'; ctx.font = '800 34px system-ui, sans-serif';
  try { ctx.letterSpacing = '8px'; } catch (e) {}
  ctx.fillText('BRIM', 60, 90);
  try { ctx.letterSpacing = '0px'; } catch (e) {}

  if (!photo || !photo.width) drawGlass(ctx, W / 2, glassTop, glassH, heroInk);

  ctx.textAlign = 'center'; ctx.fillStyle = heroInk;
  let ns = 80; ctx.font = `800 ${ns}px system-ui, sans-serif`;
  while (ctx.measureText(juice.name).width > W - 160 && ns > 42) { ns -= 4; ctx.font = `800 ${ns}px system-ui, sans-serif`; }
  ctx.fillText(juice.name, W / 2, nameY);
  ctx.font = '600 24px system-ui, sans-serif'; ctx.fillStyle = (photo && photo.width) ? 'rgba(246,243,233,0.85)' : heroInk; ctx.globalAlpha = (photo && photo.width) ? 1 : 0.7;
  try { ctx.letterSpacing = '2px'; } catch (e) {}
  ctx.fillText(truncate(ctx, 'FOR ' + juice.feelingLabels.join(' · ').toUpperCase(), W - 140), W / 2, forY);
  ctx.globalAlpha = 1;
  try { ctx.letterSpacing = '0px'; } catch (e) {}

  ctx.fillStyle = ink; ctx.font = `italic 700 ${square ? 46 : 54}px Georgia, serif`;
  const qLines = wrapText(ctx, '“' + quote + '”', W - 200);
  let y = quoteY0; const lh = square ? 60 : 70;
  for (const line of qLines) { ctx.fillText(line, W / 2, y); y += lh; }

  y += square ? 22 : 30;
  ctx.font = '800 22px system-ui, sans-serif'; ctx.fillStyle = inkSoft;
  try { ctx.letterSpacing = '3px'; } catch (e) {}
  ctx.fillText('IN THE GLASS', W / 2, y);
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  y += 48;

  const pillNames = names.slice(0, 6);
  ctx.font = '600 26px system-ui, sans-serif';
  const padX = 26, gap = 14, ph = 54, maxRow = W - 110;
  const rows = [[]]; let rowW = 0;
  for (const n of pillNames) {
    const pw = ctx.measureText(n).width + padX * 2;
    const cur = rows[rows.length - 1];
    if (cur.length && rowW + gap + pw > maxRow) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push({ n, pw });
    rowW += (rows[rows.length - 1].length > 1 ? gap : 0) + pw;
  }
  for (const row of rows) {
    const totalW = row.reduce((a, p) => a + p.pw, 0) + gap * (row.length - 1);
    let x = (W - totalW) / 2;
    for (const p of row) {
      ctx.save(); roundRect(ctx, x, y, p.pw, ph, 27);
      ctx.globalAlpha = 0.1; ctx.fillStyle = g1; ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = g1; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.fillText(p.n, x + p.pw / 2, y + ph / 2 + 1);
      ctx.textBaseline = 'alphabetic'; x += p.pw + gap;
    }
    y += ph + 14;
  }

  // QR code (#24): real, scannable, links back to Brim. Bottom-right corner.
  try {
    const mat = qrMatrix('https://brim.app/d/' + (juice.primaryKey || 'x'));
    const n = mat.length; const cell = 4; const qpx = n * cell; const pad = 10;
    const qx = W - qpx - pad - 22, qy = H - qpx - pad - 22;
    ctx.fillStyle = '#fff'; roundRect(ctx, qx - pad, qy - pad, qpx + pad * 2, qpx + pad * 2, 12); ctx.fill();
    ctx.fillStyle = '#111';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (mat[r][c]) ctx.fillRect(qx + c * cell, qy + r * cell, cell, cell);
  } catch (e) {}

  ctx.fillStyle = ink; ctx.font = '700 28px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Made with Brim', 40, H - 54);
  ctx.fillStyle = inkSoft; ctx.font = 'italic 400 23px Georgia, serif';
  ctx.fillText('brim.app · @drinkbrim', 40, H - 22);
  ctx.textAlign = 'center';
  return canvas.toDataURL('image/png');
}

/* ---------- small UI ---------- */
function Glass({ gradient, level, garnish = false, size = 1 }) {
  const [c1, c2] = gradient; const w = 130 * size, h = 200 * size;
  const clip = 'polygon(8% 0%, 92% 0%, 84% 100%, 16% 100%)';
  return (
    <div style={{ width: w, height: h, position: 'relative', margin: '0 auto' }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: clip, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(28,26,23,0.12)', overflow: 'hidden' }}>
        <div className="liquid" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${level}%`, background: `linear-gradient(180deg, ${c1}, ${c2})` }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'rgba(255,255,255,0.35)' }} />
        </div>
        <div style={{ position: 'absolute', top: '6%', bottom: '6%', left: '20%', width: 7 * size, background: 'rgba(255,255,255,0.45)', borderRadius: 6 }} />
      </div>
      {garnish && level > 0 && (
        <div style={{ position: 'absolute', top: -6 * size, left: '56%' }}>
          <span style={{ position: 'absolute', width: 16 * size, height: 22 * size, background: '#3E7D4F', borderRadius: '0 80% 0 80%', transform: 'rotate(18deg)' }} />
          <span style={{ position: 'absolute', left: 8 * size, top: 4 * size, width: 14 * size, height: 20 * size, background: '#4E9A60', borderRadius: '80% 0 80% 0', transform: 'rotate(-22deg)' }} />
        </div>
      )}
    </div>
  );
}
const Tag = ({ children }) => <span style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 10.5, letterSpacing: 0.3, textTransform: 'uppercase', color: C.inkSoft }}>{children}</span>;
const Label = ({ children }) => <div style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.inkSoft }}>{children}</div>;
const Tip = ({ title, body, accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '16px 18px', marginTop: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: accent }}>{title}</div>
    <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, marginTop: 6, opacity: 0.85 }}>{body}</div>
  </div>
);

function Amount({ children }) {
  return <span style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12.5, color: C.inkSoft, minWidth: 58, display: 'inline-block' }}>{children}</span>;
}

function JuiceView({ juice, editable, onResolve, onFullSteps, madeCount }) {
  const dark = darkenForText(juice.gradient[1]);
  const [level, setLevel] = useState(0);
  const [idxs, setIdxs] = useState(() => (juice.items ? juice.items.map((it) => it.idx) : []));
  const [servings, setServings] = useState(() => (juice.resolved ? juice.resolved.servings : 1));

  useEffect(() => { setLevel(0); const t = setTimeout(() => setLevel(80), 90); return () => clearTimeout(t); }, [juice.id]);

  // resolved current ingredient objects (live) or stored (saved)
  const resolved = useMemo(() => {
    if (!editable && juice.resolved) return juice.resolved.items;
    const base = juice.items.map((it, i) => it.options[idxs[i]]);
    return [...base, ...juice.bonuses.map((b) => ({ ...b })), ...(juice.booster ? [{ ...juice.booster, boost: true }] : [])];
  }, [editable, juice, idxs]);

  const namesKey = resolved.map((r) => r.name).join('|');
  useEffect(() => { if (editable && onResolve) onResolve(resolved, servings); }, [namesKey, servings]);

  const swap = (i) => setIdxs((prev) => prev.map((v, k) => (k === i ? (v + 1) % juice.items[i].options.length : v)));

  const baseCount = editable ? juice.items.length : (juice.resolved ? juice.resolved.baseCount : resolved.length);

  return (
    <div>
      <Label>For: {juice.feelingLabels.join(' · ')}</Label>
      <div style={{ height: 14 }} />
      <Glass gradient={juice.gradient} level={level} garnish />
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: dark, lineHeight: 1.05 }}>{juice.name}</div>
        <div style={{ fontSize: 14.5, color: C.inkSoft, marginTop: 8, lineHeight: 1.5, maxWidth: 300, marginInline: 'auto' }}>{juice.blurb}</div>
        {juice.intensity && juice.intensity !== 'standard' && (
          <div style={{ display: 'inline-block', marginTop: 10, fontSize: 12, fontWeight: 700, color: dark, border: `1px solid ${dark}55`, borderRadius: 999, padding: '3px 12px' }}>
            {juice.intensity === 'strong' ? 'Strong' : 'Gentle'}
          </div>
        )}
      </div>

      <div style={{ background: `linear-gradient(150deg, ${juice.gradient[0]}18, ${juice.gradient[1]}10)`, border: `1px solid ${dark}33`, borderRadius: 18, padding: '15px 16px', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Heart size={15} color={dark} /><span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: dark, textTransform: 'uppercase' }}>Why this is good for you</span></div>
        <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, marginTop: 8 }}>{benefitsFor(juice, resolved)}</div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '18px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Recipe</Label>
          {editable ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setServings((s) => Math.max(1, s - 1))} style={stepBtn()}><Minus size={14} /></button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 64, textAlign: 'center' }}>{servings} {servings > 1 ? 'glasses' : 'glass'}</span>
              <button onClick={() => setServings((s) => Math.min(4, s + 1))} style={stepBtn()}><Plus size={14} /></button>
            </div>
          ) : (
            <span style={{ fontSize: 12.5, color: C.inkSoft }}>Makes {servings} {servings > 1 ? 'glasses' : 'glass'}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {resolved.map((ing, i) => {
            const isBase = i < baseCount;
            const hasSwap = editable && isBase && juice.items[i] && juice.items[i].options.length > 1;
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Amount>{fmtAmt(ing.amt, ing.unit, servings)}</Amount>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
                    {ing.name}
                    {ing.boost && <span style={{ fontSize: 11, fontWeight: 700, color: dark, marginLeft: 8 }}>STRONGER</span>}
                    {ing.forLabel && <span style={{ fontSize: 11, color: C.inkSoft, marginLeft: 8 }}>· for “{ing.forLabel}”</span>}
                  </div>
                  <Tag>rich in {ing.richIn}</Tag>
                  {(() => { const ct = citeFor(ing.name); return ct ? (
                    <a href={ct.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: C.herb, textDecoration: 'none', borderBottom: `1px dotted ${C.herb}` }} title={ct.note}>[{ct.src}]</a>
                  ) : null; })()}
                  {editable && (() => { const sw = swapsFor(ing.name); return sw ? (
                    <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>or: {sw.slice(0, 3).join(' · ')}</div>
                  ) : null; })()}
                </div>
                {hasSwap && (
                  <button onClick={() => swap(i)} title="Swap" style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 999, padding: 6, cursor: 'pointer', color: C.herb, flexShrink: 0 }}>
                    <Repeat size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {editable && juice.items.some((it) => it.options.length > 1) && (
          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 12 }}>Tap the swap icon to trade an ingredient for one rich in similar things.</div>
        )}
        {juice.removed && juice.removed.length > 0 && (
          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 10, fontStyle: 'italic' }}>Skipped for your filters: {juice.removed.join(', ')}.</div>
        )}

        <div style={{ borderTop: `1px dashed ${C.line}`, margin: '16px 0 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Step by step</Label>
          {onFullSteps && <button onClick={() => onFullSteps(juice.method)} style={{ background: 'none', border: 'none', color: C.herb, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Full screen</button>}
        </div>
        <ol style={{ margin: '12px 0 0', paddingLeft: 20, color: C.ink }}>
          {juice.method.map((s, i) => {
            const mins = (s.match(/(\d+)\s*min/) || [])[1];
            return (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>
                {s}
                {mins && <button onClick={() => { try { const sec = parseInt(mins, 10) * 60; const end = Date.now() + sec * 1000; const iv = setInterval(() => { if (Date.now() >= end) { clearInterval(iv); buzz([200, 100, 200]); } }, 1000); buzz(40); } catch (e) {} }} style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: C.herb, background: 'none', border: `1px solid ${C.line}`, borderRadius: 999, padding: '1px 8px', cursor: 'pointer' }}>⏱ {mins}m</button>}
              </li>
            );
          })}
        </ol>
      </div>

      {(() => {
        const snack = byKey(juice.primaryKey) && byKey(juice.primaryKey).snack;
        if (!snack) return null;
        return (
          <div style={{ background: C.card, border: `1px dashed ${dark}66`, borderRadius: 18, padding: '16px 18px', marginTop: 12 }}>
            <Label>No blender? Chew it instead</Label>
            <div style={{ fontSize: 16, fontWeight: 800, color: dark, marginTop: 6 }}>{snack.name}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{snack.line} · keeps the fiber whole fruit has.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {snack.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <Amount>{fmtAmt(it.amt, it.unit, 1)}</Amount>
                  <span style={{ fontSize: 14.5, color: C.ink }}>{it.name}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }} />
            <ol style={{ margin: '8px 0 0', paddingLeft: 20, color: C.ink }}>
              {snack.steps.map((s, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>{s}</li>)}
            </ol>
            <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginTop: 12 }}><b style={{ color: dark }}>Tastier:</b> {snack.taste}</div>
            <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginTop: 6 }}><b style={{ color: dark }}>Prettier:</b> {snack.look}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 10, fontStyle: 'italic' }}>Adapt to your filters — e.g. coconut yogurt, or skip the nuts.</div>
          </div>
        );
      })()}

      {madeCount > 0 && <div style={{ textAlign: 'center', fontSize: 12, color: C.inkSoft, marginTop: 12 }}>You’ve made this {madeCount} {madeCount === 1 ? 'time' : 'times'}.</div>}

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, padding: '14px 16px', marginTop: 12 }}>
        <Label>Good to know</Label>
        <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginTop: 6, opacity: 0.85 }}>
          {GOOD_TO_KNOW[juice.primaryKey] || 'Blend rather than strain to keep the fiber, and treat this as a small part of your day, not a meal.'}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.55, marginTop: 14, textAlign: 'center', maxWidth: 320, marginInline: 'auto' }}>
        Brim suggests foods, not medicine. General ingredient ideas, not medical or nutritional advice. If something doesn’t feel right or keeps up, see a doctor.
      </div>
    </div>
  );
}
function stepBtn() { return { background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: 6, cursor: 'pointer', color: C.ink, display: 'flex' }; }

/* Rating + mood sheet (#2). */
function RatingSheet({ name, existing, onClose, onSubmit, C, primaryBtn, ghostBtn }) {
  const [stars, setStars] = useState(existing ? existing.stars : 0);
  const [mood, setMood] = useState(existing ? existing.mood : 0);
  const [note, setNote] = useState(existing ? existing.note || '' : '');
  const moods = ['😣', '😕', '😐', '🙂', '😄'];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 75 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: C.bg, borderRadius: '22px 22px 0 0', padding: '20px 18px 26px' }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 800 }}>How was {name}?</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => { setStars(n); buzz(10); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Star size={32} color="#E8A93F" fill={n <= stars ? '#E8A93F' : 'none'} />
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, textAlign: 'center', marginTop: 16 }}>How do you feel now?</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
          {moods.map((m, i) => (
            <button key={i} onClick={() => { setMood(i + 1); buzz(10); }} style={{ fontSize: 26, background: mood === i + 1 ? C.card : 'none', border: `1px solid ${mood === i + 1 ? C.herb : 'transparent'}`, borderRadius: 12, padding: '4px 8px', cursor: 'pointer' }}>{m}</button>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} placeholder="Anything to remember? (optional)" rows={2} style={{ width: '100%', marginTop: 16, padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 14.5, fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
        <button style={{ ...primaryBtn(), opacity: stars ? 1 : 0.6, marginTop: 14 }} onClick={() => stars && onSubmit(name, stars, mood, note)}>Save rating</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 13.5, padding: 10, cursor: 'pointer', width: '100%' }}>Skip</button>
      </div>
    </div>
  );
}

/* Fullscreen, one-step-at-a-time cooking mode (#34). */
function FullSteps({ steps, onClose, C, primaryBtn, ghostBtn }) {
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 85, display: 'flex', flexDirection: 'column', maxWidth: 440, margin: '0 auto', padding: '24px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.inkSoft }}>Step {i + 1} of {steps.length}</span>
        <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 8, cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
        {steps.map((_, k) => <span key={k} style={{ flex: 1, height: 4, borderRadius: 3, background: k <= i ? C.herb : C.line }} />)}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{steps[i]}</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {i > 0 && <button style={ghostBtn} onClick={() => setI(i - 1)}><ArrowLeft size={16} /> Back</button>}
        <button style={primaryBtn()} onClick={() => last ? onClose() : setI(i + 1)}>{last ? 'Done' : 'Next'} {!last && <ArrowRight size={16} />}</button>
      </div>
    </div>
  );
}


/* ---------- app ---------- */
export default function App() {
  const [screen, setScreen] = useState('home');
  const [intensity, setIntensity] = useState('standard');
  const [juice, setJuice] = useState(null);
  const [resolvedLive, setResolvedLive] = useState(null);
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [toast, setToast] = useState('');
  const toastRef = useRef(null);

  // card
  const [cardJuice, setCardJuice] = useState(null);
  const [cardNames, setCardNames] = useState([]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [square, setSquare] = useState(false);
  const [cardURL, setCardURL] = useState('');
  const [cardPhoto, setCardPhoto] = useState(null);  // user's drink photo (HTMLImageElement) for the card (#3)

  // grocery
  const [checked, setChecked] = useState({});

  // multi-day resets
  const [activeReset, setActiveReset] = useState(null); // {planId, startDate, done:[]}
  const [planId, setPlanId] = useState(null); // plan being viewed
  const [dayDrink, setDayDrink] = useState(null); // built juice for a day, shown in modal
  const [planChecked, setPlanChecked] = useState({});

  // free-text "how do you feel" + dislikes + the shuffled recommendations
  const [feelText, setFeelText] = useState('');
  const [dislikeText, setDislikeText] = useState('');
  const [recs, setRecs] = useState([]); // [{key, why}]
  const [analyzing, setAnalyzing] = useState(false);

  // ---- new feature state ----
  const [dark, setDark] = useState(false);                 // #37 dark mode
  const [onboard, setOnboard] = useState(null);            // #10 onboarding step (null=off)
  const [ratingFor, setRatingFor] = useState(null);        // #2 post-drink rating target
  const [postSave, setPostSave] = useState(null);          // #9 post-save action sheet
  const [ratings, setRatings] = useState({});              // #2 {drinkName: {stars, mood, note}}
  const [favorites, setFavorites] = useState([]);          // #11 favorite drink ids
  const [recents, setRecents] = useState([]);              // #4 recent {key,name,gradient,ts}
  const [makeCounts, setMakeCounts] = useState({});        // #30 {name: count}
  const [water, setWater] = useState({ date: '', count: 0 }); // #18 water tracker
  const [streak, setStreak] = useState({ current: 0, longest: 0, last: '', week: [] }); // #3
  const [reminderOn, setReminderOn] = useState(false);     // #1 reminder opt-in
  const [reminderHour, setReminderHour] = useState(8);     // #1 hour
  const [lastVisit, setLastVisit] = useState('');          // #1 nudge logic
  const [showNudge, setShowNudge] = useState(false);       // #1 in-app nudge
  const [tipsRead, setTipsRead] = useState([]);            // #20 read tips
  const [installAt, setInstallAt] = useState('');          // #20 install date for tip timing
  const [pro, setPro] = useState(false);                   // #19 pro tier (demo)
  const [showPaywall, setShowPaywall] = useState(false);   // #19
  const [planDays, setPlanDays] = useState(5);             // AI plan: number of days
  const [planPurpose, setPlanPurpose] = useState('');      // AI plan: goal
  const [planBusy, setPlanBusy] = useState(false);         // AI plan: generating
  const [aiPlan, setAiPlan] = useState(null);              // AI plan: {days, purpose, intro, plan:[{day,key,why}], source, createdAt}
  const [savedPlans, setSavedPlans] = useState([]);        // [{id, ...plan, expiresAt|null, savedAt}]
  const [showSavePlan, setShowSavePlan] = useState(false); // save-with-expiry sheet
  const [community, setCommunity] = useState([]);          // #12/#23 shared feed
  const [trend, setTrend] = useState({});                  // #12 weekly make counts (shared)
  const [fullSteps, setFullSteps] = useState(null);        // #34 fullscreen steps
  const [customPick, setCustomPick] = useState([]);        // #27 custom builder selection
  const [customName, setCustomName] = useState('');        // #27
  const [wholePref, setWholePref] = useState(false);       // #17 whole-food preference
  const [sleepNote, setSleepNote] = useState('');          // #26 manual "last night's sleep"
  const [listening, setListening] = useState(false);       // #28 voice input
  const [weather, setWeather] = useState({ status: 'idle' }); // {status:'idle'|'loading'|'ok'|'denied'|'error', ok, city, tempC, tempF, code, isDay}
  const analyzeRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get('brim-saved-juices', false); if (r && r.value) setSaved(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get('brim-history', false); if (r && r.value) setHistory(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get('brim-profile', false); if (r && r.value) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(r.value) }); } catch (e) {}
      try { const r = await window.storage.get('brim-active-reset', false); if (r && r.value) setActiveReset(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get('brim-aiplan', false); if (r && r.value) setAiPlan(JSON.parse(r.value)); } catch (e) {}
      try {
        const r = await window.storage.get('brim-saved-plans', false);
        if (r && r.value) {
          const all = JSON.parse(r.value);
          const now = Date.now();
          const live = all.filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now);
          setSavedPlans(live);
          if (live.length !== all.length) { try { await window.storage.set('brim-saved-plans', JSON.stringify(live), false); } catch (e) {} }
        }
      } catch (e) {}
      // settings blob
      let settings = {};
      try { const r = await window.storage.get('brim-settings', false); if (r && r.value) settings = JSON.parse(r.value); } catch (e) {}
      if (settings.dark) { setDark(true); applyTheme(true); }
      if (typeof settings.reminderOn === 'boolean') setReminderOn(settings.reminderOn);
      if (settings.reminderHour != null) setReminderHour(settings.reminderHour);
      if (settings.pro) setPro(true);
      if (settings.wholePref) setWholePref(true);
      // engagement blob
      let eng = {};
      try { const r = await window.storage.get('brim-engagement', false); if (r && r.value) eng = JSON.parse(r.value); } catch (e) {}
      if (eng.ratings) setRatings(eng.ratings);
      if (eng.favorites) setFavorites(eng.favorites);
      if (eng.recents) setRecents(eng.recents);
      if (eng.makeCounts) setMakeCounts(eng.makeCounts);
      if (eng.tipsRead) setTipsRead(eng.tipsRead);
      // water (reset daily)
      const today = new Date().toDateString();
      try { const r = await window.storage.get('brim-water', false); if (r && r.value) { const w = JSON.parse(r.value); setWater(w.date === today ? w : { date: today, count: 0 }); } } catch (e) {}
      // streak
      try { const r = await window.storage.get('brim-streak', false); if (r && r.value) setStreak(JSON.parse(r.value)); } catch (e) {}
      // install date + onboarding
      let inst = '';
      try { const r = await window.storage.get('brim-install', false); if (r && r.value) inst = JSON.parse(r.value).at; } catch (e) {}
      if (!inst) { inst = new Date().toISOString(); try { await window.storage.set('brim-install', JSON.stringify({ at: inst }), false); } catch (e) {} setOnboard(0); }
      setInstallAt(inst);
      // last visit -> in-app nudge if it's been a day+
      try { const r = await window.storage.get('brim-lastvisit', false); if (r && r.value) { const lv = JSON.parse(r.value).at; setLastVisit(lv); const days = (Date.now() - new Date(lv).getTime()) / 86400000; if (days >= 1) setShowNudge(true); } } catch (e) {}
      try { await window.storage.set('brim-lastvisit', JSON.stringify({ at: new Date().toISOString() }), false); } catch (e) {}
      // shared community feed + weekly trend (#12, #23)
      try { const r = await window.storage.get('brim-feed', true); if (r && r.value) setCommunity(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get('brim-trend-' + weekKey(), true); if (r && r.value) setTrend(JSON.parse(r.value)); } catch (e) {}
      // weather: use a fresh cache if we have one, otherwise try to fetch
      let cachedW = null;
      try { const r = await window.storage.get('brim-weather', false); if (r && r.value) cachedW = JSON.parse(r.value); } catch (e) {}
      if (cachedW && cachedW.ok && Date.now() - (cachedW.ts || 0) < 3600000) setWeather(cachedW);
      else fetchWeather();
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (onboard === null) return;
    const t = setTimeout(() => {
      setOnboard(null); setScreen('home');
      // Replace the current history entry so the browser back button doesn't return to the splash
      window.history.replaceState(null, '', window.location.href);
    }, 3000);
    return () => clearTimeout(t);
  }, [onboard]);

  // Handle browser back button: stay within the app instead of leaving
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const onPop = () => {
      window.history.pushState(null, '', window.location.href);
      setScreen((s) => (s !== 'home' ? 'home' : s));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!cardJuice) return;
    const base = byKey(cardJuice.primaryKey);
    const quotes = base ? base.quotes : [cardJuice.blurb || 'Made with Brim.'];
    const q = quotes[quoteIdx % quotes.length];
    try { setCardURL(makeCardDataURL(cardJuice, q, cardNames, square, cardPhoto)); } catch (e) { setCardURL(''); }
  }, [cardJuice, quoteIdx, square, cardNames, cardPhoto]);

  function flash(m) { setToast(m); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(''), 2000); }
  async function persist(key, val) { try { await window.storage.set(key, JSON.stringify(val), false); } catch (e) {} }

  /* Location + weather via browser geolocation + open-meteo (keyless). Graceful on any failure. */
  async function fetchWeather() {
    if (!('geolocation' in navigator)) { setWeather({ status: 'error' }); return; }
    setWeather({ status: 'loading' });
    const getPos = () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 9000, maximumAge: 600000 }));
    try {
      const pos = await getPos();
      const { latitude: lat, longitude: lon } = pos.coords;
      const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=celsius`;
      const wRes = await fetch(wUrl);
      if (!wRes.ok) throw new Error('weather');
      const wData = await wRes.json();
      const cur = wData.current || {};
      const tempC = Math.round(cur.temperature_2m);
      let city = '';
      try {
        const gRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (gRes.ok) { const g = await gRes.json(); city = g.city || g.locality || g.principalSubdivision || ''; }
      } catch (e) {}
      const next = { status: 'ok', ok: true, city, tempC, tempF: Math.round(tempC * 9 / 5 + 32), code: cur.weather_code, isDay: cur.is_day === 1 };
      setWeather(next);
      try { await window.storage.set('brim-weather', JSON.stringify({ ...next, ts: Date.now() }), false); } catch (e) {}
    } catch (err) {
      const denied = err && (err.code === 1 || /denied/i.test(err.message || ''));
      setWeather({ status: denied ? 'denied' : 'error' });
    }
  }

  // Merge the per-session "don't like" box with the saved Settings dislikes.
  function allDislikeText() { return [dislikeText, profile.customDislikes].filter(Boolean).join(', '); }

  function dislikedKeys(text) {
    const t = (text || '').toLowerCase();
    return DISLIKES.filter((d) => t.includes(d.key)).map((d) => d.key);
  }
  function isDislikedDrink(fkey, text) {
    const tokens = (text || '').toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
    if (!tokens.length) return false;
    const names = byKey(fkey).ingredients.map((i) => i.name.toLowerCase()).join(' ');
    return tokens.some((tok) => names.includes(tok));
  }
  // Rule-based picks (the reliable fallback).
  function localPicks() {
    const ft = feelText.toLowerCase();
    const pod = partOfDay(new Date().getHours());
    const bias = TIME_BIAS[pod] || {};
    const wsug = weatherSuggest(weather, pod);
    const wBias = {}; wsug.forEach((s, i) => { wBias[s.key] = 3 - i; });
    const scored = FEELINGS.map((f) => {
      let score = 0; let matched = false;
      (KEYWORDS[f.key] || []).forEach((k) => { if (ft.includes(k)) { score += 3; matched = true; } });
      score += bias[f.key] || 0;
      score += wBias[f.key] || 0;
      return { key: f.key, score, matched };
    });
    const usable = scored.filter((s) => !isDislikedDrink(s.key, allDislikeText()));
    usable.sort((a, b) => b.score - a.score || Math.random() - 0.5);
    const wWhy = {}; wsug.forEach((s) => { wWhy[s.key] = s.why; });
    const picks = usable.slice(0, 5).map((s) => {
      let why;
      if (s.matched) why = `Based on what you wrote, ${REASONS[s.key]}.`;
      else if (wWhy[s.key] && weather.ok) why = wWhy[s.key];
      else why = `It’s ${pod}, so ${REASONS[s.key]}.`;
      return { key: s.key, why };
    });
    const head = picks[0]; const rest = picks.slice(1);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    return head ? [head, ...rest] : [];
  }

  // Real-model analysis. Returns picks or null (then we fall back to localPicks).
  async function aiPicks() {
    const pod = partOfDay(new Date().getHours());
    const list = FEELINGS.map((f) => `${f.key}: ${f.label} (${f.juiceName})`).join('\n');
    const wx = weather.ok ? `${weather.city ? weather.city + ', ' : ''}${weather.tempC}°C, ${wmoInfo(weather.code)[0]}` : 'unknown';
    const prompt = `You help a juice app called Brim pick a drink based on how someone feels right now.\n\nAvailable drinks (key: who it's for):\n${list}\n\nThe person feels: "${feelText || '(nothing typed — surprise them with a great pick)'}"\nThey dislike: "${allDislikeText() || '(nothing)'}"\nLocal time of day: ${pod}\nCurrent local weather: ${wx}\n\nChoose up to 5 drink keys, best-first for this person right now. Use the weather (hot → cooling/hydrating, cold → warming/immune, rainy → calming, bright/mild → fresh & energizing) and the time of day (calming/sleep drinks at night). Skip drinks built around ingredients they dislike. Reply with ONLY this JSON, no markdown or extra text:\n{"picks":[{"key":"<key from the list>","why":"<one short, friendly, second-person sentence; mention the weather or time when it shaped the choice>"}]}`;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      const valid = new Set(FEELINGS.map((f) => f.key));
      const seen = new Set(); const out = [];
      for (const p of (parsed.picks || [])) {
        if (p && valid.has(p.key) && !seen.has(p.key) && !isDislikedDrink(p.key, allDislikeText())) {
          seen.add(p.key); out.push({ key: p.key, why: String(p.why || '').slice(0, 180) });
        }
      }
      return out.length ? out.slice(0, 5) : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(to);
    }
  }

  async function generateRecs() {
    setAnalyzing(true); setRecs([]);
    const minWait = new Promise((r) => setTimeout(r, 1100));
    let picks = null;
    try { picks = await aiPicks(); } catch (e) { picks = null; }
    if (!picks || !picks.length) picks = localPicks();
    await minWait;
    setRecs(picks); setAnalyzing(false);
  }

  // ----- AI multi-day plan (Pro feature; free preview for now) -----
  const PLAN_PRO_ENFORCED = false; // flip to true to make Plans strictly Pro-only

  function planWhy(key, purpose) {
    const f = byKey(key); if (!f) return '';
    const ev = PLAN_EVIDENCE[key];
    if (ev) { const s = ev.t.charAt(0).toUpperCase() + ev.t.slice(1); return `${s}. [${ev.s}]`; }
    const reason = REASONS[key] || f.why || f.blurb || 'a good fit for your goal';
    return reason.charAt(0).toUpperCase() + reason.slice(1).replace(/\.$/, '') + '.';
  }
  // Reliable heuristic plan (used as fallback and when offline).
  function localPlan(days, purpose) {
    const t = (purpose || '').toLowerCase();
    let pool = [];
    PURPOSE_HINTS.forEach((h) => { if (h.re.test(t)) h.keys.forEach((k) => { if (!pool.includes(k)) pool.push(k); }); });
    pool = pool.filter((k) => byKey(k) && !isDislikedDrink(k, allDislikeText()));
    if (pool.length < 2) {
      const extra = FEELINGS.map((f) => f.key).filter((k) => !pool.includes(k) && !isDislikedDrink(k, allDislikeText()));
      pool = [...pool, ...extra].slice(0, Math.max(3, pool.length + 2));
    }
    const plan = [];
    for (let d = 0; d < days; d++) {
      const key = pool[d % pool.length];
      plan.push({ day: d + 1, key, why: planWhy(key, purpose) });
    }
    const intro = `A ${days}-day plan for ${purpose || 'feeling your best'}, rotating drinks so it stays interesting. ${PLAN_SOURCE_NOTE}`;
    return { intro, plan, source: 'local' };
  }
  // Real-model plan. Returns {intro, plan} or null.
  async function aiPlanGen(days, purpose) {
    const list = FEELINGS.map((f) => `${f.key}: ${f.label} (${f.juiceName}) — key ingredients ${(f.ingredients || []).slice(0, 3).map((i) => i.name).join(', ')}`).join('\n');
    const evidence = Object.entries(PLAN_EVIDENCE).map(([k, v]) => `${k}: ${v.t} [${v.s}]`).join('\n');
    const prompt = `You are a juice app called Brim building a personalized multi-day drink plan.\n\nAvailable drinks (key: who it helps):\n${list}\n\nEVIDENCE BASE — the ONLY facts you may use to justify picks (paraphrased from Brim's three sources: Harvard's Nutrition Source, the WHO healthy-diet fact sheet, and the FDA's raw-produce nutrition facts):\n${evidence}\n\nGoal: "${purpose || 'feel good overall'}"\nLength: ${days} days\nAvoid ingredients: "${allDislikeText() || '(none)'}"\n\nRules:\n- Pick one drink per day using ONLY the keys above; you may repeat a key on different days if it fits, but vary it and sequence sensibly for the goal.\n- For each day, the "why" MUST stay strictly within the evidence base above, MUST tie the drink to the stated goal, and MUST end with the matching source tag in brackets: [Harvard], [WHO] or [FDA]. Do NOT invent health claims, mechanisms, or nutrients beyond the evidence base.\n- Write a one-sentence intro that names the goal and notes that picks are grounded in Harvard, WHO and FDA guidance.\nReply with ONLY this JSON, no markdown:\n{"intro":"<one sentence>","plan":[{"day":1,"key":"<key>","why":"<one short sentence ending in [Harvard|WHO|FDA]>"}]}`;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 18000);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      const valid = new Set(FEELINGS.map((f) => f.key));
      let plan = (parsed.plan || []).filter((p) => p && valid.has(p.key) && !isDislikedDrink(p.key, allDislikeText()))
        .map((p, i) => ({ day: i + 1, key: p.key, why: String(p.why || planWhy(p.key, purpose)).slice(0, 200) }));
      if (!plan.length) return null;
      // pad/trim to exactly `days`
      const fallbackPool = plan.map((p) => p.key);
      let i = 0;
      while (plan.length < days) { const key = fallbackPool[i % fallbackPool.length]; plan.push({ day: plan.length + 1, key, why: planWhy(key, purpose) }); i++; }
      plan = plan.slice(0, days).map((p, idx) => ({ ...p, day: idx + 1 }));
      return { intro: String(parsed.intro || `A ${days}-day plan for ${purpose || 'feeling your best'}.`).slice(0, 240), plan, source: 'ai' };
    } catch (e) { return null; } finally { clearTimeout(to); }
  }
  async function generatePlan() {
    if (PLAN_PRO_ENFORCED && !pro) { setShowPaywall(true); return; }
    setPlanBusy(true); setAiPlan(null);
    const minWait = new Promise((r) => setTimeout(r, 1300));
    let res = null;
    try { res = await aiPlanGen(planDays, planPurpose.trim()); } catch (e) { res = null; }
    if (!res) res = localPlan(planDays, planPurpose.trim());
    await minWait;
    const blob = { days: planDays, purpose: planPurpose.trim() || 'feeling your best', intro: res.intro, plan: res.plan, source: res.source, createdAt: new Date().toISOString() };
    setAiPlan(blob); persist('brim-aiplan', blob); setPlanBusy(false); buzz(20);
  }
  function exportPlan() {
    if (!aiPlan) return;
    const lines = aiPlan.plan.map((p) => `Day ${p.day}: ${byKey(p.key).juiceName} — ${p.why}`);
    const text = `Brim · ${aiPlan.days}-day plan for ${aiPlan.purpose}\n\n${aiPlan.intro}\n\n${lines.join('\n')}`;
    copyText(text).then((ok) => flash(ok ? 'Plan copied' : 'Couldn’t copy'));
  }
  // Save the current plan with an expiry. days=null means "permanent" (Pro only).
  function savePlanWithExpiry(days) {
    if (!aiPlan) return;
    if (days === null && !pro) { setShowSavePlan(false); setShowPaywall(true); return; }
    const expiresAt = days === null ? null : new Date(Date.now() + days * 86400000).toISOString();
    const entry = { id: 'plan-' + Date.now().toString(36), days: aiPlan.days, purpose: aiPlan.purpose, intro: aiPlan.intro, plan: aiPlan.plan, source: aiPlan.source, savedAt: new Date().toISOString(), expiresAt };
    const next = [entry, ...savedPlans].slice(0, 50);
    setSavedPlans(next); persist('brim-saved-plans', next);
    setShowSavePlan(false); buzz(20);
    flash(days === null ? 'Saved — kept permanently' : `Saved — expires in ${days} days`);
  }
  function deleteSavedPlan(id) {
    const next = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(next); persist('brim-saved-plans', next); flash('Plan deleted');
  }
  function openSavedPlan(p) {
    setAiPlan({ days: p.days, purpose: p.purpose, intro: p.intro, plan: p.plan, source: p.source, createdAt: p.savedAt });
    setPlanPurpose(p.purpose === 'feeling your best' ? '' : p.purpose); setPlanDays(p.days);
    setScreen('planner'); window.scrollTo && window.scrollTo(0, 0);
  }
  function expiryLabel(expiresAt) {
    if (!expiresAt) return 'Permanent';
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const d = Math.ceil(ms / 86400000);
    return d <= 1 ? 'Expires today' : `Expires in ${d} days`;
  }

  // Surprise me: factor in weather + time + AI, then build the top pick right away.
  async function surpriseMe() {
    setAnalyzing(true);
    setScreen('select'); setRecs([]); setFeelText('');
    const minWait = new Promise((r) => setTimeout(r, 900));
    let picks = null;
    try { picks = await aiPicks(); } catch (e) { picks = null; }
    if (!picks || !picks.length) picks = localPicks();
    await minWait;
    setAnalyzing(false);
    if (picks && picks.length) { setRecs(picks); buildOne(picks[0].key); }
  }

  function buildOne(key) {
    const p = { ...profile, dislikes: [...new Set([...profile.dislikes, ...dislikedKeys(allDislikeText())])] };
    const j = buildJuice([key], p, intensity);
    setJuice(j); setResolvedLive(null); setScreen('result');
    const entry = { date: new Date().toISOString(), name: j.name, feelings: [key], userText: feelText.trim() };
    const h = [entry, ...history].slice(0, 60);
    setHistory(h); persist('brim-history', h);
    recordMake(j);
  }

  function onResolve(items, servings) { setResolvedLive({ items, servings }); }

  function openCard(j, resolved) {
    const items = resolved ? resolved.items : (j.resolved ? j.resolved.items : j.items.map((it) => it.options[it.idx]));
    setCardNames(items.map((i) => i.name));
    const base = byKey(j.primaryKey);
    setQuoteIdx(base ? Math.floor(Math.random() * base.quotes.length) : 0);
    setSquare(false);
    setCardPhoto(null);
    setCardJuice(j);
  }

  function downloadCard() {
    if (!cardURL) return;
    try {
      const a = document.createElement('a');
      a.href = cardURL; a.download = cardJuice.name.replace(/\s+/g, '-').toLowerCase() + '-brim.png';
      document.body.appendChild(a); a.click(); a.remove(); flash('Saved to downloads');
    } catch (e) { flash('Long-press the card to save'); }
  }

  // #3 add a real photo of the made drink onto the share card
  function onPickCardPhoto(e) {
    const file = e.target && e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { flash('Please choose an image'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { setCardPhoto(img); buzz(15); flash('Photo added'); };
      img.onerror = () => flash('Couldn’t read that image');
      img.src = reader.result;
    };
    reader.onerror = () => flash('Couldn’t read that image');
    reader.readAsDataURL(file);
  }

  async function saveJuice() {
    if (!juice) return;
    const items = resolvedLive ? resolvedLive.items : juice.items.map((it) => it.options[it.idx]).concat(juice.bonuses, juice.booster ? [juice.booster] : []);
    const servings = resolvedLive ? resolvedLive.servings : 1;
    const baseCount = juice.items.length;
    const snap = { ...juice, resolved: { items, servings, baseCount } };
    if (saved.some((s) => s.name === snap.name && JSON.stringify(s.feelingLabels) === JSON.stringify(snap.feelingLabels))) { flash('Already on your shelf'); return; }
    const updated = [snap, ...saved]; setSaved(updated); persist('brim-saved-juices', updated); flash('Saved to your shelf');
    buzz(20);
    setPostSave(snap); // #9 show "what's next" sheet (offers rating, list, share)
  }
  function removeJuice(id) { const u = saved.filter((s) => s.id !== id); setSaved(u); persist('brim-saved-juices', u); }

  // ----- resets -----
  function startReset(id) {
    const ar = { planId: id, startDate: new Date().toISOString(), done: [] };
    setActiveReset(ar); persist('brim-active-reset', ar); setPlanId(id); setScreen('reset');
  }
  function toggleDay(i) {
    setActiveReset((prev) => {
      if (!prev) return prev;
      const done = prev.done.includes(i) ? prev.done.filter((d) => d !== i) : [...prev.done, i];
      const next = { ...prev, done };
      persist('brim-active-reset', next);
      return next;
    });
  }
  function abandonReset() { setActiveReset(null); persist('brim-active-reset', null); setScreen('home'); }
  function openDayDrink(feel) { setDayDrink(buildJuice([feel], profile, 'standard')); }

  // ---- persistence for new blobs ----
  function persistEng(patch) {
    const blob = { ratings, favorites, recents, makeCounts, tipsRead, ...patch };
    persist('brim-engagement', blob);
  }
  function persistSettings(patch) {
    const blob = { dark, reminderOn, reminderHour, pro, wholePref, ...patch };
    persist('brim-settings', blob);
  }

  // #37 dark mode
  function toggleDark() { const v = !dark; setDark(v); applyTheme(v); persistSettings({ dark: v }); buzz(20); }

  // #3 streak + #18 water are updated when a drink is built
  function bumpStreak() {
    const today = new Date().toDateString();
    setStreak((prev) => {
      if (prev.last === today) return prev;
      const yest = new Date(Date.now() - 86400000).toDateString();
      const current = prev.last === yest ? prev.current + 1 : 1;
      const longest = Math.max(prev.longest || 0, current);
      const week = [...(prev.week || []), today].slice(-7);
      const next = { current, longest, last: today, week };
      persist('brim-streak', next);
      return next;
    });
  }
  function logWater() {
    const today = new Date().toDateString();
    setWater((prev) => { const base = prev.date === today ? prev : { date: today, count: 0 }; const next = { date: today, count: Math.min(12, base.count + 1) }; persist('brim-water', next); buzz(15); return next; });
  }

  // #4 recents + #30 make-count + #12 trend, called on every build
  function recordMake(j) {
    bumpStreak();
    const key = j.primaryKey || ('custom:' + j.name);
    setMakeCounts((prev) => { const next = { ...prev, [j.name]: (prev[j.name] || 0) + 1 }; persistEng({ makeCounts: next }); return next; });
    setRecents((prev) => { const next = [{ key: j.primaryKey, name: j.name, gradient: j.gradient, ts: Date.now() }, ...prev.filter((r) => r.name !== j.name)].slice(0, 5); persistEng({ recents: next }); return next; });
    // weekly trend (shared across users) — best effort
    if (j.primaryKey) bumpTrend(j.primaryKey);
  }
  async function bumpTrend(key) {
    try {
      const wk = 'brim-trend-' + weekKey();
      const r = await window.storage.get(wk, true);
      const cur = r && r.value ? JSON.parse(r.value) : {};
      cur[key] = (cur[key] || 0) + 1;
      await window.storage.set(wk, JSON.stringify(cur), true);
      setTrend(cur);
    } catch (e) {}
  }

  // #2 rating
  function submitRating(name, stars, mood, note) {
    setRatings((prev) => { const next = { ...prev, [name]: { stars, mood, note, ts: Date.now() } }; persistEng({ ratings: next }); return next; });
    setRatingFor(null); flash('Thanks — noted'); buzz(20);
  }

  // #11 favorites
  function toggleFavorite(id) {
    setFavorites((prev) => { const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]; persistEng({ favorites: next }); return next; });
    buzz(15);
  }

  // #4 rebuild a saved/recent drink in one tap
  function rebuild(snap) {
    const j = snap.resolved ? snap : { ...snap };
    setJuice(j); setResolvedLive(null); setViewing(null); setScreen('result');
    recordMake(j);
  }
  function rebuildByKey(key) {
    if (!key) return;
    const j = buildJuice([key], { ...profile }, intensity);
    setJuice(j); setResolvedLive(null); setScreen('result'); recordMake(j);
  }

  // #20 tips inbox
  function markTip(id) { setTipsRead((prev) => { if (prev.includes(id)) return prev; const next = [...prev, id]; persistEng({ tipsRead: next }); return next; }); }
  const tipsAvailable = useMemo(() => {
    const days = installAt ? (Date.now() - new Date(installAt).getTime()) / 86400000 : 0;
    return TIPS.filter((t) => days >= t.day);
  }, [installAt]);
  const unreadTips = tipsAvailable.filter((t) => !tipsRead.includes(t.id)).length;

  // #27 custom builder
  function makeCustom() {
    if (customPick.length < 2) { flash('Pick at least 2 ingredients'); return; }
    const finalName = customName.trim() || suggestBlendName(customPick);
    const j = buildCustom(customPick, finalName);
    setJuice(j); setResolvedLive(null); setScreen('result'); recordMake(j);
    setCustomPick([]); setCustomName('');
  }

  // #28 voice input (Web Speech API where available)
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { flash('Voice input isn’t supported here'); return; }
    try {
      const rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
      setListening(true);
      rec.onresult = (e) => { const t = e.results[0][0].transcript; setFeelText((p) => (p ? p + ' ' : '') + t); };
      rec.onerror = () => { setListening(false); flash('Didn’t catch that'); };
      rec.onend = () => setListening(false);
      rec.start();
    } catch (e) { setListening(false); flash('Voice input unavailable'); }
  }

  // #7 grocery export
  async function exportGrocery(list, label) {
    const text = (label ? label + '\n' : '') + list.map((g) => '• ' + g.name).join('\n');
    const ok = await copyText(text);
    flash(ok ? 'Copied — paste into Reminders/Notes' : 'Couldn’t copy');
  }

  // #23 community post (opt-in, anonymous)
  async function postToCommunity(j) {
    try {
      const entry = { name: j.name, key: j.primaryKey, grad: j.gradient, ts: Date.now() };
      const r = await window.storage.get('brim-feed', true);
      const cur = r && r.value ? JSON.parse(r.value) : [];
      const next = [entry, ...cur].slice(0, 30);
      await window.storage.set('brim-feed', JSON.stringify(next), true);
      setCommunity(next); flash('Shared anonymously');
    } catch (e) { flash('Couldn’t share'); }
  }

  // #19 pro (demo unlock — no real billing in a sandbox)
  function unlockPro() { setPro(true); setShowPaywall(false); persistSettings({ pro: true }); flash('Brim Pro unlocked (demo)'); }

  // #21 referral — generates a stable code and copies an invite link
  const refCode = useMemo(() => 'BRIM-' + (installAt ? installAt.slice(2, 4) + installAt.slice(5, 7) + installAt.slice(8, 10) : 'JUICE'), [installAt]);
  async function referFriend() {
    const link = `https://brim.app/i/${refCode}`;
    const msg = `I’ve been using Brim — tell it how you feel and it picks a drink for you, with a no-blender option. Join with my link and we both get a month of Pro: ${link}`;
    if (navigator.share) { try { await navigator.share({ title: 'Brim', text: msg, url: link }); return; } catch (e) {} }
    const ok = await copyText(msg); flash(ok ? 'Invite copied — paste anywhere' : 'Couldn’t copy');
  }

  // #1 reminder opt-in -> also create a device reminder if the app exposes it
  async function saveReminder(on, hour) {
    setReminderOn(on); setReminderHour(hour); persistSettings({ reminderOn: on, reminderHour: hour });
    flash(on ? `Daily check-in set for ${hour}:00` : 'Daily check-in off');
  }

  const planGrocery = useMemo(() => {
    if (!planId) return [];
    const plan = byReset(planId);
    const map = {};
    plan.days.forEach((d, di) => {
      const j = buildJuice([d.feel], profile, 'standard');
      const items = [...j.items.map((it) => it.options[0]), ...j.bonuses];
      items.forEach((it) => { if (!map[it.name]) map[it.name] = new Set(); map[it.name].add('Day ' + (di + 1)); });
    });
    return Object.keys(map).sort().map((name) => ({ name, from: [...map[name]] }));
  }, [planId, profile]);

  // grocery aggregation
  const grocery = useMemo(() => {
    const map = {};
    saved.forEach((s) => {
      const items = s.resolved ? s.resolved.items : [];
      items.forEach((it) => {
        if (!map[it.name]) map[it.name] = new Set();
        map[it.name].add(s.name);
      });
    });
    return Object.keys(map).sort().map((name) => ({ name, from: [...map[name]] }));
  }, [saved]);

  const insight = useMemo(() => {
    if (history.length < 2) return null;
    const recent = history.slice(0, 12);
    const tally = {};
    recent.forEach((h) => h.feelings.forEach((f) => { tally[f] = (tally[f] || 0) + 1; }));
    let top = null, n = 0;
    Object.entries(tally).forEach(([k, v]) => { if (v > n) { top = k; n = v; } });
    if (!top || n < 2) return null;
    return { label: byKey(top).label.toLowerCase(), n };
  }, [history]);

  const primaryBtn = (bg) => { const b = bg || C.herb; return { background: b, color: readableOn(b), border: 'none', borderRadius: 999, padding: '14px 22px', fontSize: 15, fontWeight: 600, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }; };
  const ghostBtn = { background: 'transparent', color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: '14px 22px', fontSize: 15, fontWeight: 600, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
  const iconBtn = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 10, cursor: 'pointer', color: C.ink, display: 'flex' };
  const heroIcon = { background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 999, padding: 9, cursor: 'pointer', color: '#fff', display: 'flex' };

  const profileSummary = () => {
    const parts = [];
    if (profile.vegan) parts.push('vegan');
    if (profile.dairyFree) parts.push('dairy-free');
    if (profile.nutFree) parts.push('nut-free');
    profile.dislikes.forEach((d) => parts.push('no ' + d));
    return parts.length ? parts.join(', ') : 'none set';
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center' }}>
      <style>{`
        * { box-sizing: border-box; }
        .liquid { transition: height 1.1s cubic-bezier(.22,1,.36,1); }
        button:focus-visible, .chip:focus-visible { outline: 2px solid ${C.herb}; outline-offset: 2px; }
        .chip { border-radius: 999px; padding: 11px 16px; font-size: 14px; font-weight: 600; border: 1px solid ${C.line}; background: ${C.card}; color: ${C.ink}; cursor: pointer; transition: transform .12s, background .18s, color .18s, border-color .18s; }
        .chip:hover { border-color: ${C.herb}; }
        .chip[data-on="true"] { background: ${C.herb}; color: ${readableOn(C.herb)}; border-color: ${C.herb}; }
        .chip:active { transform: scale(0.97); }
        .seg { flex:1; padding:10px; font-size:13px; font-weight:600; background:transparent; border:none; cursor:pointer; color:${C.inkSoft}; border-radius:999px; }
        .seg[data-on="true"] { background:${C.herb}; color:${readableOn(C.herb)}; }
        @keyframes bob { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-5px);} }
        .bob { animation: bob 4s ease-in-out infinite; }
        ol { list-style: decimal; }
        .spinner { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid ${C.line}; border-top-color: ${C.herb}; animation: spin .7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
        .analyze-line { opacity: 0; animation: fadeUp .4s ease forwards; }
        @keyframes glow { 0%,100% { transform: scale(1); opacity: .55;} 50% { transform: scale(1.08); opacity: .8;} }
        @media (prefers-reduced-motion: reduce){ .liquid{transition:none;} .bob{animation:none;} .spinner{animation-duration:2s;} .analyze-line{opacity:1;animation:none;} }
      `}</style>

      <div style={{ width: '100%', maxWidth: 440, minHeight: '100vh', padding: '24px 20px 40px', fontFamily: 'system-ui, -apple-system, sans-serif', color: C.ink, position: 'relative' }}>

        {/* HOME */}
        {screen === 'home' && (() => {
          const pod = partOfDay(new Date().getHours());
          const greeting = GREETINGS[pod] || 'Hello';
          const HERO = {
            morning: 'linear-gradient(160deg, #FFE2C2 0%, #FFF0BE 100%)',
            afternoon: 'linear-gradient(160deg, #FFD9C6 0%, #FFC4CE 100%)',
            evening: 'linear-gradient(160deg, #E6CEF6 0%, #F4C9E5 100%)',
            night: 'linear-gradient(160deg, #D0C7F4 0%, #C2DCF2 100%)',
            'late night': 'linear-gradient(160deg, #C8C2EE 0%, #BAC9EA 100%)',
          };
          const heroBg = HERO[pod] || HERO.afternoon;
          const wi = weather.ok ? wmoInfo(weather.code) : null;
          const suggestions = weatherSuggest(weather, pod);
          return (
          <div style={{ minHeight: '94vh', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 3, color: C.ink }}>BRIM</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={{ background: 'none', border: 'none', borderRadius: 999, padding: 8, cursor: 'pointer', color: C.ink, display: 'flex' }} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggleDark}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
                <button style={{ background: 'none', border: 'none', borderRadius: 999, padding: 8, cursor: 'pointer', color: C.ink, display: 'flex' }} title="Grocery list" onClick={() => { setChecked({}); setScreen('grocery'); }}><ShoppingCart size={18} /></button>
                <button style={{ background: 'none', border: 'none', borderRadius: 999, padding: 8, cursor: 'pointer', color: C.ink, display: 'flex' }} title="History" onClick={() => setScreen('history')}><Clock size={18} /></button>
                <button style={{ background: 'none', border: 'none', borderRadius: 999, padding: 8, cursor: 'pointer', color: C.ink, display: 'flex' }} title="Settings" onClick={() => setScreen('settings')}><Settings size={18} /></button>
              </div>
            </div>

            {/* hero: greeting + weather */}
            <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: heroBg, padding: '22px 22px 24px', color: dark ? '#EEE9F6' : '#3A3340' }}>
              {dark && <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,37,0.55)', borderRadius: 26 }} />}
              <div style={{ position: 'absolute', top: -50, right: -30, width: 170, height: 170, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em' }}>{greeting}.</div>
                <div style={{ fontSize: 14, opacity: 0.78, marginTop: 6, lineHeight: 1.5, maxWidth: 280 }}>What does today feel like? Brim will find your drink.</div>
                {/* weather line */}
                <div style={{ marginTop: 16 }}>
                  {weather.status === 'loading' && <div style={{ fontSize: 13, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 8 }}><span className="spinner" style={{ borderTopColor: '#3A3340', borderColor: 'rgba(58,51,64,0.3)' }} /> Getting your local weather…</div>}
                  {weather.ok && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: '10px 14px' }}>
                      <span style={{ fontSize: 30, lineHeight: 1 }}>{wi[1]}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 19, fontWeight: 800 }}>{weather.tempC}°C <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>/ {weather.tempF}°F</span></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, opacity: 0.85, marginTop: 1 }}>{wi[0]}{weather.city ? <><span style={{ opacity: 0.6 }}>·</span><MapPin size={11} /> {weather.city}</> : null}</span>
                      </span>
                      <button onClick={fetchWeather} title="Refresh" style={{ background: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 999, padding: 7, cursor: 'pointer', color: '#3A3340', display: 'flex' }}><RotateCcw size={14} /></button>
                    </div>
                  )}
                  {(weather.status === 'denied' || weather.status === 'error' || weather.status === 'idle') && (
                    <button onClick={fetchWeather} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 14, padding: '11px 14px', cursor: 'pointer', color: '#3A3340', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left' }}>
                      <MapPin size={16} /> {weather.status === 'denied' ? 'Location blocked — tap to allow weather picks' : 'Use my location for weather-based picks'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* primary actions */}
            <button onClick={() => { setRecs([]); setScreen('select'); }} style={{ background: C.ink, color: C.bg, border: 'none', borderRadius: 18, padding: '17px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16.5, fontWeight: 800 }}>How are you feeling?</span>
              <span style={{ background: C.herb, borderRadius: 999, padding: 9, display: 'flex' }}><ArrowRight size={18} /></span>
            </button>
            <button onClick={surpriseMe} disabled={analyzing} style={{ background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 18, padding: '15px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700, opacity: analyzing ? 0.6 : 1 }}>
              <Sparkles size={17} color={C.herb} /> {analyzing ? 'Finding your drink…' : 'Surprise me'}
            </button>
            <div style={{ fontSize: 11.5, color: C.inkSoft, textAlign: 'center', marginTop: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Sparkles size={11} /> Surprise me reads your local weather, the time, and uses Claude AI</div>

            {/* resume reset */}
            {loaded && activeReset && byReset(activeReset.planId) && (() => {
              const plan = byReset(activeReset.planId); const doneN = activeReset.done.length;
              return (
                <button onClick={() => { setPlanId(activeReset.planId); setScreen('reset'); }} style={{ textAlign: 'left', background: C.herb, color: '#fff', border: 'none', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: 0.5 }}>CONTINUE YOUR RESET</span>
                    <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, marginTop: 2 }}>{plan.name} · {doneN}/{plan.length}</span>
                  </span>
                  <Play size={18} />
                </button>
              );
            })()}

            {/* weather/time suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 10 }}>{weather.ok ? `Good for ${wi[0].toLowerCase()}, ${weather.tempC}°C` : `Suggested for this ${pod === 'late night' ? 'hour' : pod}`}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestions.map((s) => { const f = byKey(s.key); return (
                    <button key={s.key} onClick={() => buildOne(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 13, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(150deg, ${f.gradient[0]}, ${f.gradient[1]})`, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700 }}>{f.juiceName}</span>
                        <span style={{ display: 'block', fontSize: 12.5, color: C.inkSoft, marginTop: 2, lineHeight: 1.4 }}>{s.why}</span>
                      </span>
                      <ChevronRight size={18} color={C.inkSoft} style={{ flexShrink: 0 }} />
                    </button>
                  ); })}
                </div>
              </div>
            )}

            {/* AI multi-day plan (Pro) */}
            <button onClick={() => setScreen('planner')} style={{ textAlign: 'left', background: `linear-gradient(135deg, ${C.herb}, #6E54B0)`, color: '#fff', border: 'none', borderRadius: 18, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CalendarDays size={22} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 16, fontWeight: 800 }}>Plan my days</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, background: 'rgba(255,255,255,0.28)', borderRadius: 999, padding: '2px 7px' }}>PRO</span>
                </span>
                <span style={{ display: 'block', fontSize: 12.5, opacity: 0.92, marginTop: 3, lineHeight: 1.4 }}>{aiPlan ? `Your ${aiPlan.days}-day plan for ${aiPlan.purpose} is ready` : 'Tell Brim a goal — AI builds a multi-day drink plan'}</span>
              </span>
              <ArrowRight size={18} style={{ flexShrink: 0 }} />
            </button>
            {savedPlans.length > 0 && (
              <button onClick={() => setScreen('savedplans')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 16px', cursor: 'pointer', marginTop: -8 }}>
                <Bookmark size={17} color={C.herb} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14.5, fontWeight: 700, color: C.ink }}>My saved plans</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.herb, background: C.panel, borderRadius: 999, padding: '2px 9px' }}>{savedPlans.length}</span>
                <ChevronRight size={17} color={C.inkSoft} style={{ flexShrink: 0 }} />
              </button>
            )}

            {/* quiet links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {[
                { ic: <Bookmark size={17} color={C.herb} />, label: 'Shelf', go: () => setScreen('saved') },
                { ic: <Beaker size={17} color={C.herb} />, label: 'Build', go: () => setScreen('custom') },
                { ic: <CalendarDays size={17} color={C.herb} />, label: 'Resets', go: () => setScreen('resets') },
                { ic: <BarChart3 size={17} color={C.herb} />, label: 'Stats', go: () => setScreen('stats') },
              ].map((t, i) => (
                <button key={i} onClick={t.go} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {t.ic}<span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />
            <button onClick={() => setScreen('about')} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 12, cursor: 'pointer', padding: 6 }}>Backed by Harvard, WHO &amp; FDA guidance · not medical advice</button>
          </div>
          );
        })()}

        {/* ABOUT / EVIDENCE */}
        {screen === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Evidence & sources</div>
            </div>
            <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>
              Brim leans on public-health guidance, not opinions. A few principles shape every recipe:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Variety beats any single “superfood” — eat lots of colors.',
                'Whole fruit and vegetables come first; aim for plenty across the day.',
                'Blending keeps the fiber that straining throws away.',
                'Go easy on drinks high in natural sugars — a juice is an accent, not a meal.',
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px' }}>
                  <Info size={16} color={C.herb} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
            <Label>Where this comes from</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SOURCES.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.herb }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{s.note}</div>
                </a>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.55 }}>
              Brim’s ingredient suggestions are general, well-established food facts — not a diagnosis or treatment. A registered dietitian should review the mappings before any public launch. Not medical advice.
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {screen === 'settings' && (() => {
          const cardBox = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden' };
          const rowBase = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: C.ink };
          const Switch = ({ on }) => (
            <span style={{ width: 44, height: 26, borderRadius: 999, background: on ? C.herb : 'rgba(128,128,128,0.3)', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
              <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </span>
          );
          const Head = ({ children }) => <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: C.inkSoft, textTransform: 'uppercase', margin: '4px 2px 8px' }}>{children}</div>;
          const diet = [['vegan', 'Vegan', 'Skip honey & dairy'], ['dairyFree', 'Dairy-free', 'Swap milk & yogurt'], ['nutFree', 'Nut-free', 'No almond milk or nuts']];
          const prefs = [
            { on: dark, label: 'Dark mode', sub: 'Easier on late-night eyes', toggle: toggleDark },
            { on: wholePref, label: 'Prefer whole-food versions', sub: 'Lead with the no-blender snack', toggle: () => { const v = !wholePref; setWholePref(v); persistSettings({ wholePref: v }); } },
          ];
          const wi = weather.ok ? wmoInfo(weather.code) : null;
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Settings</div>
            </div>

            {/* Location & weather */}
            <div>
              <Head>Location &amp; weather</Head>
              <div style={cardBox}>
                <div style={{ ...rowBase, cursor: 'default' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{wi ? wi[1] : '📍'}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>
                        {weather.ok ? `${weather.tempC}°C · ${wi[0]}` : weather.status === 'loading' ? 'Locating…' : 'Location off'}
                      </span>
                      <span style={{ display: 'block', fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
                        {weather.ok ? (weather.city || 'Current location') : weather.status === 'denied' ? 'Permission blocked in your browser' : 'Powers Surprise me & daily picks'}
                      </span>
                    </span>
                  </span>
                  <button onClick={fetchWeather} style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: C.herb, cursor: 'pointer', flexShrink: 0 }}>{weather.ok ? 'Refresh' : 'Enable'}</button>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 8 }}>Brim uses your approximate location only to read local weather and tailor suggestions. It’s stored on this device and never shared.</div>
            </div>

            {/* Dietary needs */}
            <div>
              <Head>Dietary needs</Head>
              <div style={cardBox}>
                {diet.map(([k, lbl, sub], i) => (
                  <button key={k} onClick={() => { const np = { ...profile, [k]: !profile[k] }; setProfile(np); persist('brim-profile', np); buzz(8); }} style={{ ...rowBase, borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                    <span><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{lbl}</span><span style={{ display: 'block', fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{sub}</span></span>
                    <Switch on={profile[k]} />
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 8 }}>Brim automatically swaps ingredients to fit these whenever it builds a drink.</div>
            </div>

            {/* Taste */}
            <div>
              <Head>Taste — skip these</Head>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {DISLIKES.map((d) => {
                  const on = profile.dislikes.includes(d.key);
                  return <button key={d.key} className="chip" data-on={on} onClick={() => { const ds = on ? profile.dislikes.filter((x) => x !== d.key) : [...profile.dislikes, d.key]; const np = { ...profile, dislikes: ds }; setProfile(np); persist('brim-profile', np); }}>{d.label}</button>;
                })}
              </div>
              <input
                value={profile.customDislikes || ''}
                onChange={(e) => { const np = { ...profile, customDislikes: e.target.value.slice(0, 120) }; setProfile(np); persist('brim-profile', np); }}
                placeholder="Anything else? e.g. kale, pineapple, too sweet"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 14.5, fontFamily: 'inherit', outline: 'none' }}
              />
              <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 8 }}>Type ingredients or flavors to avoid, separated by commas. Brim leaves these out and swaps in something else.</div>
            </div>

            {/* Experience */}
            <div>
              <Head>Experience</Head>
              <div style={cardBox}>
                {prefs.map((r, i) => (
                  <button key={i} onClick={r.toggle} style={{ ...rowBase, borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                    <span><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{r.label}</span><span style={{ display: 'block', fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{r.sub}</span></span>
                    <Switch on={r.on} />
                  </button>
                ))}
              </div>
            </div>

            {/* Reminders */}
            <div>
              <Head>Daily reminder</Head>
              <div style={cardBox}>
                <button onClick={() => saveReminder(!reminderOn, reminderHour)} style={rowBase}>
                  <span><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Daily check-in</span><span style={{ display: 'block', fontSize: 12, color: C.inkSoft, marginTop: 2 }}>A gentle “how do you feel?” nudge</span></span>
                  <Switch on={reminderOn} />
                </button>
                {reminderOn && (
                  <div style={{ ...rowBase, cursor: 'default', borderTop: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 14.5 }}>Remind me at</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => saveReminder(true, Math.max(5, reminderHour - 1))} style={stepBtn()}><Minus size={14} /></button>
                      <span style={{ fontWeight: 700, minWidth: 52, textAlign: 'center' }}>{reminderHour}:00</span>
                      <button onClick={() => saveReminder(true, Math.min(22, reminderHour + 1))} style={stepBtn()}><Plus size={14} /></button>
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 8 }}>In this prototype the check-in appears as an in-app banner when you return. A shipped app would also send a system notification.</div>
            </div>

            {/* Wellbeing */}
            <div>
              <Head>Wellbeing</Head>
              <div style={{ ...cardBox, padding: '14px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Last night’s sleep</div>
                <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 3, lineHeight: 1.5 }}>Optional — Brim factors this in instead of reading a health app.{sleepNote ? ` Currently: ${sleepNote}.` : ''}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {['Great', 'Okay', 'Rough', 'Barely any'].map((s) => (
                    <button key={s} className="chip" data-on={sleepNote === s} onClick={() => { const v = sleepNote === s ? '' : s; setSleepNote(v); if (v && /rough|barely/i.test(v)) setFeelText((p) => p && /sleep/i.test(p) ? p : (p ? p + ', ' : '') + 'didn’t sleep well'); }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* More */}
            <div>
              <Head>More</Head>
              <div style={cardBox}>
                {[
                  { ic: <CalendarDays size={18} color={C.herb} />, label: 'Plan my days', sub: aiPlan ? `${aiPlan.days}-day plan saved` : 'AI multi-day plan · Pro', go: () => setScreen('planner') },
                  { ic: <Mail size={18} color={C.herb} />, label: 'Tips', sub: unreadTips ? `${unreadTips} new` : 'Science-backed notes', go: () => setScreen('tips'), badge: unreadTips },
                  { ic: <Users size={18} color={C.herb} />, label: 'Community', sub: 'What others are making', go: () => setScreen('community') },
                  { ic: <Sparkles size={18} color={C.herb} />, label: pro ? 'Brim Pro' : 'Get Brim Pro', sub: pro ? 'Active — thank you' : '$2.99/mo · unlimited saves & tips', go: () => pro ? flash('Pro is active') : setShowPaywall(true) },
                  { ic: <Heart size={18} color={C.herb} />, label: 'Invite a friend', sub: `You both get a month of Pro · ${refCode}`, go: referFriend },
                  { ic: <BookOpen size={18} color={C.herb} />, label: 'Evidence & sources', sub: 'Harvard, WHO & FDA guidance', go: () => setScreen('about') },
                ].map((r, i) => (
                  <button key={i} onClick={r.go} style={{ ...rowBase, borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{r.ic}<span><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{r.label}</span><span style={{ display: 'block', fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{r.sub}</span></span></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.badge ? <span style={{ background: '#E8533F', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{r.badge}</span> : null}
                      <ChevronRight size={18} color={C.inkSoft} />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 11.5, color: C.inkSoft, lineHeight: 1.6, marginTop: 4 }}>Brim · prototype build<br />Not medical advice. For wellbeing, not treatment.</div>
          </div>
          );
        })()}

        {/* HISTORY */}
        {screen === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>History</div>
            </div>
            {insight && <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', fontSize: 14, color: C.ink }}>Your most common feeling lately is <b>{insight.label}</b> ({insight.n}×). {insight.n >= 4 ? 'Worth a closer look if it lingers.' : ''}</div>}
            {history.length === 0 ? (
              <div style={{ color: C.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 }}>No history yet. Build a juice to start.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '10px 14px' }}>
                    <div><div style={{ fontSize: 14.5, fontWeight: 700 }}>{h.name}</div><div style={{ fontSize: 12, color: C.inkSoft }}>{h.userText || h.feelings.map((f) => byKey(f).label).join(' · ')}</div></div>
                    <div style={{ fontSize: 12, color: C.inkSoft, whiteSpace: 'nowrap' }}>{new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELECT */}
        {screen === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>Tell Brim about your day</div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Label>How are you feeling?</Label>
                <button onClick={startVoice} title="Speak" style={{ display: 'flex', alignItems: 'center', gap: 5, background: listening ? C.herb : 'none', color: listening ? '#fff' : C.herb, border: `1px solid ${listening ? C.herb : C.line}`, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Mic size={13} /> {listening ? 'Listening…' : 'Speak'}</button>
              </div>
              <textarea
                value={feelText}
                onChange={(e) => setFeelText(e.target.value.slice(0, 500))}
                placeholder="e.g. didn't sleep, eyes hurt from screens, a bit wired…"
                rows={2}
                style={{ width: '100%', marginTop: 8, padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
              />
            </div>

            <div>
              <Label>Anything you don’t like?</Label>
              <textarea
                value={dislikeText}
                onChange={(e) => setDislikeText(e.target.value)}
                placeholder="e.g. banana, ginger, too sweet…"
                rows={1}
                style={{ width: '100%', marginTop: 8, padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
              />
            </div>

            <div>
              <Label>How rough is it?</Label>
              <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 4, marginTop: 8 }}>
                {[['gentle', 'Gentle'], ['standard', 'Standard'], ['strong', 'Strong']].map(([k, lbl]) => (
                  <button key={k} className="seg" data-on={intensity === k} onClick={() => setIntensity(k)}>{lbl}</button>
                ))}
              </div>
            </div>

            <button style={{ ...primaryBtn(), opacity: analyzing ? 0.6 : 1 }} disabled={analyzing} onClick={generateRecs}>{analyzing ? 'Analyzing…' : (feelText.trim() ? 'Suggest drinks' : 'Surprise me')} <ArrowRight size={17} /></button>

            {analyzing && (
              <div role="status" aria-live="polite" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="spinner" />
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>Analyzing your day…</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {['Reading how you feel', 'Matching ingredients & nutrients', 'Factoring in the time of day', 'Skipping what you dislike'].map((t, i) => (
                    <div key={i} className="analyze-line" style={{ animationDelay: `${i * 0.3}s`, fontSize: 13, color: C.inkSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={13} color={C.herb} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!analyzing && recs.length > 0 && (() => {
              const head = recs[0]; const rest = recs.slice(1); const f = byKey(head.key);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Label>Your drink for the day</Label>
                    <button onClick={generateRecs} style={{ background: 'none', border: 'none', color: C.herb, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}><Shuffle size={13} /> Re-analyze</button>
                  </div>
                  <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.line}` }}>
                    <div style={{ background: `linear-gradient(150deg, ${f.gradient[0]}, ${f.gradient[1]})`, padding: '20px 18px', color: readableOn(f.gradient[1]) }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, letterSpacing: 1 }}>RECOMMENDED</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, background: 'rgba(0,0,0,0.10)', borderRadius: 999, padding: '2px 8px' }}><Sparkles size={10} /> AI</div>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>{f.juiceName}</div>
                      <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 6, lineHeight: 1.5 }}>{head.why}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {f.snack && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.10)', borderRadius: 999, padding: '3px 10px' }}>🥗 No-blender option</span>}
                        {trend[head.key] ? <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.10)', borderRadius: 999, padding: '3px 10px' }}>🔥 {trend[head.key]} made this week</span> : null}
                      </div>
                    </div>
                    <button onClick={() => buildOne(head.key)} style={{ width: '100%', background: C.card, border: 'none', borderTop: `1px solid ${C.line}`, padding: '14px', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: darkenForText(f.gradient[1]), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Make this <ArrowRight size={16} />
                    </button>
                  </div>

                  {rest.length > 0 && <Label>Other options</Label>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rest.map((r) => {
                      const rf = byKey(r.key);
                      return (
                        <button key={r.key} onClick={() => buildOne(r.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                          <span style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(150deg, ${rf.gradient[0]}, ${rf.gradient[1]})`, flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C.ink }}>{rf.juiceName}</span>
                            <span style={{ display: 'block', fontSize: 12.5, color: C.inkSoft, marginTop: 1 }}>for “{rf.label}”</span>
                          </span>
                          <ArrowRight size={16} color={C.inkSoft} />
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {!analyzing && recs.length === 0 && (
              <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>Type how you feel above and tap <b>{feelText.trim() ? 'Suggest drinks' : 'Surprise me'}</b> — Brim weighs your words, the time of day, and your filters, then picks a drink for the day and explains why.</div>
            )}

            <button onClick={() => setScreen('settings')} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: C.inkSoft, fontSize: 12.5, padding: '4px 0 8px' }}>Filters: {profileSummary()} — edit</button>
          </div>
        )}

        {/* RESULT */}
        {screen === 'result' && juice && (() => {
          const q = juice.primaryKey ? byKey(juice.primaryKey).quotes[(makeCounts[juice.name] || 0) % 5] : null;
          const mc = makeCounts[juice.name] || 0;
          return (
          <div style={{ paddingTop: 4 }}>
            {wholePref && byKey(juice.primaryKey) && byKey(juice.primaryKey).snack && (
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>🥗 You prefer whole-food versions — scroll to <b>“No blender? Chew it instead”</b> for the 2-minute snack.</div>
            )}
            <JuiceView juice={juice} editable onResolve={onResolve} onFullSteps={(m) => setFullSteps(m)} madeCount={mc} />
            {q && <div style={{ textAlign: 'center', fontStyle: 'italic', color: C.inkSoft, fontSize: 13.5, marginTop: 16, lineHeight: 1.5, maxWidth: 320, marginInline: 'auto' }}>“{q}”</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button style={primaryBtn(juice.gradient[1])} onClick={() => openCard(juice, resolvedLive)}><Share2 size={16} /> Make a share card</button>
              <button style={ghostBtn} onClick={saveJuice}><Bookmark size={16} /> Save to my shelf</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={ghostBtn} onClick={() => setRatingFor(juice.name)}><Star size={15} /> Rate it</button>
                <button style={ghostBtn} onClick={() => postToCommunity(juice)}><Users size={15} /> Share to feed</button>
              </div>
              <button style={ghostBtn} onClick={() => { setRecs([]); setScreen('select'); }}><RotateCcw size={15} /> Feel something else</button>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 13, padding: 8, cursor: 'pointer' }}>Back home</button>
            </div>
          </div>
          );
        })()}

        {/* SAVED */}
        {screen === 'saved' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>My shelf</div>
            </div>
            {saved.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 50, gap: 16 }}>
                <div style={{ color: C.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>Nothing here yet.<br />Build a juice and save it to keep it.</div>
                <button onClick={() => { setRecs([]); setScreen('select'); }} style={{ background: C.herb, color: '#fff', border: 'none', borderRadius: 14, padding: '12px 24px', cursor: 'pointer', fontSize: 14.5, fontWeight: 700 }}>Find a drink</button>
              </div>
            ) : (
              <>
                <button style={ghostBtn} onClick={() => { setChecked({}); setScreen('grocery'); }}><ShoppingCart size={16} /> Make grocery list</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...saved].sort((a, b) => (favorites.includes(b.id) ? 1 : 0) - (favorites.includes(a.id) ? 1 : 0)).map((s) => {
                    const fav = favorites.includes(s.id); const rt = ratings[s.name]; const mc = makeCounts[s.name] || 0;
                    return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${fav ? C.herb : C.line}`, borderRadius: 16, padding: '12px 14px' }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(150deg, ${s.gradient[0]}, ${s.gradient[1]})`, flexShrink: 0 }} />
                      <button onClick={() => setViewing(s)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', flex: 1, padding: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{s.name}</div>
                        <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{rt ? '★'.repeat(rt.stars) + '☆'.repeat(5 - rt.stars) : s.feelingLabels.join(' · ')}{mc ? ` · made ${mc}×` : ''}</div>
                      </button>
                      <button onClick={() => toggleFavorite(s.id)} title="Favorite" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: fav ? '#E8A93F' : C.inkSoft, display: 'flex' }}><Star size={17} fill={fav ? '#E8A93F' : 'none'} /></button>
                      <button onClick={() => rebuild(s)} title="Rebuild" style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 999, cursor: 'pointer', padding: 6, color: C.herb, display: 'flex' }}><RotateCcw size={15} /></button>
                      <button onClick={() => removeJuice(s.id)} style={{ background: 'none', border: 'none', color: '#B23A57', cursor: 'pointer', padding: 6 }}><Trash2 size={16} /></button>
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* GROCERY */}
        {screen === 'grocery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen(saved.length ? 'saved' : 'home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Grocery list</div>
            </div>
            {grocery.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.inkSoft, marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <ShoppingCart size={36} color={C.line} />
                <div style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 260 }}>Your grocery list builds itself from drinks you save. Save a few and the ingredients show up here, combined.</div>
                <button style={{ ...primaryBtn(), maxWidth: 260 }} onClick={() => { setRecs([]); setScreen('select'); }}>Find a drink <ArrowRight size={16} /></button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.inkSoft }}>Everything across your {saved.length} saved {saved.length === 1 ? 'juice' : 'juices'}, combined.</div>
                <button style={ghostBtn} onClick={() => exportGrocery(grocery, 'Brim grocery list')}><Copy size={16} /> Copy for Reminders / Notes</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grocery.map((g) => {
                    const on = checked[g.name];
                    return (
                      <button key={g.name} onClick={() => setChecked((c) => ({ ...c, [g.name]: !c[g.name] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${on ? C.herb : 'rgba(28,26,23,0.25)'}`, background: on ? C.herb : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Check size={14} color="#fff" />}</span>
                        <span style={{ flex: 1 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.5 : 1 }}>{g.name}</span>
                          <span style={{ display: 'block', fontSize: 11.5, color: C.inkSoft }}>for {g.from.join(', ')}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* RESETS BROWSE */}
        {screen === 'resets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Multi-day resets</div>
            </div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>A short run of feel-good drinks with one easy daily habit. These aren’t cleanses — keep eating normal meals.</div>
            {RESETS.map((p) => {
              const active = activeReset && activeReset.planId === p.id;
              return (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${active ? C.herb : C.line}`, borderRadius: 16, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{p.length} days</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 6 }}>{p.blurb}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    {p.days.map((d, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: `linear-gradient(90deg, ${byKey(d.feel).gradient[0]}, ${byKey(d.feel).gradient[1]})` }} />)}
                  </div>
                  <button style={{ ...primaryBtn(active ? C.herb : undefined), marginTop: 14 }} onClick={() => (active ? (setPlanId(p.id), setScreen('reset')) : startReset(p.id))}>
                    {active ? <>Continue <ChevronRight size={16} /></> : <><Play size={15} /> Start this reset</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* RESET DETAIL */}
        {screen === 'reset' && planId && byReset(planId) && (() => {
          const plan = byReset(planId);
          const isActive = activeReset && activeReset.planId === planId;
          const done = isActive ? activeReset.done : [];
          const allDone = done.length === plan.length;
          // which day are we on (by elapsed days since start), and did we miss one?
          const elapsed = isActive ? Math.floor((Date.now() - new Date(activeReset.startDate).getTime()) / 86400000) : 0;
          const todayIdx = Math.min(plan.length - 1, elapsed);
          const missed = isActive && !allDone && elapsed > 0 && !done.includes(elapsed - 1) && done.length < elapsed;
          const pct = Math.round((done.length / plan.length) * 100);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: '90vh' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={() => setScreen('resets')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{plan.name}</div>
              </div>

              {/* progress bar (#14) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}><span>{done.length} of {plan.length} days</span><span>{pct}%</span></div>
                <div style={{ height: 8, borderRadius: 999, background: C.line, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: C.herb, transition: 'width .3s' }} /></div>
              </div>

              {/* celebration (#14) */}
              {allDone && (
                <div style={{ background: `linear-gradient(150deg, ${C.herb}, #6E54B0)`, color: '#fff', borderRadius: 18, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 30 }}>🎉</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Reset complete</div>
                  <div style={{ fontSize: 13.5, opacity: 0.92, marginTop: 4 }}>You showed up {plan.length} days running. How do you feel?</div>
                  <button onClick={() => setRatingFor(plan.name)} style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reflect</button>
                </div>
              )}

              {/* catch-up (#5) */}
              {missed && (
                <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Missed a day? Life happens.</div>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, lineHeight: 1.5 }}>You’ve done {done.length}. Pick up today, or shift the start so nothing’s “behind.”</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button onClick={() => openDayDrink(plan.days[todayIdx].feel)} style={{ flex: 1, background: C.herb, color: '#fff', border: 'none', borderRadius: 999, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Make today’s</button>
                    <button onClick={() => { const ar = { ...activeReset, startDate: new Date(Date.now() - done.length * 86400000).toISOString() }; setActiveReset(ar); persist('brim-active-reset', ar); flash('Schedule shifted'); }} style={{ flex: 1, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Shift by a day</button>
                  </div>
                </div>
              )}

              {isActive && !allDone && <div style={{ fontSize: 12.5, color: C.inkSoft, display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={13} /> {reminderOn ? `Daily check-in on at ${reminderHour}:00.` : 'Turn on daily check-ins in Settings to stay on track.'}</div>}

              <button style={ghostBtn} onClick={() => { setPlanChecked({}); setScreen('planGrocery'); }}><ShoppingCart size={16} /> Shopping list for this plan</button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.days.map((d, i) => {
                  const f = byKey(d.feel);
                  const isDone = done.includes(i);
                  const isToday = isActive && i === todayIdx && !isDone;
                  return (
                    <div key={i} style={{ background: C.card, border: `1px solid ${isToday ? C.herb : C.line}`, borderRadius: 16, padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => isActive && toggleDay(i)} style={{ width: 26, height: 26, borderRadius: 999, border: `1.5px solid ${isDone ? C.herb : 'rgba(28,26,23,0.25)'}`, background: isDone ? C.herb : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isActive ? 'pointer' : 'default', flexShrink: 0 }}>{isDone && <Check size={15} color="#fff" />}</button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: isToday ? C.herb : C.inkSoft, fontWeight: 700 }}>DAY {i + 1}{isToday ? ' · TODAY' : ''}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: f.gradient[1] }}>{f.juiceName}</div>
                        </div>
                        <button onClick={() => openDayDrink(d.feel)} style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C.ink }}>Recipe</button>
                      </div>
                      <div style={{ fontSize: 13, color: C.ink, opacity: 0.8, marginTop: 10, paddingLeft: 38, lineHeight: 1.5 }}><b style={{ fontWeight: 700 }}>Today’s habit:</b> {d.habit}</div>
                    </div>
                  );
                })}
              </div>

              {isActive && <button onClick={abandonReset} style={{ background: 'none', border: 'none', color: '#B23A57', fontSize: 13, padding: 10, cursor: 'pointer' }}>End this reset</button>}
            </div>
          );
        })()}

        {/* PLAN GROCERY */}
        {screen === 'planGrocery' && planId && byReset(planId) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('reset')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Plan shopping list</div>
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft }}>Everything for {byReset(planId).name}, fitted to your filters.</div>
            <button style={ghostBtn} onClick={() => exportGrocery(planGrocery, byReset(planId).name + ' — shopping list')}><Copy size={16} /> Copy for Reminders / Notes</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {planGrocery.map((g) => {
                const on = planChecked[g.name];
                return (
                  <button key={g.name} onClick={() => setPlanChecked((c) => ({ ...c, [g.name]: !c[g.name] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${on ? C.herb : 'rgba(28,26,23,0.25)'}`, background: on ? C.herb : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Check size={14} color="#fff" />}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.5 : 1 }}>{g.name}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: C.inkSoft }}>{g.from.join(', ')}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SAVED PLANS LIST */}
        {screen === 'savedplans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>My saved plans</div>
            </div>
            {savedPlans.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.inkSoft, marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <CalendarDays size={36} color={C.line} />
                <div style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 260 }}>No saved plans yet. Generate a plan, tap Save, and pick how long to keep it.</div>
                <button style={{ ...primaryBtn(), maxWidth: 260 }} onClick={() => setScreen('planner')}><Sparkles size={16} /> Make a plan</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>Tap a plan to open it and make any day’s drink. Plans with an expiry are removed automatically once they lapse.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {savedPlans.map((p) => {
                    const f0 = byKey(p.plan[0].key); const exp = expiryLabel(p.expiresAt);
                    const soon = p.expiresAt && (new Date(p.expiresAt).getTime() - Date.now()) < 3 * 86400000;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px' }}>
                        <button onClick={() => openSavedPlan(p)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                          <span style={{ width: 48, height: 48, borderRadius: 13, background: `linear-gradient(150deg, ${f0.gradient[0]}, ${f0.gradient[1]})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: readableOn(f0.gradient[1]), fontWeight: 800, fontSize: 15 }}>{p.days}d</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.purpose}</span>
                            <span style={{ display: 'block', fontSize: 12, color: C.inkSoft, marginTop: 1 }}>{p.days}-day plan · saved {new Date(p.savedAt).toLocaleDateString()}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: p.expiresAt ? (soon ? '#C0392B' : C.inkSoft) : C.herb, marginTop: 4, fontWeight: p.expiresAt ? 600 : 700 }}>{p.expiresAt ? <Clock size={11} /> : <Star size={11} fill={C.herb} />}{exp}</span>
                          </span>
                        </button>
                        <button onClick={() => deleteSavedPlan(p.id)} title="Delete" style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 999, padding: 8, cursor: 'pointer', color: C.inkSoft, display: 'flex', flexShrink: 0 }}><Trash2 size={15} /></button>
                      </div>
                    );
                  })}
                </div>
                <button style={{ ...ghostBtn, marginTop: 4 }} onClick={() => setScreen('planner')}><Sparkles size={16} /> Make a new plan</button>
              </>
            )}
          </div>
        )}

        {/* AI PLANNER (Pro) */}
        {screen === 'planner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>Plan my days <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: C.herb, color: readableOn(C.herb), borderRadius: 999, padding: '3px 8px' }}>PRO</span></div>
            </div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.55 }}>Tell Brim how long and what for. AI builds a day-by-day plan from {FEELINGS.length} drinks and explains why each one made the cut.</div>

            {/* days */}
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>How many days?</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setPlanDays((d) => Math.max(3, d - 1))} style={stepBtn()}><Minus size={14} /></button>
                <span style={{ fontWeight: 800, minWidth: 56, textAlign: 'center', fontSize: 15 }}>{planDays} days</span>
                <button onClick={() => setPlanDays((d) => Math.min(14, d + 1))} style={stepBtn()}><Plus size={14} /></button>
              </span>
            </div>

            {/* purpose */}
            <div>
              <Label>What’s the goal?</Label>
              <input value={planPurpose} onChange={(e) => setPlanPurpose(e.target.value.slice(0, 80))} placeholder="e.g. better sleep, glowing skin, marathon prep" style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {PURPOSE_CHIPS.map((p) => <button key={p} className="chip" data-on={planPurpose === p} onClick={() => setPlanPurpose(p)}>{p}</button>)}
              </div>
            </div>

            <button style={{ ...primaryBtn(), opacity: planBusy ? 0.7 : 1 }} disabled={planBusy} onClick={generatePlan}>
              {planBusy ? <><span className="spinner" /> Building your plan…</> : <><Sparkles size={17} /> {aiPlan ? 'Regenerate plan' : 'Generate plan'}</>}
            </button>
            {!pro && <div style={{ fontSize: 11.5, color: C.inkSoft, textAlign: 'center', marginTop: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Sparkles size={11} /> Free preview · Plans become a Pro feature soon</div>}

            {/* result */}
            {aiPlan && !planBusy && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Sparkles size={14} color={C.herb} /><span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, color: C.herb, textTransform: 'uppercase' }}>Your {aiPlan.days}-day plan · {aiPlan.purpose}</span></div>
                  <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, marginTop: 8 }}>{aiPlan.intro}</div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 8 }}>{aiPlan.source === 'ai' ? 'Personalized by Claude AI' : 'Built for your goal'}</div>
                </div>
                {aiPlan.plan.map((d) => { const f = byKey(d.key); if (!f) return null; return (
                  <button key={d.day} onClick={() => buildOne(d.key)} style={{ display: 'flex', alignItems: 'stretch', gap: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden' }}>
                    <span style={{ width: 60, flexShrink: 0, background: `linear-gradient(160deg, ${f.gradient[0]}, ${f.gradient[1]})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: readableOn(f.gradient[1]) }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, opacity: 0.8 }}>DAY</span>
                      <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{d.day}</span>
                    </span>
                    <span style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 15.5, fontWeight: 800 }}>{f.juiceName}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: C.herb, fontWeight: 700, flexShrink: 0 }}>Make <ArrowRight size={13} /></span>
                      </span>
                      <span style={{ display: 'block', fontSize: 12.5, color: C.inkSoft, marginTop: 3, lineHeight: 1.45 }}>{d.why}</span>
                    </span>
                  </button>
                ); })}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={primaryBtn()} onClick={() => setShowSavePlan(true)}><Bookmark size={16} /> Save plan</button>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={ghostBtn} onClick={exportPlan}><Copy size={16} /> Copy plan</button>
                  <button style={ghostBtn} onClick={() => { setAiPlan(null); persist('brim-aiplan', null); }}><Trash2 size={16} /> Clear</button>
                </div>
                {!pro && (
                  <button onClick={() => setShowPaywall(true)} style={{ textAlign: 'left', background: `linear-gradient(135deg, ${C.herb}, #6E54B0)`, color: '#fff', border: 'none', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <Sparkles size={20} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 14.5, fontWeight: 800 }}>Keep planning with Pro</span><span style={{ display: 'block', fontSize: 12, opacity: 0.92, marginTop: 2 }}>Unlimited AI plans, saved to your shelf</span></span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            )}
            {!aiPlan && !planBusy && (
              <div style={{ textAlign: 'center', color: C.inkSoft, fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>Pick your days and goal, then generate.<br />Brim will choose a drink for each day and tell you why.</div>
            )}

            {/* saved plans */}
            {savedPlans.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <Label>Saved plans</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {savedPlans.map((p) => {
                    const exp = expiryLabel(p.expiresAt); const soon = p.expiresAt && (new Date(p.expiresAt).getTime() - Date.now()) < 3 * 86400000;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px' }}>
                        <button onClick={() => openSavedPlan(p)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                          <span style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(150deg, ${byKey(p.plan[0].key).gradient[0]}, ${byKey(p.plan[0].key).gradient[1]})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: readableOn(byKey(p.plan[0].key).gradient[1]), fontWeight: 800, fontSize: 14 }}>{p.days}d</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.purpose}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: p.expiresAt ? (soon ? '#C0392B' : C.inkSoft) : C.herb, marginTop: 2, fontWeight: p.expiresAt ? 400 : 700 }}>{p.expiresAt ? <Clock size={11} /> : <Star size={11} fill={C.herb} />}{exp}</span>
                          </span>
                        </button>
                        <button onClick={() => deleteSavedPlan(p.id)} title="Delete" style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 999, padding: 7, cursor: 'pointer', color: C.inkSoft, display: 'flex', flexShrink: 0 }}><Trash2 size={14} /></button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 8, lineHeight: 1.5 }}>Plans with an expiry are removed automatically once they lapse. Permanent plans are a Pro perk.</div>
              </div>
            )}
          </div>
        )}

        {/* CUSTOM BUILDER (#27) */}
        {screen === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Build your own</div>
            </div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>Pick 2–6 from {PANTRY.length} ingredients — fruits, veg, greens, boosters, a base. Brim turns them into a blend with steps. {!pro && <span style={{ color: C.herb, fontWeight: 700 }}>Pro saves unlimited custom blends.</span>}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <input value={customName} onChange={(e) => setCustomName(e.target.value.slice(0, 30))} placeholder="Name it, or tap ✨" style={{ flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
              <button type="button" onClick={() => { buzz(8); setCustomName(suggestBlendName(customPick)); }} title="Suggest a name" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: C.panel, color: C.herb, border: `1px solid ${C.line}`, borderRadius: 14, padding: '0 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}><Sparkles size={15} /> Suggest</button>
            </div>
            {CAT_ORDER.map((cat) => (
              <div key={cat}>
                <Label>{CAT_LABELS[cat]}</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {CUSTOM_POOL.filter((p) => p.cat === cat).map((p) => {
                    const blocked = violates(p, profile); const on = customPick.includes(p.name);
                    return (
                      <button key={p.name} disabled={blocked} title={`rich in ${p.richIn}`} onClick={() => { buzz(8); setCustomPick((prev) => prev.includes(p.name) ? prev.filter((x) => x !== p.name) : (prev.length >= 6 ? prev : [...prev, p.name])); }} style={{ background: on ? C.herb : C.card, color: on ? '#fff' : C.ink, border: `1px solid ${on ? C.herb : C.line}`, borderRadius: 999, padding: '8px 13px', fontSize: 13, fontWeight: 600, cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.35 : 1 }}>{p.name}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            {customPick.length > 0 && <div style={{ fontSize: 12.5, color: C.inkSoft }}>Picked: {customPick.join(' · ')}</div>}
            <div style={{ position: 'sticky', bottom: 12, paddingTop: 6 }}>
              <button style={{ ...primaryBtn(), opacity: customPick.length < 2 ? 0.6 : 1 }} disabled={customPick.length < 2} onClick={makeCustom}>Blend {customPick.length ? `(${customPick.length})` : ''} <ArrowRight size={17} /></button>
            </div>
          </div>
        )}

        {/* STATS DASHBOARD (#22) */}
        {screen === 'stats' && (() => {
          const total = Object.values(makeCounts).reduce((a, b) => a + b, 0);
          const fav = Object.entries(makeCounts).sort((a, b) => b[1] - a[1])[0];
          const tally = {}; history.forEach((h) => h.feelings.forEach((f) => { tally[f] = (tally[f] || 0) + 1; }));
          const topFeel = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
          const rated = Object.values(ratings);
          const avgStars = rated.length ? (rated.reduce((a, r) => a + r.stars, 0) / rated.length).toFixed(1) : null;
          const last7 = Array.from({ length: 7 }).map((_, i) => { const d = new Date(Date.now() - (6 - i) * 86400000).toDateString(); return history.filter((h) => new Date(h.date).toDateString() === d).length; });
          const maxDay = Math.max(1, ...last7);
          const stat = (n, l) => (
            <div style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.herb }}>{n}</div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>{l}</div>
            </div>
          );
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Your stats</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>{stat(total, 'drinks made')}{stat(streak.current || 0, 'day streak')}{stat(streak.longest || 0, 'best streak')}</div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '16px 18px' }}>
              <Label>Last 7 days</Label>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 12 }}>
                {last7.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: '100%', height: `${(v / maxDay) * 70}px`, minHeight: v ? 6 : 2, background: v ? C.herb : C.line, borderRadius: 5 }} />
                    <span style={{ fontSize: 10, color: C.inkSoft }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(Date.now() - (6 - i) * 86400000).getDay()]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.inkSoft, fontSize: 13.5 }}>Most-made drink</span><span style={{ fontWeight: 700, fontSize: 13.5 }}>{fav ? `${fav[0]} (${fav[1]}×)` : '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.inkSoft, fontSize: 13.5 }}>Most-felt</span><span style={{ fontWeight: 700, fontSize: 13.5 }}>{topFeel ? byKey(topFeel[0]).label : '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.inkSoft, fontSize: 13.5 }}>Avg rating</span><span style={{ fontWeight: 700, fontSize: 13.5 }}>{avgStars ? `${avgStars} ★` : '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.inkSoft, fontSize: 13.5 }}>Saved drinks</span><span style={{ fontWeight: 700, fontSize: 13.5 }}>{saved.length}</span></div>
            </div>
            {total === 0 && <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: 'center', lineHeight: 1.6 }}>Make your first drink and your progress shows up here.</div>}
          </div>
          );
        })()}

        {/* COMMUNITY FEED (#12, #23) */}
        {screen === 'community' && (() => {
          const trendTop = Object.entries(trend).sort((a, b) => b[1] - a[1]).slice(0, 3);
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Community</div>
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>Anonymous and opt-in. Nothing here is tied to a name. Share from any recipe with “Share to feed.”</div>
            <button onClick={referFriend} style={{ textAlign: 'left', background: `linear-gradient(150deg, ${C.herb}, #6E54B0)`, color: '#fff', border: 'none', borderRadius: 18, padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Share2 size={20} />
              <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>Invite a friend</span><span style={{ display: 'block', fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>You both get a month of Pro · code {refCode}</span></span>
              <ChevronRight size={18} />
            </button>
            {trendTop.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '16px 18px' }}>
                <Label>Trending this week</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {trendTop.map(([k, v], i) => (
                    <button key={k} onClick={() => rebuildByKey(k)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: C.herb, width: 18 }}>{i + 1}</span>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(150deg, ${byKey(k).gradient[0]}, ${byKey(k).gradient[1]})` }} />
                      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>{byKey(k).juiceName}</span>
                      <span style={{ fontSize: 12.5, color: C.inkSoft }}>{v} made</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Label>Recent makes</Label>
            {community.length === 0 ? (
              <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>Nothing shared yet.<br />Be the first — share a drink from its recipe.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {community.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '10px 14px' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(150deg, ${c.grad[0]}, ${c.grad[1]})`, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Someone made <b>{c.name}</b></span>
                    <span style={{ fontSize: 11.5, color: C.inkSoft }}>{timeAgo(c.ts)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}

        {/* TIPS INBOX (#20) */}
        {screen === 'tips' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: C.ink, cursor: 'pointer', padding: 4 }}><ArrowLeft size={20} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Tips</div>
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>Short, source-based notes that unlock as you go. (In a full build these also arrive by email.)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tipsAvailable.length === 0 && <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: 'center', marginTop: 20 }}>Your first tip unlocks soon.</div>}
              {tipsAvailable.map((t) => {
                const read = tipsRead.includes(t.id);
                return (
                  <button key={t.id} onClick={() => markTip(t.id)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${read ? C.line : C.herb}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!read && <span style={{ width: 8, height: 8, borderRadius: 999, background: C.herb }} />}
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{t.title}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.55 }}>{t.body}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DAY DRINK MODAL */}
        {dayDrink && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', zIndex: 40, padding: '24px 16px' }}>
            <div style={{ width: '100%', maxWidth: 420, background: C.bg, borderRadius: 22, padding: '20px 18px 24px', position: 'relative' }}>
              <button onClick={() => setDayDrink(null)} style={{ position: 'absolute', top: 14, right: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 7, cursor: 'pointer', zIndex: 2 }}><X size={16} /></button>
              <JuiceView juice={dayDrink} editable />
              <button style={{ ...ghostBtn, marginTop: 16 }} onClick={() => setDayDrink(null)}>Close</button>
            </div>
          </div>
        )}

        {/* VIEW SAVED */}
        {viewing && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', zIndex: 30, padding: '24px 16px' }}>
            <div style={{ width: '100%', maxWidth: 420, background: C.bg, borderRadius: 22, padding: '20px 18px 24px', position: 'relative' }}>
              <button onClick={() => setViewing(null)} style={{ position: 'absolute', top: 14, right: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 7, cursor: 'pointer', zIndex: 2 }}><X size={16} /></button>
              <JuiceView juice={viewing} editable={false} madeCount={makeCounts[viewing.name] || 0} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <button style={primaryBtn(viewing.gradient[1])} onClick={() => rebuild(viewing)}><RotateCcw size={16} /> Rebuild this</button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={ghostBtn} onClick={() => { const n = viewing.name; setViewing(null); setRatingFor(n); }}><Star size={15} /> Rate</button>
                  <button style={ghostBtn} onClick={() => openCard(viewing)}><Share2 size={15} /> Share card</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CARD */}
        {cardJuice && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.66)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', zIndex: 50, padding: '22px 16px' }}>
            <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: C.bg, fontSize: 17, fontWeight: 700 }}>Your share card</div>
                <button onClick={() => { setCardJuice(null); setCardPhoto(null); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: C.bg, borderRadius: 999, padding: 8, cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: 4 }}>
                <button onClick={() => setSquare(false)} style={{ flex: 1, padding: 8, borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: !square ? C.bg : 'transparent', color: !square ? C.ink : C.bg }}>Portrait 4:5</button>
                <button onClick={() => setSquare(true)} style={{ flex: 1, padding: 8, borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: square ? C.bg : 'transparent', color: square ? C.ink : C.bg }}>Square 1:1</button>
              </div>
              {cardURL ? <img src={cardURL} alt={`${cardJuice.name} card`} style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.4)', display: 'block' }} /> : <div style={{ width: '100%', aspectRatio: square ? '1/1' : '4/5', borderRadius: 16, background: 'rgba(255,255,255,0.1)' }} />}
              {/* photo of the drink (#3) */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: cardPhoto ? 'rgba(255,255,255,0.16)' : C.bg, color: cardPhoto ? C.bg : C.ink, borderRadius: 12, padding: '11px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                <Camera size={16} /> {cardPhoto ? 'Change photo' : 'Add a photo of your drink'}
                <input type="file" accept="image/*" capture="environment" onChange={onPickCardPhoto} style={{ display: 'none' }} />
              </label>
              {cardPhoto && <button onClick={() => setCardPhoto(null)} style={{ background: 'none', border: 'none', color: 'rgba(246,243,233,0.8)', fontSize: 12.5, cursor: 'pointer', marginTop: -6 }}>Remove photo</button>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...ghostBtn, color: C.bg, borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setQuoteIdx((i) => i + 1)}><Shuffle size={15} /> New quote</button>
                <button style={primaryBtn(cardJuice.gradient[1])} onClick={downloadCard}><Download size={16} /> Download</button>
              </div>
              <div style={{ color: 'rgba(246,243,233,0.7)', fontSize: 12.5, textAlign: 'center', lineHeight: 1.5 }}>Snap your finished drink to put it right on the card. On a phone, press and hold the card to save it, then post it anywhere.</div>
            </div>
          </div>
        )}

        {/* ONBOARDING (#10) */}
        {onboard !== null && (
          <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 30px', maxWidth: 440, margin: '0 auto' }}>
            <div className="bob" style={{ filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.18))' }}><Glass gradient={['#FFE3B0', '#FF7A59']} level={72} garnish /></div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 5, marginTop: 26, color: C.ink }}>BRIM</div>
            <div style={{ fontSize: 15, color: C.inkSoft, marginTop: 12, lineHeight: 1.55, maxWidth: 300 }}>Tell Brim how you feel, and it finds the right drink for the moment.</div>
            <button style={{ ...primaryBtn(), marginTop: 32, maxWidth: 300 }} onClick={() => { setOnboard(null); setScreen('home'); window.history.replaceState(null, '', window.location.href); }}>Get started <ArrowRight size={17} /></button>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 14 }}>Taking you in…</div>
          </div>
        )}

        {/* RATING MODAL (#2) */}
        {ratingFor && (
          <RatingSheet name={ratingFor} existing={ratings[ratingFor]} onClose={() => setRatingFor(null)} onSubmit={submitRating} C={C} primaryBtn={primaryBtn} ghostBtn={ghostBtn} />
        )}

        {/* POST-SAVE SHEET (#9) */}
        {postSave && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 55 }} onClick={() => setPostSave(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: C.bg, borderRadius: '22px 22px 0 0', padding: '20px 18px 26px' }}>
              <div style={{ width: 38, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 18, fontWeight: 800 }}>Saved to your shelf</div>
              <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 4 }}>{postSave.name} — what next?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <button style={primaryBtn(postSave.gradient[1])} onClick={() => { const n = postSave.name; setPostSave(null); setRatingFor(n); }}><Star size={16} /> Rate how it tasted</button>
                <button style={ghostBtn} onClick={() => { setPostSave(null); setChecked({}); setScreen('grocery'); }}><ShoppingCart size={16} /> Add to grocery list</button>
                <button style={ghostBtn} onClick={() => { const p = postSave; setPostSave(null); openCard(p, p.resolved); }}><Share2 size={16} /> Make a share card</button>
                <button onClick={() => setPostSave(null)} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 13.5, padding: 10, cursor: 'pointer' }}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN STEPS (#34) */}
        {fullSteps && (
          <FullSteps steps={fullSteps} onClose={() => setFullSteps(null)} C={C} primaryBtn={primaryBtn} ghostBtn={ghostBtn} />
        )}

        {/* PRO PAYWALL (#19) */}
        {showPaywall && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 18 }} onClick={() => setShowPaywall(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: C.bg, borderRadius: 24, padding: '24px 22px', position: 'relative' }}>
              <button onClick={() => setShowPaywall(false)} style={{ position: 'absolute', top: 14, right: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 7, cursor: 'pointer' }}><X size={16} /></button>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: C.herb }}><Sparkles size={15} /> BRIM PRO</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10, letterSpacing: '-0.02em' }}>Go deeper for $2.99/mo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                {['Unlimited AI multi-day plans', 'Unlimited saved & custom blends', 'Weekly nutrition tips in your inbox', 'Early access to seasonal recipes'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Check size={18} color={C.herb} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: 14.5, lineHeight: 1.4 }}>{t}</span></div>
                ))}
              </div>
              <button style={{ ...primaryBtn(), marginTop: 22 }} onClick={unlockPro}>Start free trial</button>
              <div style={{ fontSize: 11.5, color: C.inkSoft, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>Demo only — this prototype can’t process real payments. Tapping unlocks Pro features locally.</div>
            </div>
          </div>
        )}


        {/* SAVE PLAN — choose expiry */}
        {showSavePlan && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,28,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 75 }} onClick={() => setShowSavePlan(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: C.bg, borderRadius: '24px 24px 0 0', padding: '22px 20px 30px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 18, fontWeight: 800 }}>Save this plan</div>
              <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, lineHeight: 1.5 }}>Choose how long to keep it. Plans with an expiry are deleted automatically when they lapse.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {[{ d: 7, l: '7 days' }, { d: 30, l: '30 days' }, { d: 90, l: '90 days' }].map((o) => (
                  <button key={o.d} onClick={() => savePlanWithExpiry(o.d)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', color: C.ink, fontSize: 15, fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Clock size={16} color={C.inkSoft} /> Keep for {o.l}</span>
                    <ChevronRight size={16} color={C.inkSoft} />
                  </button>
                ))}
                <button onClick={() => savePlanWithExpiry(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: pro ? `linear-gradient(135deg, ${C.herb}, #6E54B0)` : C.card, border: pro ? 'none' : `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', color: pro ? '#fff' : C.ink, fontSize: 15, fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Star size={16} fill={pro ? '#fff' : 'none'} color={pro ? '#fff' : C.inkSoft} /> Permanent</span>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, background: pro ? 'rgba(255,255,255,0.25)' : C.herb, color: pro ? '#fff' : readableOn(C.herb), borderRadius: 999, padding: '3px 8px' }}>PRO</span>
                </button>
              </div>
              <button onClick={() => setShowSavePlan(false)} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 13.5, padding: 12, cursor: 'pointer', width: '100%', marginTop: 4 }}>Cancel</button>
            </div>
          </div>
        )}

        {toast && <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', background: C.ink, color: C.bg, fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 999, zIndex: 90 }}>{toast}</div>}
      </div>
    </div>
  );
}
