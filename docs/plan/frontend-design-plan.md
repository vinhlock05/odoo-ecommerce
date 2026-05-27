# FashionOS — Frontend Design Plan

> Tài liệu này là kế hoạch thiết kế và implement toàn bộ frontend cho FashionOS.
> Stack: Next.js 15 App Router · TypeScript · Tailwind CSS v4
> Áp dụng skill: `frontend-design` — chọn một hướng, cam kết toàn bộ.

---

## 1. Visual Direction

### Hướng đã chọn: **Modern Vietnamese Sport-Editorial**

Không phải "clean minimal" kiểu SaaS. Không phải luxury thuần túy.
→ **Confident, urban, Vietnamese** — như Coolmate gặp một tờ tạp chí thời trang nam.

**Emotional tone:**
- Premium nhưng gần gũi. Đắt tiền nhưng không xa cách.
- Energetic ở hero/motion, calmer ở checkout/account.
- Một thứ người dùng nhớ: **typography lớn + màu đen chắc + vàng gold như accent duy nhất.**

**Một thứ user phải nhớ khi rời trang:**
> "FashionOS tối, mạnh, nhưng không lạnh."

**Không làm:**
- ❌ Hero gradient blob + centered H1
- ❌ Card grid đồng đều không hierarchy
- ❌ Default Tailwind/shadcn look
- ❌ English copy
- ❌ Thêm màu thứ 3 ngoài palette

---

## 2. Design System

### 2.1 Color Tokens

```css
/* Đã có trong tailwind.config.ts — giữ nguyên */
--color-black:   #0A0A0A   /* dominant background, header */
--color-white:   #FAFAFA   /* page background, card surfaces */
--color-accent:  #C8A96E   /* gold — CTA, badge, highlight. Dùng sparingly */
--color-muted:   #6B7280   /* secondary text, placeholder */
--color-surface: #F4F4F4   /* input bg, card bg */
--color-border:  #E5E5E5   /* dividers */

/* Thêm mới */
--color-success: #16A34A   /* in-stock, success toast */
--color-danger:  #DC2626   /* error, out-of-stock */
--color-warning: #D97706   /* warning toast */
--color-info:    #2563EB   /* info toast */

/* CoolClub tiers */
--tier-bronze:   #CD7F32
--tier-silver:   #9CA3AF
--tier-gold:     #C8A96E   /* = accent */
--tier-diamond:  #67E8F9   /* cyan shimmer */
```

