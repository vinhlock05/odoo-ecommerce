# BRD — Fashion Store eCommerce Platform
**Version:** 2.0  
**Date:** 2026-05-26  
**Status:** Draft — Based on Coolmate Case Study  
**Platform Target:** Odoo v19 (Website + eCommerce)  
**Reference Brand:** Coolmate (coolmate.me) — phân tích thực tế tháng 05/2026

---

## 1. Tổng quan Dự án

### 1.1 Mục tiêu Kinh doanh

Xây dựng một **platform eCommerce thời trang** chạy trên Odoo v19, bám sát luồng nghiệp vụ thực tế của thương hiệu Coolmate (brand thời trang nam Việt Nam), có khả năng:

1. Vận hành cửa hàng thời trang trực tuyến đầy đủ (catalog → biến thể → giỏ hàng + checkout 1 trang → fulfillment).
2. Phục vụ **nhiều website / thương hiệu độc lập** từ một database Odoo duy nhất (Multi-Website).
3. Quản lý chương trình loyalty **CoolCash** (điểm hoàn tiền có giá trị như tiền mặt) và **CoolClub** (hạng thành viên theo mức chi tiêu).
4. Dễ dàng **bàn giao cho đối tác** với cấu hình bật/tắt tính năng qua Settings, không chỉnh code.

### 1.2 Case Study Reference — Coolmate

| Thuộc tính | Giá trị quan sát được |
|------------|----------------------|
| URL Collection | `/collection/{slug}` (ví dụ: `/collection/ao-thun-nam`) |
| URL Sản phẩm | `/product/{slug}?color={color-slug}` |
| URL Giỏ hàng | `/cart` — kết hợp cart + checkout trên 1 trang |
| Loyalty URL | `/coolclub` |
| Navigation phân tầng | Nam / Nữ → danh mục con (Áo thun, Quần short, ...) |
| Checkout style | **Single-page**: form giao hàng + giỏ hàng trên 1 màn hình |
| Thanh toán | COD (tab dưới), VNPay, MoMo, ZaloPay |
| Social login | Google, Facebook, Zalo (QR via Zalo Mini App) |
| Loyalty currency | **CoolCash** — 1 CoolCash = 1 VNĐ khi thanh toán |
| Membership tiers | Dựa trên tổng chi tiêu (spending threshold) |
| Referral | 10% CoolCash trên đơn đầu tiên của bạn bè |

### 1.3 Stakeholders

| Vai trò | Mô tả |
|---------|-------|
| Store Manager | Quản lý sản phẩm, đơn hàng, khuyến mãi |
| Customer | Mua hàng online (guest hoặc đăng ký tài khoản) |
| Warehouse Staff | Xử lý xuất kho, đóng gói, giao hàng |
| Finance Staff | Xuất hoá đơn, đối soát thanh toán |
| Partner Admin | Quản trị 1 website trong hệ thống multi-website |
| System Admin | Cấu hình tổng thể, bật/tắt feature, quản lý multi-company |

### 1.4 Phạm vi (Scope)

**Trong scope:**
- Quản lý sản phẩm thời trang (biến thể Size × Màu sắc, image swatch)
- Catalog theo Collection URL (`/collection/{slug}`)
- Single-page Cart + Checkout (`/cart`)
- Thanh toán: COD, VNPay, MoMo, ZaloPay, chuyển khoản
- Quản lý kho và trạng thái tồn kho per variant (greyed-out, không ẩn)
- Loyalty: CoolCash (cashback currency) + CoolClub (tiered membership)
- Referral program
- Gift promotions trong giỏ hàng (tặng sản phẩm theo ngưỡng đơn hàng)
- Social login: Google, Facebook, Zalo
- Kiến trúc Multi-Website (1 database, nhiều domain)
- Feature flags cho các tính năng nâng cao

**Ngoài scope:**
- Hệ thống POS (bán tại quầy)
- Mobile App native (iOS/Android)
- Marketplace (bán hàng của bên thứ ba)
- Tích hợp sàn TMĐT (Shopee, Lazada, Tiki)
- Email marketing campaign (CRM scope)

