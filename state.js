// ── SHARED STATE ──────────────────────────────────────────────────
// API URL - uses Vercel server for offline APK
const API_URL = 'https://masar-gym.vercel.app/api';
const DEFAULT = {
  tdee: 0, bmr: 0, goal: 'maintain', weight: 0, gender: 'M',
  plan: [], curDay: 0, wplan: null, curWDay: 0,
  prog: [], shop: [], shopChk: {},
  userprofile: { name: 'Guest', photo: null, provider: 'basic', email: '' },
  user: null, lang: 'en', theme: 'dark'
};

const STATE_KEY = 'masar';
const TOKEN_KEY = 'masar_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('masar_token'); // Legacy cleanup
};

function logout() {
  clearToken();
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem('masar'); // Legacy cleanup
  localStorage.removeItem('masar_user');
  localStorage.removeItem('masar_guest_mode');
  localStorage.removeItem('gym_os_state');
  location.href = 'login.html';
}

async function api(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  const token = getToken();
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_URL}${path}`, options);
    const text = await res.text();

    // Check if response is HTML (error page) instead of JSON
    if (text.trim().startsWith('<') && (text.includes('DOCTYPE') || text.includes('<html'))) {
      // Try to extract error message from HTML if possible
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const errorMsg = titleMatch ? titleMatch[1] : 'Server error: The backend may be down or misconfigured';
      throw new Error(errorMsg);
    }

    // Handle empty response
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server');
    }

    if (!res.ok) {
      try {
        const err = JSON.parse(text);
        throw new Error(err.error || err.message || 'api_error');
      } catch (e) {
        throw new Error(text || 'api_error');
      }
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('API Error:', err);
    // Re-throw with more context
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Network error: Please check your internet connection');
    }
    throw err;
  }
}

function loadState() {
  try {
    const d = localStorage.getItem(STATE_KEY);
    const s = d ? JSON.parse(d) : { ...DEFAULT };
    return { ...DEFAULT, ...s };
  } catch (e) { return { ...DEFAULT } }
}

async function fetchAndSaveState() {
  if (!getToken()) return;
  try {
    const data = await api('/data');
    const localData = loadState();
    // Merge: local data takes precedence over server data
    const s = { ...data, ...localData };
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
    return s;
  } catch (e) { console.error('Failed to fetch state', e); }
}

// Global page transition handler
document.addEventListener('click', function (e) {
  // Handle navigation links
  const link = e.target.closest('a');
  if (link && link.href && !link.href.startsWith('javascript') && !link.target) {
    // Add fade out effect before navigation
    document.body.classList.add('fade-out');
  }
});

// Handle browser back/forward buttons
window.addEventListener('pageshow', function (e) {
  document.body.classList.remove('fade-out');
  document.body.style.opacity = '1';
});

function saveState(s) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
    if (getToken()) {
      api('/data', 'POST', s).catch(e => console.error('Sync failed', e));
    }
  } catch (e) { }
}

function showToast(msg, dur = 2200) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), dur); }

function renderSidebarProfile() {
  const S = loadState();
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  let profileSection = document.querySelector('.sidebar-profile');
  if (S.user && S.userprofile) {
    if (!profileSection) {
      profileSection = document.createElement('div');
      profileSection.className = 'sidebar-profile active';
      const logo = sidebar.querySelector('.logo');
      if (logo) logo.insertAdjacentElement('afterend', profileSection);
      else sidebar.prepend(profileSection);
    }

    const up = S.userprofile;
    const initial = up.name.charAt(0).toUpperCase();
    // Sanitize user input to prevent XSS
    const sanitize = (str) => {
      const div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    };
    const safeName = sanitize(up.name);
    const safeEmail = sanitize(up.email || '');
    profileSection.innerHTML = `
      <div class="sidebar-avatar" style="${up.photo ? `background-image:url(${up.photo})` : ''}">${up.photo ? '' : initial}</div>
      <div class="sidebar-info">
        <div class="sidebar-name">${safeName}</div>
        <div class="sidebar-email">${safeEmail}</div>
      </div>
    `;
  } else if (profileSection) {
    profileSection.remove();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndSaveState();
  renderSidebarProfile();
  if (typeof applyTranslations === 'function') applyTranslations();
});


// ── CALC ─────────────────────────────────────────────────────────
function calcBMR(weight, height, age, gender) { return gender === 'M' ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age) : 447.593 + (9.247 * weight) + (3.098 * height) - (4.33 * age); }
function calcTDEE(bmr, activity, goal) { let t = bmr * parseFloat(activity); if (goal === 'loss') t -= 500; if (goal === 'gain') t += 300; return t; }

// ── ACTIVE NAV ────────────────────────────────────────────────────
function setActiveNav() { const cur = location.pathname.split('/').pop() || 'index.html'; document.querySelectorAll('.nav-item').forEach(a => { const href = a.getAttribute('href'); a.classList.toggle('active', href === cur || href === ('./' + cur)); }); }

// ── FOOD DATABASE ────────────────────────────────────────────────
const FOODS = {
  breakfast: [
    { n: "oatmeal_berries", e: "🥣", p: 15, c: 55, f: 12, components: [{ n: "oats", q: 60, u: "g" }, { n: "blueberries", q: 30, u: "g" }, { n: "walnuts", q: 10, u: "g" }, { n: "milk", q: 150, u: "ml" }] },
    { n: "scrambled_eggs", e: "🥑", p: 22, c: 30, f: 20, components: [{ n: "eggs", q: 2, u: "pcs" }, { n: "avocado", q: 50, u: "g" }, { n: "whole_bread", q: 1, u: "slice" }] },
    { n: "greek_yogurt", e: "🥝", p: 18, c: 45, f: 6, components: [{ n: "greek_yogurt", q: 150, u: "g" }, { n: "kiwi", q: 1, u: "pc" }, { n: "honey", q: 10, u: "g" }, { n: "granola", q: 20, u: "g" }] },
    { n: "pancakes_strawberries", e: "🥞", p: 12, c: 60, f: 8, components: [{ n: "oat_flour", q: 50, u: "g" }, { n: "egg_whites", q: 2, u: "pcs" }, { n: "strawberries", q: 40, u: "g" }, { n: "maple_syrup", q: 10, u: "ml" }] },
    { n: "ful_medames", e: "🫘", p: 20, c: 35, f: 10, components: [{ n: "fava_beans", q: 150, u: "g" }, { n: "olive_oil", q: 5, u: "ml" }, { n: "tahini", q: 10, u: "g" }, { n: "pita_bread", q: 0.5, u: "loaf" }] },
    { n: "salmon_bagel", e: "🐟", p: 25, c: 38, f: 15, components: [{ n: "smoked_salmon", q: 50, u: "g" }, { n: "bagel", q: 1, u: "pc" }, { n: "cream_cheese", q: 20, u: "g" }, { n: "capers", q: 5, u: "g" }] },
    { n: "chia_pudding", e: "🥭", p: 10, c: 40, f: 14, components: [{ n: "chia_seeds", q: 30, u: "g" }, { n: "almond_milk", q: 150, u: "ml" }, { n: "mango", q: 50, u: "g" }, { n: "coconut_flakes", q: 5, u: "g" }] },
    { n: "shakshuka", e: "🍳", p: 19, c: 28, f: 14, components: [{ n: "eggs", q: 2, u: "pcs" }, { n: "tomatoes", q: 100, u: "g" }, { n: "onion", q: 30, u: "g" }, { n: "peppers", q: 30, u: "g" }] },
    { n: "smoothie_bowl", e: "🍌", p: 24, c: 50, f: 10, components: [{ n: "frozen_banana", q: 1, u: "pc" }, { n: "protein_powder", q: 1, u: "scoop" }, { n: "spinach", q: 30, u: "g" }, { n: "almond_butter", q: 10, u: "g" }] },
    { n: "cottage_cheese", e: "🍑", p: 20, c: 20, f: 8, components: [{ n: "cottage_cheese", q: 150, u: "g" }, { n: "peach", q: 1, u: "pc" }, { n: "almonds", q: 10, u: "g" }] },
    { n: "french_toast", e: "🍞", p: 14, c: 52, f: 12, components: [{ n: "whole_bread", q: 2, u: "slices" }, { n: "egg", q: 1, u: "pc" }, { n: "milk", q: 50, u: "ml" }, { n: "cinnamon", q: 1, u: "pinch" }] },
    { n: "veggie_omelette", e: "🌿", p: 23, c: 8, f: 16, components: [{ n: "eggs", q: 2, u: "pcs" }, { n: "mushrooms", q: 40, u: "g" }, { n: "spinach", q: 30, u: "g" }, { n: "cheese", q: 20, u: "g" }] },
    { n: "falafel_wrap", e: "🫓", p: 16, c: 45, f: 12, components: [{ n: "falafel", q: 3, u: "pcs" }, { n: "tortilla", q: 1, u: "pc" }, { n: "hummus", q: 30, u: "g" }, { n: "lettuce", q: 20, u: "g" }] },
    { n: "quinoa_bowl_nuts", e: "🌰", p: 12, c: 48, f: 10, components: [{ n: "quinoa", q: 50, u: "g" }, { n: "mixed_nuts", q: 20, u: "g" }, { n: "dried_cranberries", q: 10, u: "g" }] },
    { n: "acai_bowl", e: "🫐", p: 8, c: 58, f: 6, components: [{ n: "acai_puree", q: 100, u: "g" }, { n: "granola", q: 30, u: "g" }, { n: "banana", q: 0.5, u: "pc" }] },
  ],
  lunch: [
    { n: "grilled_chicken_rice", e: "🍗", p: 45, c: 55, f: 8, components: [{ n: "chicken_breast", q: 150, u: "g" }, { n: "brown_rice", q: 100, u: "g" }, { n: "broccoli", q: 100, u: "g" }] },
    { n: "beef_kofta", e: "🥩", p: 40, c: 48, f: 16, components: [{ n: "lean_beef", q: 150, u: "g" }, { n: "pita_bread", q: 1, u: "loaf" }, { n: "tahini", q: 15, u: "g" }, { n: "salad", q: 100, u: "g" }] },
    { n: "salmon_sweet_potato", e: "🐠", p: 38, c: 42, f: 18, components: [{ n: "salmon", q: 150, u: "g" }, { n: "sweet_potato", q: 150, u: "g" }, { n: "asparagus", q: 80, u: "g" }] },
    { n: "quinoa_chickpea", e: "🫙", p: 22, c: 60, f: 12, components: [{ n: "quinoa", q: 80, u: "g" }, { n: "chickpeas", q: 100, u: "g" }, { n: "cucumber", q: 50, u: "g" }, { n: "feta_cheese", q: 20, u: "g" }] },
    { n: "grilled_tuna", e: "🎣", p: 42, c: 10, f: 8, components: [{ n: "tuna_steak", q: 150, u: "g" }, { n: "green_beans", q: 100, u: "g" }, { n: "lemon", q: 0.5, u: "pc" }] },
    { n: "pasta_chicken_pesto", e: "🍝", p: 36, c: 65, f: 14, components: [{ n: "whole_pasta", q: 80, u: "g" }, { n: "chicken_breast", q: 100, u: "g" }, { n: "pesto_sauce", q: 20, u: "g" }] },
    { n: "stuffed_peppers", e: "🫑", p: 30, c: 50, f: 12, components: [{ n: "bell_peppers", q: 2, u: "pcs" }, { n: "minced_beef", q: 100, u: "g" }, { n: "rice", q: 40, u: "g" }] },
    { n: "lentil_stew", e: "🥘", p: 20, c: 58, f: 6, components: [{ n: "lentils", q: 100, u: "g" }, { n: "rice", q: 50, u: "g" }, { n: "carrots", q: 40, u: "g" }, { n: "onions", q: 30, u: "g" }] },
    { n: "teriyaki_salmon", e: "🍱", p: 40, c: 55, f: 15, components: [{ n: "salmon", q: 150, u: "g" }, { n: "white_rice", q: 100, u: "g" }, { n: "teriyaki_sauce", q: 15, u: "ml" }, { n: "zucchini", q: 50, u: "g" }] },
    { n: "turkey_zucchini", e: "🥒", p: 35, c: 18, f: 10, components: [{ n: "ground_turkey", q: 150, u: "g" }, { n: "zucchini", q: 100, u: "g" }, { n: "onion", q: 30, u: "g" }] },
    { n: "chicken_shawarma", e: "🥙", p: 38, c: 42, f: 16, components: [{ n: "chicken_breast", q: 150, u: "g" }, { n: "pita_bread", q: 1, u: "loaf" }, { n: "tomatoes", q: 40, u: "g" }, { n: "garlic_sauce", q: 15, u: "g" }] },
    { n: "soba_noodles_tofu", e: "🍜", p: 18, c: 60, f: 10, components: [{ n: "soba_noodles", q: 80, u: "g" }, { n: "tofu", q: 100, u: "g" }, { n: "shiitake_mushrooms", q: 40, u: "g" }] },
    { n: "beef_stir_fry", e: "🥢", p: 35, c: 55, f: 14, components: [{ n: "beef_strips", q: 150, u: "g" }, { n: "broccoli", q: 100, u: "g" }, { n: "soy_sauce", q: 15, u: "ml" }, { n: "peppers", q: 50, u: "g" }] },
    { n: "baked_cod_quinoa", e: "🐟", p: 36, c: 38, f: 7, components: [{ n: "cod_fish", q: 150, u: "g" }, { n: "quinoa", q: 60, u: "g" }, { n: "lemon", q: 0.5, u: "pc" }] },
    { n: "burrito_bowl", e: "🌯", p: 20, c: 62, f: 16, components: [{ n: "rice", q: 60, u: "g" }, { n: "black_beans", q: 80, u: "g" }, { n: "corn", q: 40, u: "g" }, { n: "avocado", q: 50, u: "g" }] },
  ],
  snack: [
    { n: "mixed_nuts", e: "🥜", p: 6, c: 15, f: 14, components: [{ n: "almonds", q: 10, u: "g" }, { n: "cashews", q: 10, u: "g" }, { n: "walnuts", q: 10, u: "g" }] },
    { n: "protein_shake", e: "🥛", p: 25, c: 20, f: 4, components: [{ n: "protein_powder", q: 1, u: "scoop" }, { n: "milk", q: 200, u: "ml" }] },
    { n: "apple_almond_butter", e: "🍎", p: 4, c: 28, f: 8, components: [{ n: "apple", q: 1, u: "pc" }, { n: "almond_butter", q: 15, u: "g" }] },
    { n: "rice_cakes_hummus", e: "🥒", p: 6, c: 22, f: 4, components: [{ n: "rice_cakes", q: 2, u: "pcs" }, { n: "hummus", q: 30, u: "g" }] },
    { n: "boiled_eggs", e: "🥚", p: 12, c: 1, f: 9, components: [{ n: "eggs", q: 2, u: "pcs" }] },
    { n: "dark_chocolate_walnuts", e: "🍫", p: 4, c: 18, f: 12, components: [{ n: "dark_chocolate", q: 20, u: "g" }, { n: "walnuts", q: 10, u: "g" }] },
    { n: "banana_peanut_butter", e: "🍌", p: 6, c: 32, f: 9, components: [{ n: "banana", q: 1, u: "pc" }, { n: "peanut_butter", q: 15, u: "g" }] },
    { n: "edamame_salt", e: "🫛", p: 12, c: 10, f: 5, components: [{ n: "edamame", q: 100, u: "g" }, { n: "sea_salt", q: 1, u: "pinch" }] },
    { n: "cheese_crackers", e: "🧀", p: 10, c: 18, f: 6, components: [{ n: "cheese_slices", q: 2, u: "pcs" }, { n: "whole_crackers", q: 5, u: "pcs" }] },
    { n: "mango_chili", e: "🥭", p: 2, c: 30, f: 1, components: [{ n: "mango", q: 100, u: "g" }, { n: "chili_powder", q: 1, u: "pinch" }] },
    { n: "greek_yogurt_berries", e: "🫐", p: 10, c: 14, f: 2, components: [{ n: "greek_yogurt", q: 100, u: "g" }, { n: "mixed_berries", q: 30, u: "g" }] },
    { n: "pumpkin_seeds", e: "🌱", p: 7, c: 16, f: 10, components: [{ n: "pumpkin_seeds", q: 30, u: "g" }] },
    { n: "celery_peanut_butter", e: "🥜", p: 5, c: 10, f: 8, components: [{ n: "celery", q: 3, u: "stalks" }, { n: "peanut_butter", q: 15, u: "g" }] },
    { n: "oat_energy_bites", e: "🍪", p: 8, c: 28, f: 5, components: [{ n: "oats", q: 20, u: "g" }, { n: "honey", q: 10, u: "g" }, { n: "dark_chocolate_chips", q: 5, u: "g" }] },
    { n: "avocado_toast", e: "🥑", p: 4, c: 18, f: 10, components: [{ n: "whole_bread", q: 1, u: "slice" }, { n: "avocado", q: 50, u: "g" }] },
  ],
  dinner: [
    { n: "beef_steak", e: "🥩", p: 42, c: 15, f: 18, components: [{ n: "beef_steak", q: 200, u: "g" }, { n: "asparagus", q: 100, u: "g" }, { n: "olive_oil", q: 5, u: "ml" }] },
    { n: "baked_chicken_thighs", e: "🍗", p: 38, c: 40, f: 14, components: [{ n: "chicken_thighs", q: 180, u: "g" }, { n: "sweet_potato", q: 120, u: "g" }, { n: "green_beans", q: 80, u: "g" }] },
    { n: "turkey_meatballs", e: "🍝", p: 36, c: 20, f: 12, components: [{ n: "ground_turkey", q: 150, u: "g" }, { n: "whole_pasta", q: 50, u: "g" }, { n: "tomato_sauce", q: 50, u: "ml" }] },
    { n: "prawn_stir_fry", e: "🦐", p: 30, c: 45, f: 8, components: [{ n: "prawns", q: 150, u: "g" }, { n: "mixed_vegetables", q: 150, u: "g" }, { n: "ginger", q: 5, u: "g" }] },
    { n: "lamb_chops", e: "🍖", p: 40, c: 30, f: 20, components: [{ n: "lamb_chops", q: 150, u: "g" }, { n: "quinoa", q: 50, u: "g" }, { n: "spinach", q: 50, u: "g" }] },
    { n: "fish_tacos", e: "🌮", p: 32, c: 38, f: 10, components: [{ n: "white_fish", q: 150, u: "g" }, { n: "corn_tortilla", q: 2, u: "pcs" }, { n: "cabbage_slaw", q: 50, u: "g" }] },
    { n: "lentil_soup", e: "🥣", p: 18, c: 55, f: 8, components: [{ n: "lentils", q: 100, u: "g" }, { n: "onions", q: 30, u: "g" }, { n: "celery", q: 30, u: "g" }] },
    { n: "chicken_curry", e: "🍛", p: 35, c: 50, f: 12, components: [{ n: "chicken_breast", q: 150, u: "g" }, { n: "coconut_milk", q: 50, u: "ml" }, { n: "brown_rice", q: 60, u: "g" }] },
    { n: "seared_tuna_soba", e: "🎣", p: 40, c: 40, f: 9, components: [{ n: "tuna_steak", q: 150, u: "g" }, { n: "soba_noodles", q: 60, u: "g" }, { n: "sesame_seeds", q: 5, u: "g" }] },
    { n: "stuffed_chicken", e: "🫕", p: 42, c: 8, f: 16, components: [{ n: "chicken_breast", q: 150, u: "g" }, { n: "spinach", q: 50, u: "g" }, { n: "feta_cheese", q: 20, u: "g" }] },
    { n: "vegetable_tagine", e: "🥘", p: 14, c: 60, f: 7, components: [{ n: "mixed_vegetables", q: 200, u: "g" }, { n: "couscous", q: 60, u: "g" }, { n: "chickpeas", q: 50, u: "g" }] },
    { n: "swordfish_salsa", e: "🐟", p: 38, c: 12, f: 13, components: [{ n: "swordfish", q: 150, u: "g" }, { n: "mango_salsa", q: 50, u: "g" }, { n: "lime", q: 0.5, u: "pc" }] },
    { n: "beef_broccoli", e: "🥦", p: 38, c: 18, f: 14, components: [{ n: "beef_strips", q: 150, u: "g" }, { n: "broccoli", q: 120, u: "g" }, { n: "garlic", q: 5, u: "g" }] },
    { n: "baked_cod_garlic", e: "🐟", p: 34, c: 8, f: 10, components: [{ n: "cod_fish", q: 150, u: "g" }, { n: "garlic_butter", q: 10, u: "g" }, { n: "lemon", q: 0.5, u: "pc" }] },
    { n: "chickpea_masala", e: "🫘", p: 16, c: 52, f: 8, components: [{ n: "chickpeas", q: 150, u: "g" }, { n: "tomato_sauce", q: 100, u: "ml" }, { n: "warm_spices", q: 5, u: "g" }] },
  ]
};
const MT = [
  { id: 'breakfast', lbl: 'breakfast', pct: .25, icon: 'sun', time: '7:00 AM' },
  { id: 'lunch', lbl: 'lunch', pct: .35, icon: 'utensils', time: '12:30 PM' },
  { id: 'snack', lbl: 'snack', pct: .10, icon: 'apple', time: '3:30 PM' },
  { id: 'dinner', lbl: 'dinner', pct: .30, icon: 'moon', time: '7:30 PM' },
];
const pick = id => { const a = FOODS[id]; return { ...(a[Math.floor(Math.random() * a.length)]) }; };
const genDay = () => { const d = {}; MT.forEach(m => d[m.id] = pick(m.id)); return d; };
const genPlan = () => Array.from({ length: 30 }, () => genDay());

// ── WORKOUT PROGRAMS ─────────────────────────────────────────────
const WPRG = {
  loss: {
    name: "fat_burn", color: "var(--cyan)", days: [
      { type: 'strength', title: 'full_body_burn', dur: '45 min', ex: [{ n: 'squats', d: '4×12 | 60s' }, { n: 'push_ups', d: '3×15 | 45s' }, { n: 'dumbbell_rows', d: '4×12 | 60s' }, { n: 'reverse_lunges', d: '3×12 | 45s' }, { n: 'plank_hold', d: '3×45s | 30s' }] },
      { type: 'cardio', title: 'cardio_blast', dur: '40 min', ex: [{ n: 'warm_up_jog', d: '5 min' }, { n: 'sprint_intervals', d: '20 min (30s on/30s off)' }, { n: 'jump_rope', d: '10 min' }, { n: 'cool_down_walk', d: '5 min' }] },
      { type: 'strength', title: 'upper_body', dur: '40 min', ex: [{ n: 'bench_press', d: '4×10 | 75s' }, { n: 'cable_rows', d: '4×10 | 75s' }, { n: 'shoulder_press', d: '3×12 | 60s' }, { n: 'bicep_curls', d: '3×12 | 45s' }, { n: 'tricep_dips', d: '3×12 | 45s' }] },
      { type: 'hiit', title: 'hiit_core', dur: '35 min', ex: [{ n: 'burpees', d: '4×10 | 30s' }, { n: 'mountain_climbers', d: '3×30s | 20s' }, { n: 'bicycle_crunches', d: '3×20 | 30s' }, { n: 'jump_squats', d: '3×15 | 45s' }, { n: 'hollow_body_hold', d: '3×30s | 30s' }] },
      { type: 'strength', title: 'lower_body', dur: '45 min', ex: [{ n: 'barbell_squats', d: '4×10 | 90s' }, { n: 'romanian_deadlifts', d: '4×10 | 90s' }, { n: 'leg_press', d: '3×12 | 75s' }, { n: 'calf_raises', d: '4×15 | 45s' }, { n: 'glute_bridges', d: '3×15 | 45s' }] },
      { type: 'cardio', title: 'active_recovery', dur: '30 min', ex: [{ n: 'light_walk_cycle', d: '20 min' }, { n: 'full_body_stretch', d: '10 min' }] },
      { type: 'rest', title: 'rest_day', dur: '', ex: [] },
    ]
  },
  gain: {
    name: "muscle_builder", color: "var(--purple-l)", days: [
      { type: 'strength', title: 'push_day_chest', dur: '60 min', ex: [{ n: 'bench_press', d: '4×8 | 2 min' }, { n: 'incline_db_press', d: '3×10 | 90s' }, { n: 'shoulder_press', d: '4×10 | 90s' }, { n: 'lateral_raises', d: '3×15 | 60s' }, { n: 'tricep_pushdown', d: '3×12 | 60s' }] },
      { type: 'strength', title: 'pull_day_back', dur: '60 min', ex: [{ n: 'deadlifts', d: '4×6 | 3 min' }, { n: 'pull_ups', d: '4×8 | 2 min' }, { n: 'seated_cable_rows', d: '4×10 | 90s' }, { n: 'face_pulls', d: '3×15 | 60s' }, { n: 'barbell_curls', d: '3×12 | 60s' }] },
      { type: 'strength', title: 'leg_day_quads', dur: '60 min', ex: [{ n: 'back_squats', d: '5×5 | 3 min' }, { n: 'romanian_deadlifts', d: '4×8 | 2 min' }, { n: 'leg_press', d: '3×12 | 90s' }, { n: 'leg_calls', d: '3×12 | 75s' }, { n: 'standing_calf_raises', d: '4×20 | 60s' }] },
      { type: 'strength', title: 'push_day_shoulders', dur: '55 min', ex: [{ n: 'overhead_press', d: '5×5 | 3 min' }, { n: 'cable_flies', d: '4×12 | 75s' }, { n: 'db_shoulder_press', d: '3×12 | 75s' }, { n: 'skull_crushers', d: '3×12 | 60s' }, { n: 'weighted_dips', d: '3×amap | 90s' }] },
      { type: 'strength', title: 'pull_day_volume', dur: '55 min', ex: [{ n: 'barbell_rows', d: '4×8 | 2 min' }, { n: 'lat_pulldowns', d: '4×10 | 90s' }, { n: 'single_arm_db_rows', d: '3×12 | 75s' }, { n: 'hammer_curls', d: '3×15 | 60s' }, { n: 'rear_delt_flies', d: '3×15 | 45s' }] },
      { type: 'strength', title: 'leg_day_core', dur: '55 min', ex: [{ n: 'front_squats', d: '4×8 | 2 min' }, { n: 'hip_thrusts', d: '4×12 | 90s' }, { n: 'walking_lunges', d: '3×12 | 75s' }, { n: 'ab_wheel_rollouts', d: '3×10 | 60s' }, { n: 'calf_raises', d: '4×20 | 45s' }] },
      { type: 'rest', title: 'rest_recover', dur: '', ex: [] },
    ]
  },
  maintain: {
    name: "balanced", color: "var(--orange)", days: [
      { type: 'strength', title: 'upper_body_strength', dur: '45 min', ex: [{ n: 'bench_press', d: '3×10 | 90s' }, { n: 'pull_ups', d: '3×8 | 90s' }, { n: 'shoulder_press', d: '3×10 | 75s' }, { n: 'bicep_curls', d: '2×12 | 60s' }, { n: 'tricep_pushdowns', d: '2×12 | 60s' }] },
      { type: 'cardio', title: 'cardio_endurance', dur: '35 min', ex: [{ n: 'warm_up', d: '5 min' }, { n: 'steady_state_run', d: '25 min' }, { n: 'cool_down_stretch', d: '5 min' }] },
      { type: 'strength', title: 'lower_body_strength', dur: '45 min', ex: [{ n: 'squats', d: '3×10 | 90s' }, { n: 'deadlifts', d: '3×8 | 2 min' }, { n: 'lunges', d: '3×12 | 60s' }, { n: 'calf_raises', d: '3×15 | 45s' }, { n: 'plank', d: '3×45s | 30s' }] },
      { type: 'rest', title: 'active_rest_yoga', dur: '20 min', ex: [{ n: 'yoga_flow', d: '20 min' }] },
      { type: 'hiit', title: 'full_body_hiit', dur: '30 min', ex: [{ n: 'jump_squats', d: '4×15 | 30s' }, { n: 'push_up_burpees', d: '4×10 | 30s' }, { n: 'kettlebell_swings', d: '4×15 | 45s' }, { n: 'box_jumps', d: '3×10 | 45s' }, { n: 'mountain_climbers', d: '3×30s | 30s' }] },
      { type: 'cardio', title: 'cardio_mobility', dur: '40 min', ex: [{ n: 'jog_swim', d: '30 min' }, { n: 'foam_roll_mobility', d: '10 min' }] },
      { type: 'rest', title: 'full_rest_day', dur: '', ex: [] },
    ]
  }
};
const TYPE_BADGE = { strength: 'badge-purple', cardio: 'badge-cyan', hiit: 'badge-orange', rest: 'badge-dim' };
const TYPE_LBL = { strength: 'strength', cardio: 'cardio', hiit: 'hiit', rest: 'rest_day' };

// ── SHOPPING CATEGORIES ──────────────────────────────────────────
const SHOP_CATS = [
  { title: 'proteins', icon: 'activity', items: ['chicken_breast', 'salmon_fillets_4', 'lean_beef', 'tuna_steaks', 'turkey_mince', 'eggs_12', 'tofu_400g'] },
  { title: 'grains', icon: 'wheat', items: ['brown_rice_1', 'sweet_potatoes_1', 'quinoa_500g', 'oats_500g', 'wheat_bread', 'pasta_500g', 'bulgur_400g'] },
  { title: 'vegetables', icon: 'leaf', items: ['broccoli_500g', 'spinach_200g', 'bell_peppers', 'zucchini_3', 'asparagus_1', 'mixed_veg_500g', 'tomatoes_6'] },
  { title: 'fruits', icon: 'apple', items: ['bananas_7', 'berries_400g', 'apples_6', 'kiwi_4', 'mango_2'] },
  { title: 'dairy', icon: 'milk', items: ['greek_yogurt_500g', 'milk_1l', 'cream_cheese_200g', 'feta_200g', 'cheese_slices'] },
  { title: 'healthy_fats', icon: 'droplets', items: ['avocados_4', 'olive_oil_500ml', 'mixed_nuts_250g', 'almond_butter', 'peanut_butter_jar', 'coconut_milk_400ml'] },
  { title: 'pantry', icon: 'package', items: ['hummus_400g', 'rice_cakes_pack', 'dark_chocolate_200g', 'honey_jar', 'granola_400g', 'protein_powder_1kg', 'chickpeas_2', 'lentils_500g'] },
];