**Quy tắc màu:**
- Black (#0A0A0A) = header, footer, hero overlay, dark sections
- White (#FAFAFA) = main page background
- Gold (#C8A96E) = CHỈ dùng cho: primary CTA, tier badge, price highlight, wishlist icon active
- Muted/Border = text phụ, divider

### 2.2 Typography

```css
/* Đã có trong layout.tsx */
font-sans:    'Inter' (300, 400, 500, 600)      /* body, UI, labels */
font-display: 'Playfair Display' (400, 600)     /* headlines lớn, hero, section title */

/* Scale — mobile first */
--text-xs:    0.75rem    /* 12px — label, badge */
--text-sm:    0.875rem   /* 14px — caption, helper */
--text-base:  1rem       /* 16px — body */
--text-lg:    1.125rem   /* 18px — sub-heading */
--text-xl:    1.25rem    /* 20px — card title */
--text-2xl:   1.5rem     /* 24px — section heading */
--text-3xl:   1.875rem   /* 30px — page heading */
--text-hero:  clamp(2.5rem, 6vw, 5rem)   /* hero headline — responsive */
--text-mega:  clamp(3rem, 8vw, 7rem)     /* landing tagline */
```

**Quy tắc typography:**
- Playfair Display → tagline hero, section title editorial ("Bộ Sưu Tập Mùa Hè")
- Inter → mọi UI còn lại (nav, button, label, price, form)
- Không dùng font thứ 3
- Uppercase + letter-spacing cho: brand name, nav label, badge text

### 2.3 Spacing Rhythm

```
4px  — micro gap (icon + text, inline elements)
8px  — small (padding button, tag gap)
12px — form label → input
16px — card padding, base mobile gutter
24px — section gap trong card
32px — component vertical gap
48px — section padding mobile
80px — section padding desktop
120px — large section gap (hero → next section)
```

### 2.4 Layout Grid

```
Mobile:   1 column, 16px gutter
Tablet:   2 columns, 24px gutter
Desktop:  12 columns, max-width 1280px, 32px gutter, auto margin

Product grid:
  Mobile:   2 col
  Tablet:   3 col
  Desktop:  4 col (listing), 3 col (featured)
```

### 2.5 Border & Shadow

```css
--radius-sm:  4px    /* badge, tag, input */
--radius-md:  8px    /* card, button */
--radius-lg:  12px   /* modal, dropdown panel */
--radius-xl:  20px   /* hero feature card */
--radius-full: 9999px /* pill badge, avatar */

--shadow-sm:  0 1px 3px rgba(0,0,0,0.08)
--shadow-md:  0 4px 16px rgba(0,0,0,0.10)
--shadow-lg:  0 8px 32px rgba(0,0,0,0.14)
--shadow-card-hover: 0 12px 40px rgba(0,0,0,0.18)
```

### 2.6 Motion Rules

```
duration-fast:   150ms   /* hover, toggle, checkbox */
duration-normal: 300ms   /* modal open, dropdown, page transition */
duration-slow:   500ms   /* hero reveal, page load animation */
duration-crawl:  800ms   /* stagger effect */

ease-standard:  cubic-bezier(0.4, 0, 0.2, 1)  /* most UI */
ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1)  /* slide-in panels */
ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1) /* add-to-cart bounce */
```

**Quy tắc motion:**
- **Chỉ animate** compositor-safe props: `transform`, `opacity`, `clip-path`
- **Không animate**: width, height, top, left, padding
- 1 memorable moment per page — hero entrance, add-to-cart bounce, tier progress fill
- Cart drawer: slide từ phải vào (`translateX(100%)` → `translateX(0)`)
- Toast: slide từ top-right xuống + fade
- Product image: scale(1.03) on hover — không hơn

---

## 3. Page Architecture & Layout Plan

### 3.1 Global Header

**Behavior:** sticky, blur backdrop on scroll (`backdrop-blur-sm bg-white/90`)

```
Desktop:
┌──────────────────────────────────────────────────────────────────────┐
│  FASHIONOS    MỚI  ·  Nam ▾  ·  Nữ ▾  ·  SALE  ·  CoolClub     🔍 💛 🛒²  👤 │
└──────────────────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────────┐
│  ☰    FASHIONOS    🛒²     │
└────────────────────────────┘
```

**Components cần build:**
- `Header` (existing, cần upgrade)
- `MegaMenu` — dropdown cho Nam/Nữ
- `MobileDrawer` — slide-in nav
- `CartIconBadge` — animated count
- `SearchOverlay` — full-screen search overlay
- `AuthMenu` — dropdown "Đăng nhập / Tài khoản"

**Mega menu layout:**
```
┌─────────────────────────────────────────────────────┐
│  Áo            Quần          Phụ kiện    Combo      │
│  ─────         ─────         ─────       ─────      │
│  Áo Thun       Quần Short    Mũ          Summer Set │
│  Polo          Quần Dài      Tất         Gym Pack   │
│  Hoodie        Quần Gym                  Office Set │
│                                                     │
│           [Xem tất cả sản phẩm →]                   │
└─────────────────────────────────────────────────────┘
```

---

### 3.2 Homepage (`/`)

**Direction:** Editorial, asymmetric, NOT centered blob hero.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [HERO SECTION]                                      │
│  Full-viewport. Dark overlay on lifestyle img.       │
│  Left-aligned text (NOT centered).                   │
│  Large Playfair headline + Inter sub + 2 CTAs.       │
│  Small floating tier badge top-right corner.         │
├──────────────────────────────────────────────────────┤
│  [SOCIAL PROOF BAR] — dark strip, 4 icons + text     │
├──────────────────────────────────────────────────────┤
│  [CATEGORY TILES]                                    │
│  4 tiles — bento-style, NOT uniform grid             │
│  1 large (Áo Thun) + 1 medium (Quần Short)           │
│  + 2 small stacked (Combo / Sale)                    │
├──────────────────────────────────────────────────────┤
│  [AI RECOMMENDATIONS] — "Gợi ý cho bạn"             │
│  Horizontal scroll. 4 product cards.                 │
│  Badge: "Dựa trên lịch sử mua" (logged-in)          │
│  OR "Đang trending" (guest)                          │
├──────────────────────────────────────────────────────┤
│  [COOLCLUB BANNER]                                   │
│  Dark bg, 4 tier icons, tier progress (if logged-in) │
│  CTA → /coolclub                                     │
├──────────────────────────────────────────────────────┤
│  [BESTSELLER STRIP]                                  │
│  "Bán chạy nhất" — 6 product cards horizontal       │
├──────────────────────────────────────────────────────┤
│  [FOOTER]                                            │
└──────────────────────────────────────────────────────┘
```

**Hero composition:**
```
┌─────────────────────────────────────────────────────────┐
│                                          ┌────────────┐ │
│  Mặc đẹp.                                │  SILVER ✦  │ │
│  Sống khoẻ.         [lifestyle image]    │  Tuấn      │ │
│                     [portrait/model]     └────────────┘ │
│  Thể thao & đời thường                                  │
│  — một bộ trang phục.                                   │
│                                                         │
│  [Khám phá ngay]  [Bộ sưu tập hè]                      │
│                                                         │
│                         Scroll ↓                        │
└─────────────────────────────────────────────────────────┘
```

---

### 3.3 Product Listing (`/products`)

```
┌──────────────────────────────────────────────────────┐
│  HEADER                                              │
├──────┬───────────────────────────────────────────────┤
│      │  [FILTER BAR — top, horizontal on desktop]    │
│      │  Danh mục · Màu · Size · Giá · Sắp xếp       │
│  S   │                                               │
│  I   │  [ACTIVE FILTER CHIPS]                        │
│  D   │  × Áo Thun  × Size L  × Giá 200–500k         │
│  E   ├───────────────────────────────────────────────┤
│  B   │                                               │
│  A   │  [PRODUCT GRID — 4 col desktop, 2 col mobile] │
│  R   │                                               │
│      │  [ProductCard] × n                            │
│      │                                               │
│      │  [Load more / Pagination]                     │
└──────┴───────────────────────────────────────────────┘
```

**ProductCard anatomy:**
```
┌─────────────────┐
│  ♡           🔖 │  ← wishlist heart | badge (BESTSELLER/MỚI)
│                 │
│   [image 4:5]   │  ← hover: scale 1.03 + show "Thêm vào giỏ" overlay
│                 │
├─────────────────┤
│  ⬤ ⬤ ⬤ +2    │  ← color swatches
│  Áo Thun Basic  │
│  299.000 ₫      │  ← gold color
│  + 21k CoolCash │  ← chỉ show nếu logged-in
└─────────────────┘
```

**Hover state:** slide-up overlay "Thêm vào giỏ" với accent button  
**Out of stock:** gray overlay + "Hết hàng" + swatch gạch chéo

---

### 3.4 Product Detail (`/products/[id]`)

```
Desktop layout — 60/40 split:

┌───────────────────────┬──────────────────────────┐
│                       │  Áo Thun > Áo Thun Basic │  ← breadcrumb
│   [MAIN IMAGE]        │                          │
│   4:5 ratio           │  BESTSELLER              │  ← badge
│   zoom on hover       │  Áo Thun Basic Premium   │  ← h1, Playfair
│                       │  299.000 ₫               │  ← gold, large
│                       │  + 21.000 CoolCash ›     │
│  [thumb] [thumb] [...] │                          │
│                       │  Màu sắc:                │
│                       │  ⬤ Trắng  ⬤ Đen  ⬤ Navy │
│                       │  "Đang chọn: Trắng"      │
│                       │                          │
│                       │  Size:                   │
│                       │  [S] [M] [L] [XL] [~~2XL~~] │  ← 2XL hết hàng
│                       │  Xem bảng size ›         │
│                       │                          │
│                       │  [──────────────────────]│  ← divider
│                       │  Số lượng: [- 1 +]       │
│                       │                          │
│                       │  [  Thêm vào giỏ hàng  ] │  ← primary, full-width
│                       │  [♡  Thêm vào wishlist ]  │  ← ghost
│                       │                          │
│                       │  🪙 Tích 21.000 CoolCash │
│                       │  🚚 Miễn phí ship (Silver)│
│                       │  ↩ Đổi trả 30 ngày      │
└───────────────────────┴──────────────────────────┘

[TABS: Mô tả | Thông số | Giặt ủi | Đánh giá (4.8★ · 256)]

[AI RECOMMENDATIONS: "Khách mua cũng mua..."]
```

**Combo indicator** (COMBO-SUM-001):
```
┌──────────────────────────────────────────────┐
│  📦 Combo này bao gồm:                       │
│  [img] Áo Thun Basic Premium (M/Trắng)       │
│  [img] Quần Short Thể Thao Pro (30/Đen)      │
│                                              │
│  ✅ Tiết kiệm 99.000 ₫ so với mua lẻ        │
└──────────────────────────────────────────────┘
```

---

### 3.5 Cart Page (`/cart`)

```
Desktop layout — 65/35 split:

┌────────────────────────────────┬─────────────────────┐
│  GIỎ HÀNG (3 sản phẩm)         │  TỔNG ĐƠN HÀNG      │
│                                │                     │
│  ┌──────────────────────────┐  │  Tạm tính: 648.000  │
│  │[img] Áo Thun Basic       │  │  Ship:      0 ₫ ✓   │
│  │      L / Đen             │  │  ─────────────────  │
│  │      [- 1 +]  299.000 ₫  │  │  Tổng:    648.000   │
│  │                      [🗑] │  │                     │
│  └──────────────────────────┘  │  🪙 185.500 CoolCash │
│                                │  [x] Dùng 100.000 ₫  │
│  ┌──────────────────────────┐  │  → Còn lại: 548.000  │
│  │[img] COMBO Set Summer    │  │                     │
│  │  ↳ AT-BASIC M/Trắng      │  │  ████████░░ 70%     │
│  │  ↳ QS-PRO 30/Đen         │  │  Gold: thêm 900k ›  │
│  │      [- 1 +]  549.000 ₫  │  │                     │
│  └──────────────────────────┘  │  [Tiến hành thanh   │
│                                │   toán            ] │
│  "Có thể bạn cũng thích..."    │                     │
│  [product carousel]            │  hoặc               │
│                                │  [← Tiếp tục mua]   │
└────────────────────────────────┴─────────────────────┘
```

**Free shipping bar (Bronze user):**
```
──────────────────────────────────────────────────────
🚚  Mua thêm 102.000 ₫ để được miễn phí vận chuyển
    [══════════════════────────]  70%
──────────────────────────────────────────────────────
```

---

### 3.6 Checkout (`/checkout`)

**Step progress bar:**
```
① Thông tin  ──────  ② Thanh toán  ──────  ③ Xác nhận
```

**Step 1 — Địa chỉ giao hàng:**
```
┌────────────────────────────────────────────────┐
│  Xưng hô:  ○ Anh    ● Chị                     │
│                                                │
│  Địa chỉ giao hàng                            │
│  ○ 15 Nguyễn Huệ, Q1, HCM  [Mặc định]        │
│  ○ Văn phòng — 123 Lê Lợi, Q1, HCM            │
│  + Thêm địa chỉ mới                           │
│                                                │
│  Giao cho người khác?  [ toggle ]             │
│  (nếu bật → hiện thêm trường họ tên + SĐT)    │
│                                                │
│  Ghi chú: [                              ]    │
│                                                │
│               [Tiếp tục →]                    │
└────────────────────────────────────────────────┘
```

**Step 2 — Thanh toán:**
```
┌────────────────────────────────────────────────┐
│  Phương thức thanh toán                        │
│                                                │
│  ○ 💳 VNPay   — QR / thẻ nội địa             │
│  ○ 📱 MoMo    — Ví điện tử                    │
│  ○ 🔷 ZaloPay — Ví ZaloPay                    │
│  ○ 💵 COD     — Thanh toán khi nhận hàng      │
│                                                │
│  [← Quay lại]        [Đặt hàng (548.000 ₫) →] │
└────────────────────────────────────────────────┘
```

**Step 3 — Success:**
```
┌────────────────────────────────────────────────┐
│          ✅                                    │
│   Đặt hàng thành công!                         │
│   Mã đơn: FS-2024-0089                         │
│                                                │
│   📦 Giao trong 2–3 ngày làm việc              │
│   🚚 GHN Express · GHNE20240523001             │
│   🪙 Bạn vừa tích 43.840 CoolCash              │
│                                                │
│   [Xem đơn hàng]   [Tiếp tục mua sắm]         │
└────────────────────────────────────────────────┘
```

---

### 3.7 Auth Pages (`/login`, `/register`)

**Layout:** Split — lifestyle image left (hidden mobile) + form right

```
┌──────────────────────┬────────────────────────────┐
│                      │  FASHIONOS                 │
│  [lifestyle image    │                            │
│   — model wearing    │  Đăng nhập                 │
│   outfit, dark       │                            │
│   editorial style]   │  Email                     │
│                      │  [                    ]    │
│                      │                            │
│                      │  Mật khẩu                  │
│                      │  [                    ]    │
│                      │  [Quên mật khẩu?]          │
│                      │                            │
│                      │  [   Đăng nhập   ]         │
│                      │                            │
│                      │  ──── hoặc ────            │
│                      │  [G Google] [f Facebook]   │
│                      │                            │
│                      │  Chưa có tài khoản?        │
│                      │  Đăng ký ngay →            │
└──────────────────────┴────────────────────────────┘
```

---

### 3.8 Account Portal (`/account/*`)

**Layout:** Sidebar left + content right (desktop), tab bar (mobile)

**Sidebar:**
```
┌─────────────────────┐
│  [avatar initials]  │
│  Nguyễn Minh Tuấn   │
│  ✦ SILVER           │
│  185.500 ₫ 🪙       │
├─────────────────────┤
│  📦 Đơn hàng        │  ← active
│  🏠 Địa chỉ         │
│  🪙 CoolCash        │
│  👑 CoolClub        │
│  ❤️  Wishlist        │
│  ↩  Đổi trả         │
│  ⚙️  Cài đặt         │
│  ─────────────────  │
│  Đăng xuất          │
└─────────────────────┘
```

**Orders table:**
```
┌──────────────┬────────────┬───────────┬──────────────┬──────────────────┐
│ Mã đơn       │ Ngày       │ Tổng      │ Trạng thái   │ Thao tác         │
├──────────────┼────────────┼───────────┼──────────────┼──────────────────┤
│ FS-2024-0089 │ 25/05/2024 │ 648.000 ₫ │ 🔵 Đang giao │ Chi tiết · Hoàn  │
│ FS-2024-0071 │ 10/05/2024 │ 299.000 ₫ │ ✅ Hoàn thành│ Chi tiết · Mua lại│
└──────────────┴────────────┴───────────┴──────────────┴──────────────────┘
```

**Order Detail — Timeline:**
```
✅ Đặt hàng     ✅ Xác nhận    ✅ Lấy hàng    🔵 Đang giao   ○ Đã nhận
25/05 09:00     25/05 09:30    25/05 14:00    25/05 16:00
```

---

### 3.9 CoolClub Page (`/coolclub`)

**Sections:**
```
[HERO BANNER] — dark bg, gradient từ bronze → diamond (shimmer animation)
"Chào mừng đến CoolClub"
Sub: "Tích lũy. Lên hạng. Nhận đặc quyền."
```

**Tier cards — horizontal row (NOT table trên mobile):**
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  🥉      │  │  🥈      │  │  🥇      │  │  💎      │
│ BRONZE   │  │ SILVER   │  │  GOLD    │  │ DIAMOND  │
│  0₫      │  │ 1.000.000│  │3.000.000 │  │10.000.000│
│  7%      │  │   8%     │  │  10%     │  │   12%    │
│ 350k+    │  │ Luôn free│  │Luôn free │  │Luôn free │
│ 50k sinh │  │ 100k sinh│  │200k sinh │  │500k sinh │
│   ✗ EA  │  │  ✗ EA   │  │  ✓ EA   │  │  ✓ EA   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Current member progress card:**
```
┌──────────────────────────────────────────────────────┐
│  SILVER  ✦                            Nguyễn Minh Tuấn│
│                                                      │
│  Tổng chi tiêu:  2.100.000 ₫                        │
│                                                      │
│  ████████████░░░░░░░░  70% → Gold                   │
│  Cần thêm 900.000 ₫ để lên hạng Gold               │
│                                                      │
│  Quyền lợi hiện tại: 8% CoolCash · Free ship luôn  │
└──────────────────────────────────────────────────────┘
```

**Referral section:**
```
┌──────────────────────────────────────────┐
│  Giới thiệu bạn bè → nhận 10% CoolCash  │
│                                          │
│  Mã của bạn:  TU-REF-4829  [📋 Copy]    │
│  [📤 Chia sẻ qua Zalo]  [📘 Facebook]   │
│                                          │
│  Đã giới thiệu: 3 người                 │
│  Tổng nhận: 62.400 CoolCash             │
└──────────────────────────────────────────┘
```

---

### 3.10 Returns Portal (`/account/returns`)

**Create return flow — 3-step modal:**
```
Bước 1 / 3 — Chọn sản phẩm
  ☑ AT-BASIC-001 (L/Đen) × 1

Bước 2 / 3 — Lý do
  ○ Sai size  ● Lỗi sản phẩm  ○ Không đúng màu  ○ Không ưng ý
  Mô tả: [Áo bị lỗi đường chỉ ở cổ               ]
  [📎 Upload ảnh — kéo thả hoặc chọn file]

Bước 3 / 3 — Hình thức hoàn tiền
  ● CoolCash (nhận ngay khi duyệt)
  ○ Hoàn về ngân hàng (3–5 ngày làm việc)

[Gửi yêu cầu]
```

**Return status timeline:**
```
✅ Đã gửi  →  🔵 Đang xét duyệt  →  ○ GHN lấy hàng  →  ○ Đã hoàn tiền
28/04 10:00    28/04 14:00
```

---

### 3.11 AI CFO Dashboard (`/dashboard`)

> Admin tool — dark sidebar, data-dense, different visual register.

```
┌──────────────┬──────────────────────────────────────────────────┐
│  FASHIONOS   │  [STATS ROW]                                     │
│  DASHBOARD   │  485M ₫    3.714      4.2%       92.000 ₫        │
│  ──────────  │  Doanh thu  Đơn       Hoàn trả   TB/đơn          │
│  📊 Tổng quan│  ↑ 12%      ↑ 8%     ↓ tốt      ↑ 4%            │
│  💬 AI CFO   │  ──────────────────────────────────────────────  │
│  📈 Doanh thu│                                                  │
│  📦 Đơn hàng │  [AI CFO CHAT INTERFACE]                        │
│  🪙 CoolCash │                                                  │
│  ↩  Hoàn trả │  🤖 FashionOS AI CFO                            │
│  ⚙️  Cài đặt  │                                                  │
│              │  Chào, hôm nay 25/05/2024.                       │
│              │  Doanh thu tháng này: 485M ₫ (+12%)             │
│              │                                                  │
│              │  ┌─────────────────────────────────────────┐    │
│              │  │ 👤 Tháng này tỉ lệ hoàn trả cao không? │    │
│              │  └─────────────────────────────────────────┘    │
│              │                                                  │
│              │  ┌─────────────────────────────────────────┐    │
│              │  │ 🤖 Tỉ lệ hoàn trả: **4.2%** (vs 6.8%  │    │
│              │  │ cùng kỳ). SP hoàn nhiều nhất: Quần     │    │
│              │  │ Short (38%). Lý do: "sai size" (62%)   │    │
│              │  │ → Đề xuất: video hướng dẫn chọn size  │    │
│              │  │ trên trang sản phẩm.                   │    │
│              │  │ 📊 Dữ liệu: 156/3.714 đơn             │    │
│              │  └─────────────────────────────────────────┘    │
│              │                                                  │
│              │  [Nhập câu hỏi...                    ] [Gửi]   │
│              │  Gợi ý: "SP lợi nhuận cao nhất?" | "3 tháng?" │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 4. User Flows

### Flow A — Guest → First Purchase

```
Homepage (cold)
  ↓ clicks category tile "Áo Thun"
Product Listing /products?category=ao-thun
  ↓ selects AT-BASIC-001
Product Detail /products/at-basic-001
  ↓ chọn L / Đen → "Thêm vào giỏ"
  → Cart drawer slide in (mini cart)
  ↓ "Tiến hành thanh toán"
Cart /cart
  ↓ "Tiến hành thanh toán"
  → Prompt: Đăng nhập hoặc tiếp tục không cần tài khoản?
Checkout /checkout Step 1 — địa chỉ (guest form)
  ↓
Checkout Step 2 — VNPay
  ↓
Checkout Step 3 — ✅ Success
  → Prompt: "Tạo tài khoản để theo dõi đơn hàng?"
```

### Flow B — Silver Member → Checkout với CoolCash

```
Homepage (personalized)
  → Header: "Tuấn ✦ SILVER | 🛒²"
  → Hero: "Xin chào Tuấn" floating card
  → Recommendations: "Gợi ý cho bạn" (warm start)
  ↓ thêm COMBO-SUM-001 vào giỏ
  → Add-to-cart animation (bounce icon)
  → Toast: "Đã thêm Combo Set Summer ✓ Xem giỏ hàng"
Cart /cart
  → Free shipping badge ✓ (Silver perk)
  → CoolCash toggle: apply 100.000 ₫
  → Total cập nhật real-time: 648.000 → 548.000 ₫
  ↓
Checkout Step 1 — địa chỉ đã lưu pre-selected
  → Giao cho người khác: OFF
  → Ghi chú: "Giao giờ hành chính"
  ↓
Checkout Step 2 — MoMo
  ↓
Checkout Step 3 — ✅
  → "Bạn vừa tích 43.840 CoolCash (8% × 548.000)"
  → CoolCash balance cập nhật trong header
```

### Flow C — Returns Portal (KF-1)

```
/account/orders
  → FS-2024-0055 | ✅ Hoàn thành
  → click "Yêu cầu đổi trả"
Modal mở — Bước 1: chọn AT-BASIC-001
  ↓
Bước 2: lý do "Lỗi sản phẩm" + ghi chú + upload ảnh
  ↓
Bước 3: chọn "Hoàn về CoolCash"
  ↓
Confirm modal → [Gửi yêu cầu]
Toast: "Yêu cầu đổi trả đã gửi thành công"
/account/returns → RET-2024-003 | 🟡 Chờ duyệt
```

### Flow D — AI CFO Query (KF-4)

```
/dashboard
  → Stats row render với skeleton → dữ liệu thực
AI CFO greeting hiện ra với typing animation
Admin gõ: "Sản phẩm nào đang giảm doanh thu nhất?"
  → Loading indicator (3 dots bounce)
  → Response ≤ 3s:
    Narrative + data table + recommended actions
Admin click "Xuất báo cáo PDF" → download
```

### Flow E — Size Out of Stock (Edge case)

```
Product Detail — AT-BASIC-001
Chọn Đen → size 2XL
  → 2XL chip: gạch chéo + cursor not-allowed
  → Tooltip: "Size 2XL / Đen hiện đã hết hàng"
  → Prompt: "Thông báo cho tôi khi có hàng?" [✓]
  → Toast: "Đã đăng ký nhận thông báo"
  → "Thêm vào giỏ" button: disabled
Chọn sang XL / Đen → button enabled
  → "Thêm vào giỏ"
```

---

## 5. Component Inventory

### Layout Components
| Component | Path | Priority |
|-----------|------|----------|
| `Header` | `components/layout/Header.tsx` | P0 — upgrade |
| `MegaMenu` | `components/layout/MegaMenu.tsx` | P0 |
| `MobileDrawer` | `components/layout/MobileDrawer.tsx` | P0 |
| `Footer` | `components/layout/Footer.tsx` | P1 — upgrade |
| `CartDrawer` | `components/layout/CartDrawer.tsx` | P0 |
| `SearchOverlay` | `components/layout/SearchOverlay.tsx` | P2 |

### Page-specific Components
| Component | Path | Priority |
|-----------|------|----------|
| `HeroSection` | `components/home/HeroSection.tsx` | P0 |
| `CategoryBentoGrid` | `components/home/CategoryBentoGrid.tsx` | P0 |
| `RecommendationCarousel` | `components/home/RecommendationCarousel.tsx` | P0 |
| `CoolClubBanner` | `components/home/CoolClubBanner.tsx` | P1 |
| `SocialProofBar` | `components/home/SocialProofBar.tsx` | P1 |
| `ProductGrid` | `components/products/ProductGrid.tsx` | P0 |
| `ProductCard` | `components/products/ProductCard.tsx` | P0 |
| `FilterPanel` | `components/products/FilterPanel.tsx` | P0 |
| `ActiveFilterChips` | `components/products/ActiveFilterChips.tsx` | P1 |
| `ImageGallery` | `components/product/ImageGallery.tsx` | P0 |
| `VariantSelector` | `components/product/VariantSelector.tsx` | P0 |
| `SizeGuideModal` | `components/product/SizeGuideModal.tsx` | P1 |
| `ComboDetails` | `components/product/ComboDetails.tsx` | P1 |
| `ProductTabs` | `components/product/ProductTabs.tsx` | P1 |
| `CartItem` | `components/cart/CartItem.tsx` | P0 |
| `OrderSummary` | `components/cart/OrderSummary.tsx` | P0 |
| `CoolCashToggle` | `components/cart/CoolCashToggle.tsx` | P0 |
| `FreeShippingBar` | `components/cart/FreeShippingBar.tsx` | P1 |
| `CheckoutSteps` | `components/checkout/CheckoutSteps.tsx` | P0 |
| `AddressSelector` | `components/checkout/AddressSelector.tsx` | P0 |
| `PaymentSelector` | `components/checkout/PaymentSelector.tsx` | P0 |
| `OrderSuccess` | `components/checkout/OrderSuccess.tsx` | P0 |
| `AccountSidebar` | `components/account/AccountSidebar.tsx` | P0 |
| `OrderTable` | `components/account/OrderTable.tsx` | P0 |
| `OrderTimeline` | `components/account/OrderTimeline.tsx` | P1 |
| `TierCard` | `components/coolclub/TierCard.tsx` | P0 |
| `TierProgress` | `components/coolclub/TierProgress.tsx` | P0 |
| `ReferralCard` | `components/coolclub/ReferralCard.tsx` | P1 |
| `ReturnForm` | `components/returns/ReturnForm.tsx` | P1 |
| `ReturnTimeline` | `components/returns/ReturnTimeline.tsx` | P1 |
| `AIChatInterface` | `components/dashboard/AIChatInterface.tsx` | P1 |
| `StatCard` | `components/dashboard/StatCard.tsx` | P1 |

### UI Primitives
| Component | Path | Note |
|-----------|------|------|
| `Button` | `components/ui/Button.tsx` | variant: primary/ghost/danger |
| `Badge` | `components/ui/Badge.tsx` | BESTSELLER/MỚI/COMBO/tier |
| `Input` | `components/ui/Input.tsx` | + error state |
| `QuantityStepper` | `components/ui/QuantityStepper.tsx` | min/max aware |
| `ColorSwatch` | `components/ui/ColorSwatch.tsx` | selected/disabled state |
| `SizeChip` | `components/ui/SizeChip.tsx` | available/selected/OOS |
| `Toast` | `components/ui/Toast.tsx` | 4 variants |
| `Modal` | `components/ui/Modal.tsx` | with backdrop |
| `Skeleton` | `components/ui/Skeleton.tsx` | card/text/stat variants |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | animated fill |
| `Tabs` | `components/ui/Tabs.tsx` | product detail tabs |
| `Accordion` | `components/ui/Accordion.tsx` | FAQ |

---

## 6. Implementation Phases

### Phase 1 — Foundation (P0, ~3 ngày)

**Mục tiêu:** App chạy được, nhìn có hồn, flow cơ bản end-to-end hoạt động.

```
Day 1:
  - [ ] globals.css — CSS variables đầy đủ (colors, spacing, radius, motion)
  - [ ] tailwind.config.ts — mở rộng thêm tokens còn thiếu
  - [ ] components/ui/Button, Badge, Input, Skeleton
  - [ ] components/layout/Header — upgrade nav + CartIconBadge
  - [ ] components/layout/Footer — upgrade
  - [ ] app/page.tsx — HOME: HeroSection + SocialProofBar

Day 2:
  - [ ] components/home/CategoryBentoGrid
  - [ ] components/home/RecommendationCarousel (static data trước)
  - [ ] components/products/ProductCard — với hover state đầy đủ
  - [ ] components/products/ProductGrid
  - [ ] components/products/FilterPanel
  - [ ] app/products/page.tsx — kết nối API

Day 3:
  - [ ] components/product/ImageGallery
  - [ ] components/product/VariantSelector (color + size + OOS logic)
  - [ ] components/ui/QuantityStepper, ColorSwatch, SizeChip
  - [ ] app/products/[id]/page.tsx — kết nối API đầy đủ
  - [ ] AddToCartButton — với animation
```

### Phase 2 — Commerce Core (P0, ~3 ngày)

```
Day 4:
  - [ ] components/layout/CartDrawer — slide-in panel
  - [ ] components/cart/CartItem, OrderSummary, CoolCashToggle
  - [ ] app/cart/page.tsx — full layout với CoolCash logic

Day 5:
  - [ ] components/checkout/CheckoutSteps, AddressSelector, PaymentSelector
  - [ ] app/checkout/page.tsx — 3-step flow
  - [ ] components/checkout/OrderSuccess

Day 6:
  - [ ] app/login/page.tsx — split layout
  - [ ] app/register/page.tsx — split layout
  - [ ] lib/auth.ts — JWT handling
  - [ ] Conditional rendering theo login state (header, CoolCash, free ship)
```

### Phase 3 — Account & Loyalty (P1, ~3 ngày)

```
Day 7:
  - [ ] components/account/AccountSidebar
  - [ ] app/account/page.tsx — orders list
  - [ ] app/account/orders/[id]/page.tsx — timeline

Day 8:
  - [ ] app/account/coolcash/page.tsx
  - [ ] app/coolclub/page.tsx — TierCard, TierProgress, ReferralCard
  - [ ] components/home/CoolClubBanner

Day 9:
  - [ ] app/account/returns/page.tsx — ReturnForm modal
  - [ ] app/account/wishlist/page.tsx
```

### Phase 4 — Killer Features UI (P1, ~2 ngày)

```
Day 10:
  - [ ] app/dashboard/page.tsx — AI CFO interface
  - [ ] components/dashboard/AIChatInterface, StatCard
  - [ ] Streaming response UI (typewriter effect)

Day 11:
  - [ ] RecommendationCarousel kết nối API thật (KF-5)
  - [ ] MegaMenu desktop
  - [ ] MobileDrawer
  - [ ] SearchOverlay
```

### Phase 5 — Polish & QA (P2, ~2 ngày)

```
Day 12:
  - [ ] Responsive pass — 320/375/768/1024/1440
  - [ ] Dark mode check (header/footer đã dark, cần test contrast)
  - [ ] Skeleton loading states trên tất cả async sections
  - [ ] Error states + empty states

Day 13:
  - [ ] Motion/animation pass — hero entrance, cart add bounce
  - [ ] Accessibility pass — keyboard nav, focus rings, ARIA
  - [ ] Toast notification system đầy đủ
  - [ ] Performance: lazy load images, route prefetch
```

---

## 7. API Integration Map

| Page/Component | API Endpoint | Method |
|----------------|-------------|--------|
| `RecommendationCarousel` | `/api/recommendations/for-me` | GET |
| `ProductGrid` | `/catalog/products` | GET |
| `ProductDetail` | `/catalog/products/:id` | GET |
| `CategoryMenu` | `/catalog/categories` | GET |
| `CartDrawer` / Cart page | `/cart` | GET |
| `AddToCartButton` | `/cart/items` | POST |
| `QuantityStepper` | `/cart/items/:line_id` | PUT |
| `CartItem` delete | `/cart/items/:line_id` | DELETE |
| `CheckoutStep2` | `/cart/checkout` | POST |
| `AddressSelector` | `/account/addresses` | GET |
| `AccountOrders` | `/account/orders` (custom) | GET |
| `CoolCashPage` | `/account/coolcash` (custom) | GET |
| `Login` | `/auth/login` | POST |
| `Register` | `/auth/register` | POST |
| `AICFOChat` | `/api/ai/query` (KF-4) | POST |

> Note: Một số endpoints như `/account/orders`, `/account/coolcash` chưa có trong `fashion_store_api` → cần implement backend song song.

---

## 8. Quy ước Code

```
components/
├── ui/          # primitives — không có business logic
├── layout/      # header, footer, nav — có global state
├── home/        # homepage sections
├── products/    # listing page
├── product/     # detail page (singular)
├── cart/        # cart page + drawer
├── checkout/    # checkout flow
├── account/     # account portal
├── coolclub/    # CoolClub page
├── returns/     # returns portal
└── dashboard/   # AI CFO dashboard

app/
├── page.tsx              # homepage
├── products/page.tsx     # listing
├── products/[id]/page.tsx # detail
├── cart/page.tsx
├── checkout/page.tsx
├── login/page.tsx
├── register/page.tsx
├── account/
│   ├── page.tsx          # orders
│   ├── orders/[id]/page.tsx
│   ├── addresses/page.tsx
│   ├── coolcash/page.tsx
│   ├── wishlist/page.tsx
│   └── returns/page.tsx
├── coolclub/page.tsx
└── dashboard/page.tsx

lib/
├── api.ts          # axios/fetch wrapper
├── auth.ts         # JWT helpers
├── format.ts       # formatVND(), formatDate()
├── types.ts        # shared TS types
└── constants.ts    # API_BASE, tier thresholds, etc.
```

**Naming:**
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Utils: `camelCase`
- CSS variables: `--color-`, `--text-`, `--space-`, `--radius-`, `--duration-`

---

## 9. Quality Gates

Trước khi merge mỗi phase:

- [ ] Không có generic AI-looking UI — mỗi page có point of view rõ ràng
- [ ] Typography và spacing intentional (không phải padding đồng đều)
- [ ] Color và motion hỗ trợ product thay vì decorate ngẫu nhiên
- [ ] Responsive tại 375px (iPhone) và 1440px (desktop)
- [ ] Skeleton loading trên mọi async section
- [ ] Error states và empty states đã có
- [ ] Không có console.log trong production code
- [ ] Vietnamese copy 100% — không có English text lộ ra UI