---

## 2. Kiến trúc Đa Công ty / Đa Website

### 2.1 Mô hình Triển khai

```
[1 Odoo Database]
       │
       ├── Website A (Đối tác A — ví dụ: Coolmate)
       │     ├── Domain: coolmate.me
       │     ├── Logo, theme riêng
       │     ├── Pricelist riêng
       │     ├── Catalog sản phẩm riêng (hoặc shared)
       │     └── Feature set: CoolCash ON, CoolClub ON, Referral ON
       │
       └── Website B (Đối tác B — brand khác)
             ├── Domain: brand-b.com
             ├── Logo, theme riêng
             ├── Pricelist riêng
             ├── Catalog sản phẩm riêng
             └── Feature set: CoolCash OFF, Loyalty points standard
```

### 2.2 Yêu cầu Multi-Website

| Yêu cầu | Mô tả |
|---------|-------|
| MW-01 | Mỗi website có domain riêng, SSL riêng |
| MW-02 | Mỗi website có logo, favicon, color scheme riêng |
| MW-03 | Sản phẩm có thể thuộc về 1 hoặc nhiều website |
| MW-04 | Pricelist có thể khác nhau giữa các website |
| MW-05 | Đơn hàng từ mỗi website được tag theo nguồn website |
| MW-06 | Mỗi website có thể có Payment Provider riêng |
| MW-07 | Shipping methods có thể khác nhau giữa các website |
| MW-08 | Customer account dùng chung hoặc tách biệt theo website (configurable) |
| MW-09 | SEO settings (meta, sitemap) độc lập per website |
| MW-10 | Analytics tracking code độc lập per website |
| MW-11 | CoolClub / Loyalty program cấu hình riêng per website |

### 2.3 Multi-Company Support

Khi đối tác yêu cầu tách biệt hoàn toàn về pháp lý:

| Yêu cầu | Mô tả |
|---------|-------|
| MC-01 | Mỗi website có thể gắn với 1 Company riêng trong Odoo |
| MC-02 | Hoá đơn xuất theo Company tương ứng |
| MC-03 | Kho hàng có thể tách riêng theo Company |
| MC-04 | Báo cáo doanh thu tách biệt theo Company |

---

## 3. Feature Flags — Cấu hình Bật/Tắt

### 3.1 Nguyên tắc

> Mọi tính năng nâng cao phải được thiết kế dưới dạng **có thể bật/tắt qua Odoo Settings (`res.config.settings`)**, không hardcode. Khi bàn giao cho đối tác, team chỉ cần toggle — không chỉnh code.

### 3.2 Danh sách Feature Flags

| Flag | Tên Tính năng | Default | Tác động khi OFF |
|------|--------------|---------|-----------------|
| FF-01 | Wishlist (Sản phẩm yêu thích) | ON | Ẩn nút "Thêm vào wishlist", ẩn trang `/wishlist` |
| FF-02 | Product Comparison | OFF | Ẩn nút so sánh trên catalog |
| FF-03 | Multi-Warehouse | OFF | Chỉ hiện 1 kho mặc định, ẩn chọn kho |
| FF-04 | Stock Display (greyed-out) | ON | Ẩn hoàn toàn variant hết hàng thay vì greyed |
| FF-05 | Guest Checkout | ON | Bắt buộc đăng ký tài khoản trước khi mua |
| FF-06 | CoolCash Loyalty | OFF | Ẩn toàn bộ CoolCash UI (cashback, balance, thanh toán) |
| FF-07 | CoolClub Membership Tiers | OFF | Không phân hạng thành viên, ẩn trang `/coolclub` |
| FF-08 | Referral Program | OFF | Ẩn referral code field tại checkout và trang referral |
| FF-09 | Gift Card | OFF | Ẩn gift card purchase và redemption |
| FF-10 | Coupon / Promo Code | ON | Ẩn ô nhập mã giảm giá tại checkout |
| FF-11 | Free Gift Promotion (cart) | ON | Tắt tặng sản phẩm miễn phí theo ngưỡng đơn hàng |
| FF-12 | Abandoned Cart Email | OFF | Tắt automation email nhắc giỏ hàng |
| FF-13 | Click & Collect | OFF | Ẩn option lấy hàng tại cửa hàng |
| FF-14 | Product Reviews | OFF | Ẩn section review, không nhận submit |
| FF-15 | Recently Viewed Products | ON | Tắt tracking + widget sản phẩm đã xem |
| FF-16 | AI SEO Auto-generate | OFF | Tắt AI meta description generation |
| FF-17 | Social Login (Google/Facebook) | ON | Ẩn nút social login, chỉ dùng email/password |
| FF-18 | Social Login Zalo | OFF | Ẩn riêng nút Zalo (khác Google/Facebook về dependency) |
| FF-19 | Alternate Receiver Field | ON | Ẩn field "người nhận thay" tại checkout |
| FF-20 | Gender Title (Anh/Chị) | ON | Ẩn dropdown giới tính trong form checkout |

