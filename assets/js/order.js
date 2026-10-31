// Kairali – "Build Your Order": cart, Speed Post delivery estimate, UPI payment, WhatsApp order.
// Ported from the original Order Cost Calculator (iphils.github.io/kairali-delivery).

(() => {
  // ── Config ────────────────────────────────────────────────────────────────
  const PRODUCTS = [
    // id = bottle size in ml; weight = shipping weight per bottle in grams
    { id: '60',  weight: 60,  price: 110, name: 'Small bottle' },
    { id: '100', weight: 100, price: 200, name: 'Standard bottle' },
    { id: '250', weight: 250, price: 436, name: 'Family bottle' },
    { id: '500', weight: 500, price: 866, name: 'Value bottle' },
  ];
  const MAX_QTY = 20;
  const BOX_WEIGHT = 150;                          // outer packing box, grams
  const ORIGIN = { lat: 10.0107, lon: 76.3490 };   // Tripunithura 682301, Ernakulam
  const WHATSAPP_NUMBER = '918281447237';
  const UPI_ID = 'Getepay.esafbank665898@icici';
  const UPI_NAME = 'VKP Industries';
  const STORAGE_KEY = 'kairali-order';

  // Speed Post tariff (incl. GST). Each row = one 500 g band:
  // [local, ≤200 km, ≤1000 km, ≤2000 km, >2000 km]
  const TARIFF = [
    [36,60,70,94,106],[48,77,106,142,166],[60,94,142,188,224],[70,113,178,236,284],
    [82,130,212,284,342],[94,147,248,330,402],[106,166,284,378,460],[118,183,318,424,520],
    [130,200,354,472,578],[142,219,390,520,638],[154,236,424,566,696],[166,253,460,614,756],
    [178,272,496,660,814],[188,289,532,708,874],[200,306,566,756,932],[212,325,602,802,992],
    [224,342,638,850,1050],[236,359,672,896,1110],[248,378,708,944,1168],[260,395,744,992,1228],
    [272,414,778,1038,1286],[284,431,814,1086,1346],[296,448,850,1132,1404],[306,467,886,1180,1464],
    [318,484,920,1228,1522],[330,501,956,1274,1582],[342,520,992,1322,1640],[354,537,1026,1368,1700],
    [366,554,1062,1416,1758],[378,573,1098,1464,1818],[390,590,1132,1510,1876],[402,607,1168,1558,1936],
    [414,626,1204,1604,1994],[424,643,1240,1652,2054],[436,660,1274,1700,2112],[448,679,1310,1746,2172],
    [460,696,1346,1794,2230],[472,713,1380,1840,2290],[484,732,1416,1888,2348],[496,749,1452,1936,2408],
    [508,768,1486,1982,2466],[520,785,1522,2030,2526],[532,802,1558,2076,2584],[542,821,1594,2124,2644],
    [554,838,1628,2172,2702],[566,855,1664,2218,2762],[578,874,1700,2266,2820],[590,891,1734,2312,2880],
    [602,908,1770,2360,2938],[614,927,1806,2408,2998],[626,944,1840,2454,3056],[638,961,1876,2502,3116],
    [650,980,1912,2548,3174],[660,997,1948,2596,3234],[672,1014,1982,2644,3292],[684,1033,2018,2690,3352],
    [696,1050,2054,2738,3410],[708,1067,2088,2784,3470],[720,1086,2124,2832,3528],[732,1103,2160,2880,3588],
    [744,1122,2194,2926,3646],[756,1139,2230,2974,3706],[768,1156,2266,3020,3764],[778,1175,2302,3068,3824],
    [790,1192,2336,3116,3882],[802,1209,2372,3162,3942],[814,1228,2408,3210,4000],[826,1245,2442,3256,4060],
    [838,1262,2478,3304,4118],[850,1281,2514,3352,4178],
  ];

  const ZONES = [
    { max: 15,       label: 'Local' },
    { max: 200,      label: 'Up to 200 km' },
    { max: 1000,     label: '201 – 1000 km' },
    { max: 2000,     label: '1001 – 2000 km' },
    { max: Infinity, label: 'Above 2000 km' },
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const track = (name, params) => { if (typeof window.track === 'function') window.track(name, params); };
  const rupees = n => '₹' + n.toLocaleString('en-IN');

  let state = { qty: {}, pin: '', place: null };   // place = { pin, name, km, zoneIdx }
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}); } catch (_) {}
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} };

  const qtyOf = id => state.qty[id] || 0;
  const totalQty = () => PRODUCTS.reduce((s, p) => s + qtyOf(p.id), 0);
  const subtotal = () => PRODUCTS.reduce((s, p) => s + qtyOf(p.id) * p.price, 0);
  const parcelWeight = () => {
    const w = PRODUCTS.reduce((s, p) => s + qtyOf(p.id) * p.weight, 0);
    return w > 0 ? w + BOX_WEIGHT : 0;
  };
  const shipping = () => {
    const w = parcelWeight();
    if (!w || !state.place) return null;
    const band = Math.min(Math.floor((w - 1) / 500), TARIFF.length - 1);
    return TARIFF[band][state.place.zoneIdx];
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const itemsEl = $('obItems');
  itemsEl.innerHTML = PRODUCTS.map(p => `
    <div class="ob-item" data-id="${p.id}">
      <div class="ob-item__info">
        <strong>${p.id} ml</strong>
        <span>${p.name} · ${rupees(p.price)}</span>
      </div>
      <div class="ob-qty">
        <button type="button" data-step="-1" aria-label="Remove one ${p.id} ml bottle">−</button>
        <output aria-live="polite">0</output>
        <button type="button" data-step="1" aria-label="Add one ${p.id} ml bottle">+</button>
      </div>
    </div>`).join('');

  function render() {
    // quantity steppers
    itemsEl.querySelectorAll('.ob-item').forEach(row => {
      const q = qtyOf(row.dataset.id);
      row.querySelector('output').textContent = q;
      row.classList.toggle('has-qty', q > 0);
    });

    // summary lines
    const lines = PRODUCTS.filter(p => qtyOf(p.id) > 0)
      .map(p => `<li><span>${p.id} ml × ${qtyOf(p.id)}</span><span>${rupees(qtyOf(p.id) * p.price)}</span></li>`);
    $('obLines').innerHTML = lines.length ? lines.join('') : '<li class="ob-empty">No bottles added yet.</li>';

    const sub = subtotal(), ship = shipping();
    $('obSubtotal').textContent = rupees(sub);
    $('obShip').textContent = !totalQty() ? '—' : ship === null ? 'Enter pincode' : rupees(ship);
    const total = ship === null || !totalQty() ? null : sub + ship;
    $('obTotal').textContent = total === null ? '—' : rupees(total);
    $('obPayAmount').textContent = total === null ? 'add bottles & pincode first' : rupees(total);

    // delivery details
    if (state.place) {
      $('obDelivery').hidden = false;
      $('obDest').textContent = state.place.name;
      $('obDist').textContent = `~${Math.round(state.place.km)} km`;
      $('obZone').textContent = ZONES[state.place.zoneIdx].label;
      $('obWeight').textContent = parcelWeight() ? `~${parcelWeight()} g` : '—';
      $('obShipNote').textContent = `Speed Post to ${state.place.name} (${state.place.pin}).`;
    }

    // mobile UPI deep link with amount filled in
    const upiBtn = $('obUpiApp');
    if (total !== null && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      upiBtn.href = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent('Kairali order')}`;
      upiBtn.hidden = false;
    } else {
      upiBtn.hidden = true;
    }

    // header badge
    const badge = $('cartCount');
    if (badge) { badge.textContent = totalQty(); badge.hidden = totalQty() === 0; }

    // mobile cart bar
    const n = totalQty();
    $('cartBarCount').textContent = `${n} bottle${n === 1 ? '' : 's'}`;
    $('cartBarTotal').textContent = rupees(subtotal());
    updateCartBar();
  }

  // Show the mobile cart bar while there is something in the order,
  // except when the order section itself is already on screen.
  function updateCartBar() {
    const r = $('order').getBoundingClientRect();
    const orderInView = r.top < innerHeight * 0.75 && r.bottom > 0;
    const show = totalQty() > 0 && !orderInView;
    $('cartBar').classList.toggle('is-visible', show);
    document.body.classList.toggle('has-cartbar', show);
  }
  addEventListener('scroll', updateCartBar, { passive: true });
  addEventListener('resize', updateCartBar);

  function setQty(id, q) {
    state.qty[id] = Math.max(0, Math.min(MAX_QTY, q));
    save(); render();
  }

  itemsEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-step]');
    if (!btn) return;
    const id = btn.closest('.ob-item').dataset.id;
    setQty(id, qtyOf(id) + Number(btn.dataset.step));
    if (btn.dataset.step === '1') track('add_to_order', { size: `${id} ml`, source: 'order_builder' });
  });

  // "Add to order" buttons on product cards
  document.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.add;
    setQty(id, qtyOf(id) + 1);
    toast(`Added ${id} ml bottle to your order`);
    const bar = $('cartBar');
    bar.classList.remove('is-pulse'); void bar.offsetWidth; bar.classList.add('is-pulse');
    track('add_to_order', { size: `${id} ml`, source: 'product_card' });
  }));

  // ── Pincode → distance → zone ────────────────────────────────────────────
  function haversine(a, b) {
    const R = 6371, rad = d => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  async function lookupPin() {
    const input = $('obPin'), err = $('obPinError'), btn = $('obPinBtn');
    const pin = input.value.trim();
    err.textContent = '';
    input.classList.remove('is-error');
    if (!/^\d{6}$/.test(pin)) {
      err.textContent = 'Please enter a valid 6-digit Indian pincode.';
      input.classList.add('is-error');
      return;
    }
    if (state.place && state.place.pin === pin) { render(); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Checking…';
    try {
      // 1. India Post: pincode → district/state
      let district = '', stateName = '';
      try {
        const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const d = await r.json();
        if (d[0].Status === 'Success' && d[0].PostOffice?.length) {
          district = d[0].PostOffice[0].District;
          stateName = d[0].PostOffice[0].State;
        }
      } catch (_) { /* fall back to geocoding the pincode directly */ }

      // 2. OpenStreetMap: place → coordinates
      const q = district && stateName ? `${district}, ${stateName}, India` : `${pin}, India`;
      const r2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`);
      const d2 = await r2.json();
      if (!d2?.length) throw new Error('We couldn’t find this pincode. Please check it, or message us on WhatsApp.');

      const km = haversine(ORIGIN, { lat: parseFloat(d2[0].lat), lon: parseFloat(d2[0].lon) });
      state.pin = pin;
      state.place = {
        pin,
        name: district && stateName ? `${district}, ${stateName}` : pin,
        km,
        zoneIdx: ZONES.findIndex(z => km <= z.max),
      };
      save(); render();
      track('check_delivery', { state: stateName || 'unknown', zone: ZONES[state.place.zoneIdx].label });
    } catch (e) {
      err.textContent = e.message || 'Could not check this pincode right now. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Check';
    }
  }

  $('obPinBtn').addEventListener('click', lookupPin);
  $('obPin').addEventListener('keydown', e => { if (e.key === 'Enter') lookupPin(); });
  $('obPin').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
  if (state.pin) $('obPin').value = state.pin;

  // ── Copy UPI ID ───────────────────────────────────────────────────────────
  $('obUpiApp').addEventListener('click', () => track('open_upi_app'));

  $('obCopyUpi').addEventListener('click', async () => {
    track('copy_upi');
    try { await navigator.clipboard.writeText(UPI_ID); toast('UPI ID copied'); }
    catch (_) { toast(UPI_ID); }
  });

  // ── Send on WhatsApp ──────────────────────────────────────────────────────
  $('obSend').addEventListener('click', () => {
    const err = $('obOrderError');
    const nameEl = $('obName'), phoneEl = $('obPhone'), addrEl = $('obAddress');
    err.textContent = '';
    [nameEl, phoneEl, addrEl].forEach(el => el.classList.remove('is-error'));

    const fail = (msg, el, step) => {
      err.textContent = msg;
      if (el) { el.classList.add('is-error'); el.focus(); }
      if (step) $(step).scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!totalQty()) return fail('Please add at least one bottle in Step 1.', null, 'ob-step-1');
    if (shipping() === null) return fail('Please check delivery for your pincode in Step 2.', $('obPin'), 'ob-step-2');

    const name = nameEl.value.trim();
    const phone = phoneEl.value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    const addr = addrEl.value.trim();
    if (!name) return fail('Please enter the recipient’s full name.', nameEl);
    if (!/^\d{10}$/.test(phone)) return fail('Please enter a valid 10-digit mobile number.', phoneEl);
    if (addr.length < 10) return fail('Please enter the full delivery address with pincode.', addrEl);

    const items = PRODUCTS.filter(p => qtyOf(p.id) > 0)
      .map(p => `• ${p.id} ml × ${qtyOf(p.id)} = ₹${qtyOf(p.id) * p.price}`).join('\n');
    const sub = subtotal(), ship = shipping();

    const msg =
`*New Order: Kairali Coconut Milk Oil*

*Order Items*
${items}

Order Value: ₹${sub}
Speed Post Delivery: ₹${ship}
*Total Payable: ₹${sub + ship}*

*Delivery Details*
Name: ${name}
Contact: ${phone}
Pincode: ${state.place.pin} (${state.place.name})
Address: ${addr}

I have made the payment. Payment screenshot attached.`;

    track('whatsapp_order_sent', { value: sub + ship, currency: 'INR', bottles: totalQty(), state: state.place.name });
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  // ── Toast ─────────────────────────────────────────────────────────────────
  let toastEl, toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span></span><a href="#order">View order →</a>`;
    toastEl.firstChild.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 5000);
  }

  render();
})();
