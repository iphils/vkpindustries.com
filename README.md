# Kairali Coconut Milk Oil – Website

A static, single-page site (plain HTML/CSS/JS, no build step) for GitHub Pages.

```
index.html            – the whole page
assets/css/style.css  – styles (colours are CSS variables at the top)
assets/js/main.js     – mobile menu, auto image loading, scroll animations
assets/js/order.js    – "Build Your Order": cart, Speed Post estimate, UPI, WhatsApp order
assets/img/           – put your photos here
.nojekyll             – tells GitHub Pages to serve files as-is
```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Adding images (no HTML editing needed)

Every grey dashed box is a placeholder. Save a photo into `assets/img/` with the
matching filename and it shows up automatically.

| File | What | Size (px) |
|---|---|---|
| `hero.jpg` | Bottle with fresh coconuts / coconut milk | 1200 × 1400 |
| `bottle-60.jpg` `bottle-100.jpg` `bottle-250.jpg` `bottle-500.jpg` | Each bottle on a plain cream background | 800 × 1000 |
| `founders.jpg` | The women behind Kairali | 1000 × 1200 |
| `step-1.jpg` … `step-4.jpg` | Coconuts → coconut milk → slow cooking → bottling | 600 × 600 |
| `heritage.jpg` | Kerala heritage (Kathakali motif, uruli, grandmother oiling hair…) | 1000 × 1200 |
| `use-hair.jpg` `use-baby.jpg` `use-skin.jpg` | How-to-use photos | 900 × 600 |
| `insta-1.jpg` … `insta-5.jpg` | Instagram posts | 600 × 600 |
| `og-image.jpg` | Preview image for WhatsApp/Facebook link sharing | 1200 × 630 |
| `logo.svg` (optional) | Replace the text logo in the header (see comment in `index.html`) | – |

### Canva AI images (already generated in your Canva account)

Open each link, click **Download**, then run the helper script:
`python3 tools/add-image.py ~/Downloads/<file>.png <name>`

| Name | Canva link |
|---|---|
| `hero` | https://www.canva.com/M/MAHZi116mdw |
| `step-1` | https://www.canva.com/M/MAHZizehJM4 |
| `step-2` | https://www.canva.com/M/MAHZixYXPng |
| `step-3` | https://www.canva.com/M/MAHZi3-HlC4 |
| `step-4` | https://www.canva.com/M/MAHZiwcHxxs |
| `heritage` | https://www.canva.com/M/MAHZi16etLo |
| `use-hair` | https://www.canva.com/M/MAHZi7qgP8E |
| `use-baby` | https://www.canva.com/M/MAHZi1GDinc |
| `use-skin` | https://www.canva.com/M/MAHZi7O8dmc |

Bottles, founders, Instagram tiles and the share image should be **real photos**.

## Text to fill in

Search `index.html` for `todo` (yellow highlighted text) and `PLACEHOLDER`:
founder name(s) and story, founder quote, real customer reviews, full address,
email, wholesale policy.

## Build Your Order (order & delivery calculator)

This section replaces the old calculator at `iphils.github.io/kairali-delivery`.
The customer picks bottles and enters a pincode. The site looks up the distance from
Tripunithura using the India Post pincode API and OpenStreetMap, then picks the
Speed Post tariff. The customer pays by UPI QR and taps the button to send the full order on WhatsApp.
The order is kept in the browser, so it survives a page refresh.

Settings to change are at the top of `assets/js/order.js`:

- `PRODUCTS`: sizes, weights and prices. If you change a price, also update the shop cards in `index.html`.
- `TARIFF`: the Speed Post rate table. Update it when India Post revises rates.
- `BOX_WEIGHT`, `ORIGIN`, `WHATSAPP_NUMBER`, `UPI_ID`.
- The QR image is `assets/img/upi-qr.png`.

## Publish on GitHub Pages

1. Create a repo on GitHub (e.g. `kairali-website`) and push this folder:
   ```bash
   git init && git add . && git commit -m "Initial Kairali website"
   git branch -M main
   git remote add origin https://github.com/<your-user>/kairali-website.git
   git push -u origin main
   ```
2. Go to the repo's **Settings → Pages**. Set **Source** to *Deploy from a branch* and pick **main / (root)**.
3. The site goes live at `https://<your-user>.github.io/kairali-website/`.

## Point your custom domain

1. In **Settings → Pages → Custom domain**, enter your domain (e.g. `www.kairalioil.com`) and save.
   GitHub creates a `CNAME` file in the repo for you.
2. At your domain registrar, add DNS records:
   - `www` → **CNAME** → `<your-user>.github.io`
   - apex/root (`@`) → **A** records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. After DNS updates (minutes to a few hours), turn on **Enforce HTTPS**.