---

## 4. Yêu cầu Chức năng

### 4.1 Quản lý Sản phẩm

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| PRD-01 | Tạo sản phẩm với tên, mô tả, hình ảnh, giá bán | |
| PRD-02 | Biến thể theo **Loại** (image swatch tròn, URL param `?color={slug}`) và **Kích thước** (text button: XS/S/M/L/XL/XXL) | Loại = màu + chất liệu kết hợp |
| PRD-03 | Mỗi biến thể có SKU/Internal Reference riêng | |
| PRD-04 | Mỗi biến thể có thể có giá riêng (price extra) | |
| PRD-05 | Mỗi variant Loại có **hình ảnh riêng** — chuyển ảnh khi đổi màu | Coolmate: ảnh thay đổi theo `?color=` |
| PRD-06 | Variant hết hàng hiển thị **greyed-out** (disabled), không bị ẩn | Coolmate: M, XL greyed — user thấy nhưng không chọn được |
| PRD-07 | Phân loại sản phẩm theo Category (Áo thun / Quần short / Áo Polo ...) | |
| PRD-08 | Sản phẩm thuộc **Collection** — 1 sản phẩm có thể thuộc nhiều Collection | Coolmate: `/collection/{slug}` |
| PRD-09 | Gắn Tags cho sản phẩm (New Arrival, Sale, Bestseller, ...) | |
| PRD-10 | Cấu hình nhiều Pricelist (giá thường, giá sale, giá B2B) | |
| PRD-11 | Sản phẩm có thể publish/unpublish trên từng website riêng | MW-03 |
| PRD-12 | Thông số kỹ thuật sản phẩm theo nhóm: Công nghệ / Chất liệu / Kiểu dáng / Phù hợp / Tính năng / Bảo quản | Coolmate product spec format |
| PRD-13 | Hiển thị CoolCash cashback ước tính per sản phẩm ("Được hoàn lên đến X CoolCash") | FF-06 |

### 4.2 Cửa hàng Online — Catalog & Tìm kiếm

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| CAT-01 | Trang collection liệt kê sản phẩm dạng grid | URL: `/collection/{slug}` |
| CAT-02 | Hỗ trợ **gender filter** qua URL param (`?gender_type=male`) | Coolmate: `/collection/san-pham-moi?gender_type=male` |
| CAT-03 | Lọc sản phẩm theo Attribute: Size, Loại (màu), Category, Giá | Faceted search |
| CAT-04 | Sắp xếp: Mới nhất, Giá tăng, Giá giảm, Nổi bật, Bán chạy nhất | |
| CAT-05 | Tìm kiếm full-text theo tên, mô tả, SKU | |
| CAT-06 | Trang product detail: gallery ảnh, mô tả, chọn Loại (image swatch), chọn Size, số lượng, thêm giỏ hàng | |
| CAT-07 | Chọn Loại (màu) → URL cập nhật `?color={slug}` + ảnh thay đổi | Deep link per variant color |
| CAT-08 | Hiển thị giá theo pricelist đang áp dụng | |
| CAT-09 | Hiển thị trạng thái tồn kho per variant (greyed-out nếu hết, không ẩn) | FF-04 |
| CAT-10 | Cross-sell carousel: gợi ý sản phẩm kèm theo / bộ sản phẩm | Coolmate: "Cool Set" trên product page |
| CAT-11 | Navigation phân tầng: Nam/Nữ → danh mục con → collection cụ thể | Mega menu như Coolmate |
| CAT-12 | SEO: URL thân thiện (`/collection/ao-thun-nam`), meta title, meta description | AI SEO — FF-16 |
| CAT-13 | Breadcrumb navigation | |

### 4.3 Giỏ hàng

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| CRT-01 | Thêm sản phẩm vào giỏ (với Loại + Size đã chọn) | |
| CRT-02 | Xem giỏ hàng: danh sách sản phẩm, số lượng, giá, ảnh variant | |
| CRT-03 | Stepper cập nhật số lượng; nút xoá sản phẩm khỏi giỏ | |
| CRT-04 | Nhập mã giảm giá / coupon | FF-10 |
| CRT-05 | Nhập referral code của bạn bè | FF-08 |
| CRT-06 | **Free Gift Promotion**: hiển thị carousel sản phẩm tặng kèm dựa trên ngưỡng giá trị đơn hàng | Coolmate: GIFTPROMAXS1, TOTECOOL |
| CRT-07 | Thanh toán bằng CoolCash (deduct từ balance) | FF-06 |
| CRT-08 | Hiển thị tổng tiền, tiết kiệm được, phí ship dự kiến | |
| CRT-09 | Mini cart hiển thị ở header | |
| CRT-10 | Giỏ hàng lưu giữa session (đăng nhập lại vẫn còn) | |
| CRT-11 | Abandoned cart recovery email tự động | FF-12 |

### 4.4 Checkout — Single-Page Flow

> **Insight từ Coolmate:** Cart và Checkout nằm trên **1 trang duy nhất** (`/cart`). Khách hàng điền form giao hàng và thấy tóm tắt đơn hàng cùng lúc — không phải wizard nhiều bước. Đây là **gap** so với Odoo default (multi-step checkout wizard).

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| CHK-01 | **Single-page checkout**: form giao hàng (trái) + order summary (phải) trên 1 trang `/cart` | Gap: Odoo default là multi-step |
| CHK-02 | Form giao hàng: Họ tên, **Danh xưng (Anh/Chị)** (dropdown), Số điện thoại, Email | FF-20 cho Danh xưng |
| CHK-03 | Form giao hàng: Tỉnh/Thành, Quận/Huyện, Phường/Xã, Địa chỉ cụ thể | |
| CHK-04 | **Alternate receiver**: Checkbox "Giao cho người khác" → form tên + SĐT người nhận thay | FF-19 |
| CHK-05 | Cho phép checkout không cần đăng ký (Guest Checkout) | FF-05 |
| CHK-06 | Lưu địa chỉ vào tài khoản nếu đã đăng nhập | |
| CHK-07 | Chọn phương thức vận chuyển với phí cụ thể | |
| CHK-08 | Order summary luôn hiển thị bên phải: danh sách items, subtotal, ship, giảm giá, tổng | |
| CHK-09 | Chọn phương thức thanh toán (xem mục 4.5) | |
| CHK-10 | Nút **"ĐẶT HÀNG"** CTA duy nhất để xác nhận | |
| CHK-11 | Trang xác nhận đơn hàng sau khi đặt thành công | |
| CHK-12 | Email xác nhận đơn hàng gửi tự động | |
| CHK-13 | Click & Collect: chọn lấy hàng tại cửa hàng | FF-13 |

### 4.5 Thanh toán

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| PAY-01 | **COD** (Thanh toán khi nhận hàng) | Coolmate: hiển thị là tab chính dưới cùng |
| PAY-02 | **VNPay** | Gap — App Store hoặc Custom |
| PAY-03 | **MoMo** | Gap — Custom |
| PAY-04 | **ZaloPay** | Gap — Custom |
| PAY-05 | Chuyển khoản ngân hàng (Wire Transfer) | Native Odoo |
| PAY-06 | Thanh toán bằng **CoolCash** (loyalty balance) | FF-06; Gap — Custom |
| PAY-07 | Kết hợp: CoolCash + phương thức khác trong 1 đơn | FF-06 |
| PAY-08 | Mỗi website cấu hình provider riêng | MW-06 |
| PAY-09 | Webhook xử lý payment callback (VNPay, MoMo, ZaloPay) | |
| PAY-10 | Stripe / thẻ quốc tế (tuỳ chọn cho đối tác) | Native Odoo v19 |

### 4.6 Vận chuyển

| ID | Yêu cầu | Ghi chú |
|----|---------|---------|
| SHP-01 | Miễn phí vận chuyển theo điều kiện (tổng đơn ≥ X VNĐ) | |
| SHP-02 | Phí ship theo trọng lượng hoặc giá trị đơn hàng | |
| SHP-03 | Tích hợp **GHN** (Giao Hàng Nhanh) — realtime rate + tracking | Gap — Custom |
| SHP-04 | Tích hợp **GHTK** (Giao Hàng Tiết Kiệm) | Gap — Custom |
| SHP-05 | Theo dõi trạng thái giao hàng (tracking number) | |
| SHP-06 | Email cập nhật trạng thái giao hàng | |
| SHP-07 | Multi-warehouse: xuất kho từ warehouse phù hợp | FF-03 |

### 4.7 Quản lý Kho hàng

| ID | Yêu cầu | Ghi chú |
|----|---------|---------|
| INV-01 | Theo dõi tồn kho per product variant (Loại × Size) | `website_sale_stock` module |
| INV-02 | Trừ tồn kho tự động khi đơn hàng được confirm | |
| INV-03 | Variant hết hàng → button **greyed-out** (disabled), không ẩn khỏi UI | Coolmate behavior |
| INV-04 | Nhập kho (Purchase Order hoặc manual adjustment) | |
| INV-05 | Cảnh báo tồn kho thấp (low stock alert) | |
| INV-06 | Multi-warehouse management | FF-03 |
| INV-07 | Inventory valuation (FIFO/Average) | |

> **Lưu ý module:** `website_sale` không phụ thuộc vào `stock`. Tính năng tồn kho trên website cần module riêng `website_sale_stock` (requires `stock`).

### 4.8 Quản lý Đơn hàng

| ID | Yêu cầu | Ghi chú |
|----|---------|---------|
| ORD-01 | Xem danh sách đơn hàng, lọc theo trạng thái | |
| ORD-02 | Xem chi tiết đơn hàng | |
| ORD-03 | Luồng trạng thái: New → Confirmed → Processing → Shipped → Delivered → Cancelled | |
| ORD-04 | Tạo Delivery Order (picking) từ Sale Order | |
| ORD-05 | In phiếu giao hàng / packing slip | |
| ORD-06 | Xuất hoá đơn (Invoice) | |
| ORD-07 | Xử lý đổi/trả hàng (Return) và hoàn tiền (Refund) | |
| ORD-08 | Customer portal: khách hàng tự xem đơn hàng, tải hoá đơn | |
| ORD-09 | Đơn hàng được tag theo website nguồn | MW-05 |
| ORD-10 | Báo cáo doanh thu theo ngày/tháng/website/sản phẩm | |

### 4.9 Tài khoản Khách hàng

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| ACC-01 | Đăng ký tài khoản bằng email | |
| ACC-02 | Đăng nhập bằng email / mật khẩu | |
| ACC-03 | **Social login: Google, Facebook** | FF-17 |
| ACC-04 | **Social login: Zalo** (QR code via Zalo Mini App) | FF-18; Gap — Custom (không có trong Odoo core) |
| ACC-05 | Quên mật khẩu / reset password | |
| ACC-06 | Quản lý địa chỉ giao hàng (thêm/sửa/xoá/đặt mặc định) | |
| ACC-07 | Xem lịch sử đơn hàng | |
| ACC-08 | Theo dõi trạng thái đơn hàng hiện tại | |
| ACC-09 | Tải hoá đơn PDF | |
| ACC-10 | Wishlist cá nhân | FF-01 |
| ACC-11 | Xem số dư CoolCash và lịch sử giao dịch | FF-06 |
| ACC-12 | Xem hạng thành viên CoolClub hiện tại và tiến trình lên hạng tiếp theo | FF-07 |
| ACC-13 | Quản lý referral code cá nhân | FF-08 |
| ACC-14 | Đăng ký / huỷ đăng ký nhận email thông báo | |

### 4.10 CoolCash — Loyalty Currency

> **Mô hình Coolmate:** CoolCash là tiền tệ nội bộ có giá trị quy đổi 1:1 với VNĐ khi thanh toán trên website. Khách hàng nhận CoolCash qua mua hàng (cashback %), referral, hoặc khuyến mãi. CoolCash khác loyalty points thông thường ở chỗ **không cần đổi** — dùng trực tiếp như tiền.

| ID | Yêu cầu | Ghi chú |
|----|---------|---------|
| CCH-01 | Khách hàng nhận CoolCash sau mỗi đơn hàng thành công (% trên giá trị đơn) | FF-06 |
| CCH-02 | Mỗi sản phẩm hiển thị ước tính CoolCash hoàn lại ("Hoàn lên đến X CoolCash") | FF-06 |
| CCH-03 | CoolCash có thể dùng thanh toán toàn bộ hoặc một phần đơn hàng | 1 CoolCash = 1 VNĐ |
| CCH-04 | CoolCash có thời hạn sử dụng (configurable) | |
| CCH-05 | Admin xem báo cáo tổng CoolCash đang lưu hành | |
| CCH-06 | Admin điều chỉnh CoolCash tay (credit/debit) cho customer | |
| CCH-07 | Lịch sử giao dịch CoolCash per customer (earn, spend, expire) | |

### 4.11 CoolClub — Tiered Membership

> **Mô hình Coolmate:** Thành viên được phân hạng dựa trên **tổng chi tiêu tích luỹ**. Hạng cao hơn = % cashback CoolCash cao hơn và quyền lợi khác. Không có phí tham gia.

| ID | Yêu cầu | Ghi chú |
|----|---------|---------|
| CLB-01 | Tự động phân hạng thành viên dựa trên tổng giá trị đơn hàng tích luỹ | FF-07 |
| CLB-02 | Cấu hình ngưỡng chi tiêu per tier (ví dụ: Silver ≥ 1tr, Gold ≥ 3tr, ...) qua Settings | |
| CLB-03 | Cấu hình % CoolCash cashback per tier | FF-07 |
| CLB-04 | Trang `/coolclub` giới thiệu chương trình và các quyền lợi per tier | |
| CLB-05 | Customer portal hiển thị hạng hiện tại, tổng chi tiêu, tiến trình lên hạng | FF-07 |
| CLB-06 | Email thông báo khi thành viên lên hạng mới | |
| CLB-07 | Admin xem phân bổ thành viên theo hạng | |

### 4.12 Referral Program

> **Mô hình Coolmate:** Mỗi thành viên có referral code cá nhân. Khi bạn bè dùng code này và hoàn tất đơn hàng đầu tiên, người giới thiệu nhận **10% giá trị đơn hàng đó dưới dạng CoolCash**.

| ID | Yêu cầu | Ghi chú |
|----|---------|---------|
| REF-01 | Mỗi customer có referral code duy nhất | FF-08 |
| REF-02 | Field nhập referral code tại checkout | FF-08 |
| REF-03 | Validate referral code: code hợp lệ, người dùng code chưa từng mua hàng trước | |
| REF-04 | Sau khi đơn hàng đầu tiên của người được giới thiệu hoàn tất → tự động cộng CoolCash cho người giới thiệu | 10% giá trị đơn |
| REF-05 | Không áp dụng referral cho bản thân | |
| REF-06 | Admin cấu hình % CoolCash per referral và điều kiện "đơn hàng đầu tiên" | |
| REF-07 | Báo cáo referral: ai giới thiệu ai, bao nhiêu CoolCash đã phát | |

### 4.13 Khuyến mãi — Promotions

| ID | Yêu cầu | Ghi chú Coolmate |
|----|---------|-----------------|
| PRM-01 | Mã giảm giá (coupon): theo % hoặc số tiền cố định | FF-10 |
| PRM-02 | Coupon có điều kiện: tổng đơn tối thiểu, danh mục sản phẩm | FF-10 |
| PRM-03 | **Free Gift Promotion**: tặng sản phẩm miễn phí khi đơn đạt ngưỡng (ví dụ: đơn ≥ 500k → tặng TOTECOOL) | FF-11 |
| PRM-04 | Carousel hiển thị sản phẩm tặng kèm trong giỏ hàng kèm ngưỡng kích hoạt | FF-11 |
| PRM-05 | Flash sale: giảm giá theo khung thời gian cụ thể | Pricelist + cron |
| PRM-06 | Free shipping khi đơn đạt ngưỡng | |
| PRM-07 | Gift card: mua và tặng gift card | FF-09 |

---

## 5. Yêu cầu Phi Chức năng

| ID | Yêu cầu | Mức độ |
|----|---------|--------|
| NFR-01 | Page load ≤ 3 giây trên 3G (trang product, trang collection) | High |
| NFR-02 | Mobile responsive trên 320px – 1920px | High |
| NFR-03 | SEO-ready: sitemap.xml, robots.txt, structured data (Product schema) | High |
| NFR-04 | SSL/HTTPS cho tất cả các website | High |
| NFR-05 | Xử lý đồng thời ≥ 100 users (scale theo Odoo workers) | Medium |
| NFR-06 | Backup database hàng ngày | High |
| NFR-07 | GDPR / data privacy: consent khi checkout | Medium |
| NFR-08 | Thời gian uptime ≥ 99.5% | High |
| NFR-09 | Admin có thể bật/tắt maintenance mode per website | Medium |
| NFR-10 | CoolCash balance consistent — không thể chi vượt số dư | High |
| NFR-11 | Payment callbacks idempotent — duplicate callback không sinh 2 đơn | High |

---

## 6. Ngoài Scope (Out of Scope)

| Tính năng | Lý do |
|-----------|-------|
| POS (Point of Sale) | Riêng biệt, không liên quan eCommerce online |
| Mobile App native | Scope riêng, cần thêm API layer |
| Marketplace (multi-vendor) | Kiến trúc phức tạp hơn nhiều |
| Tích hợp Shopee / Lazada / Tiki | Cần middleware riêng |
| Email marketing campaigns | CRM scope, không phải eCommerce core |
| AI Chatbot / LiveChat tư vấn | Module riêng, phase sau |
| Subscription / Recurring billing | Không phải fashion use case điển hình |
| CoolCash chuyển khoản giữa users | Scope mở rộng, phase sau |

---

## 7. Assumptions & Constraints

| # | Nội dung |
|---|---------|
| A1 | Triển khai trên Odoo v19 Enterprise (Multi-Website là Enterprise feature) |
| A2 | Môi trường dev: Docker Compose, localhost:8069, PostgreSQL 16 |
| A3 | `website_sale` KHÔNG phụ thuộc `stock`; tính năng kho trên web cần module riêng `website_sale_stock` |
| A4 | VNPay / MoMo / ZaloPay / GHN / GHTK không có trong Odoo core — phân loại gap ở Phase 5 |
| A5 | Zalo Social Login cần custom OAuth provider — không có sẵn trong Odoo v19 |
| A6 | Single-page checkout là **custom module** — Odoo default là multi-step wizard (`/shop/checkout`) |
| A7 | CoolCash = custom currency trên loyalty module — gần nhất là Odoo Loyalty Program nhưng cần mở rộng |
| A8 | Feature Flags implement qua `res.config.settings` custom fields — không dùng external feature flag service |
| A9 | Multi-Website cần Odoo **Enterprise** license |
| A10 | Thiết kế hướng đến white-label: logo, domain, theme thay đổi không cần chỉnh code |
| A11 | Collection URL (`/collection/{slug}`) khác với Odoo default (`/shop`); cần custom route |

---

## 8. Gap Summary (Preview Phase 5)

> Bảng này là **tóm tắt sơ bộ** — sẽ được phân tích chi tiết tại Phase 5 (Odoo Module Mapping).

| Tính năng | Odoo Native? | Gap Level | Ghi chú |
|-----------|-------------|-----------|---------|
| Single-page checkout | Không | Custom Module | Odoo default: multi-step wizard |
| Image swatch variant selector | Có (partial) | Config | Cần configure đúng variant display type |
| Variant greyed-out khi hết hàng | Có | Config | `website_sale_stock` module |
| Collection URL `/collection/{slug}` | Không | Custom Module | Odoo default: `/shop?categ_id=X` |
| CoolCash (cashback currency) | Partial | Custom Module | Loyalty points có, nhưng CoolCash 1:1 VNĐ cần mở rộng |
| CoolClub tiered membership | Partial | Custom Module | Odoo loyalty tiers khác với spending-threshold model |
| Referral program | Không | Custom Module | |
| Free gift promotion in cart | Có | Config | Odoo promotion rules hỗ trợ free product |
| Alternate receiver field | Không | Custom Module | Custom field trên sale order + checkout template |
| Gender title (Anh/Chị) dropdown | Không | Custom Module | Custom field |
| VNPay / MoMo / ZaloPay | Không | App Store | Tìm trên Odoo App Store trước |
| GHN / GHTK | Không | App Store | Tìm trên Odoo App Store trước |
| Zalo Social Login | Không | Custom Module | Custom OAuth2 provider |
| Google / Facebook Social Login | Partial | App Store | `auth_oauth` có Google; Facebook cần config |
| AI SEO meta generation | Có | Config | Odoo v19 Enterprise feature |
| Multi-Website | Có | Config | Enterprise only |
| COD payment | Có | Config | Native Odoo |

---

## 9. Glossary

| Thuật ngữ | Định nghĩa |
|-----------|-----------|
| Product Template | Sản phẩm gốc (ví dụ: Áo thun chạy bộ Việt Nam) |
| Product Variant | Biến thể cụ thể (Áo thun — Màu Đen — Size M) |
| Loại | Thuật ngữ Coolmate cho attribute màu sắc/chất liệu kết hợp, chọn bằng image swatch tròn |
| Kích thước | Thuật ngữ Coolmate cho attribute Size (XS/S/M/L/XL/XXL) |
| Collection | Nhóm sản phẩm theo chủ đề/danh mục, URL `/collection/{slug}` |
| CoolCash | Tiền tệ loyalty nội bộ của Coolmate, 1 CoolCash = 1 VNĐ khi thanh toán |
| CoolClub | Chương trình thành viên của Coolmate, phân hạng theo tổng chi tiêu tích luỹ |
| Pricelist | Bảng giá áp dụng theo điều kiện (customer group, website, ngày tháng) |
| Feature Flag (FF) | Tính năng có thể bật/tắt qua Odoo Settings — không chỉnh code |
| Multi-Website (MW) | Nhiều website độc lập trên 1 Odoo database |
| Gap | Tính năng Business cần nhưng Odoo core chưa có — cần App Store hoặc Custom Module |
| Single-page Checkout | Cart và Checkout nằm trên 1 trang (`/cart`) — không phải multi-step wizard |
| Image Swatch | Button chọn variant dạng ảnh tròn nhỏ — đổi variant đổi luôn ảnh sản phẩm |
| Alternate Receiver | Người nhận hàng khác với người đặt hàng (field riêng tại checkout) |
| COD | Cash on Delivery — thanh toán khi nhận hàng |
| Greyed-out | Variant hiển thị nhưng disabled (không chọn được) khi hết hàng |
