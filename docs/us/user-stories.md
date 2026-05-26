# User Stories — Fashion Store eCommerce Platform
**Version:** 1.0  
**Date:** 2026-05-26  
**Status:** Draft  
**Nguồn tham chiếu:** Use Cases v1.0 (`docs/uc/use-cases.md`), BRD v2.0  
**Platform:** Odoo v19

---

## Quy ước

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **FF-xx** | Feature Flag liên quan (xem BRD Section 3) |
| **Gap** | Tính năng cần Custom Module |
| **MH** | Must Have — phải có trong MVP |
| **SH** | Should Have — nên có sau MVP |
| **NH** | Nice to Have — cân nhắc theo roadmap |

### Actors

| Actor | Mô tả |
|-------|-------|
| Guest | Khách chưa đăng nhập |
| Member | Khách đã đăng ký và đăng nhập |
| Customer | Guest hoặc Member (dùng khi không phân biệt) |
| Staff | Nhân viên nội bộ (backend Odoo) |
| Admin | Quản trị viên hệ thống |
| System | Hệ thống tự động (automation, cron) |

---

## Danh sách User Stories

| US | Tên | Epic | UC tham chiếu | Priority |
|----|-----|------|---------------|---------|
| [US-001](#us-001) | Duyệt danh mục collection | Catalog | UC01 | MH |
| [US-002](#us-002) | Lọc và sắp xếp sản phẩm | Catalog | UC01 | MH |
| [US-003](#us-003) | Xem chi tiết sản phẩm và chọn biến thể | Catalog | UC02 | MH |
| [US-004](#us-004) | Hiển thị biến thể hết hàng (greyed-out) | Catalog | UC02 | MH |
| [US-005](#us-005) | Thêm sản phẩm vào giỏ hàng | Cart | UC03 | MH |
| [US-006](#us-006) | Xem và chỉnh sửa giỏ hàng | Cart | UC04 | MH |
| [US-007](#us-007) | Nhận quà tặng kèm theo ngưỡng đơn hàng | Cart | UC05 | SH |
| [US-008](#us-008) | Áp dụng mã giảm giá | Cart / Checkout | UC06 | SH |
| [US-009](#us-009) | Guest checkout trên một trang | Checkout | UC07 | MH |
| [US-010](#us-010) | Member checkout với thông tin đã lưu | Checkout | UC08 | MH |
| [US-011](#us-011) | Giao hàng cho người nhận thay | Checkout | UC07, UC08 | SH |
| [US-012](#us-012) | Chọn danh xưng (Anh/Chị) khi checkout | Checkout | UC07, UC08 | SH |
| [US-013](#us-013) | Thanh toán COD | Payment | UC09 | MH |
| [US-014](#us-014) | Thanh toán online VNPay / MoMo / ZaloPay | Payment | UC10 | MH |
| [US-015](#us-015) | Thanh toán bằng CoolCash | Payment | UC11 | SH |
| [US-016](#us-016) | Đăng ký tài khoản mới | Account | UC12 | MH |
| [US-017](#us-017) | Đăng nhập bằng Google / Facebook | Account | UC13 | SH |
| [US-018](#us-018) | Đăng nhập bằng Zalo QR | Account | UC13 | NH |
| [US-019](#us-019) | Tự động nhận CoolCash sau khi giao hàng | Loyalty | UC14 | SH |
| [US-020](#us-020) | Xem tiến trình CoolClub trong portal | Loyalty | UC15 | SH |
| [US-021](#us-021) | Tự động nâng hạng CoolClub | Loyalty | UC15 | SH |
| [US-022](#us-022) | Chia sẻ referral code để nhận CoolCash | Loyalty | UC16 | NH |
| [US-023](#us-023) | Nhập referral code khi checkout | Loyalty | UC17 | NH |
| [US-024](#us-024) | Member theo dõi đơn hàng trong portal | Order | UC18 | MH |
| [US-025](#us-025) | Guest tra cứu đơn hàng bằng mã + email | Order | UC18 | MH |
| [US-026](#us-026) | Yêu cầu đổi / trả hàng và hoàn tiền | Order | UC19 | SH |
| [US-027](#us-027) | Thêm sản phẩm vào Wishlist | Wishlist | UC20 | SH |
| [US-028](#us-028) | Quản lý và mua từ Wishlist | Wishlist | UC20 | SH |

---

## Epic 1: Catalog

### US-001

**UC tham chiếu:** UC01  
**Actor:** Customer (Guest / Member)  
**Priority:** MH

> **As a** Customer, **I want to** browse a product collection via a URL like `/collection/ao-thun-nam`, **so that** I can find the right products in a specific category quickly.

**Điều kiện chấp nhận:**
- [ ] Truy cập `/collection/{slug}` hiển thị danh sách sản phẩm dạng grid.
- [ ] Menu điều hướng liên kết đúng đến từng collection slug.
- [ ] URL `/collection/{slug}` không tồn tại trả về trang 404 có gợi ý điều hướng.
- [ ] Collection không có sản phẩm nào hiển thị trạng thái "Không có sản phẩm".

---

### US-002

**UC tham chiếu:** UC01  
**Actor:** Customer  
**Priority:** MH

> **As a** Customer, **I want to** filter products by Size, Loại (màu/chất liệu), and sort by popularity or price, **so that** I can narrow down to products that fit my needs without scrolling through the entire list.

**Điều kiện chấp nhận:**
- [ ] Có bộ lọc theo Size (text button), Loại (image swatch), và gender type.
- [ ] Bộ lọc gender có thể nhận từ URL param (`?gender_type=male`).
- [ ] Sau khi áp dụng bộ lọc, danh sách reload chỉ hiển thị sản phẩm khớp.
- [ ] Sort options: Mới nhất, Bán chạy nhất, Giá tăng dần, Giá giảm dần.
- [ ] Khi không có sản phẩm nào khớp bộ lọc, hiển thị thông báo và gợi ý xóa bộ lọc.

---

### US-003

**UC tham chiếu:** UC02  
**Actor:** Customer  
**Priority:** MH

> **As a** Customer, **I want to** see full product details and select a specific variant (Loại × Kích thước) before adding to cart, **so that** I can confidently choose the right item.

**Điều kiện chấp nhận:**
- [ ] Trang sản phẩm hiển thị: gallery ảnh, giá, tên, mô tả, thông số kỹ thuật.
- [ ] Chọn "Loại" (image swatch tròn) cập nhật gallery ảnh và URL thành `?color={slug}`.
- [ ] Truy cập `/product/{slug}?color={slug}` pre-select đúng Loại khi load trang.
- [ ] Chọn "Kích thước" (text button) highlight size đang chọn.
- [ ] Nút "Thêm vào giỏ" bị disabled khi chưa chọn đủ Loại và Kích thước, kèm tooltip hướng dẫn.
- [ ] Ước tính CoolCash hiển thị trên trang nếu FF-06 bật.

---

### US-004

**UC tham chiếu:** UC02  
**Actor:** Customer  
**Priority:** MH  
**Note:** Đây là hành vi phân biệt với nhiều shop thương mại — ẩn size hết hàng là sai UX.

> **As a** Customer, **I want to** see out-of-stock sizes visually disabled (greyed-out) rather than hidden, **so that** I know which sizes exist and can plan my purchase accordingly.

**Điều kiện chấp nhận:**
- [ ] Size hết hàng hiển thị dạng greyed-out (opacity giảm, cursor not-allowed), không bị ẩn khỏi UI.
- [ ] Click vào size greyed-out không có tác dụng (không chọn được).
- [ ] Khi toàn bộ size của 1 Loại hết hàng, tất cả text button của Loại đó đều greyed-out.
- [ ] Customer vẫn thấy đủ size để biết size chart của sản phẩm đó.

---

## Epic 2: Cart

### US-005

**UC tham chiếu:** UC03  
**Actor:** Customer  
**Priority:** MH

> **As a** Customer, **I want to** add a selected product variant to my cart with a desired quantity, **so that** I can proceed to checkout when ready.

**Điều kiện chấp nhận:**
- [ ] Stepper số lượng mặc định = 1, có thể tăng/giảm trước khi thêm.
- [ ] Nhấn "Thêm vào giỏ" hiển thị toast "Đã thêm vào giỏ hàng" và cập nhật badge mini cart.
- [ ] Thêm variant đã có trong giỏ → cộng dồn số lượng, không tạo dòng mới.
- [ ] Nhấn "Mua ngay" thêm vào giỏ và redirect thẳng đến `/cart`.
- [ ] Khi số lượng yêu cầu vượt tồn kho: cảnh báo "Chỉ còn X sản phẩm" và giới hạn theo tồn kho thực.
- [ ] Race condition hết hàng: thông báo lỗi, button chuyển greyed-out, không thêm vào giỏ.

---

### US-006

**UC tham chiếu:** UC04  
**Actor:** Customer  
**Priority:** MH

> **As a** Customer, **I want to** view, update quantities, and remove items in my cart before checkout, **so that** I have full control over what I'm ordering.

**Điều kiện chấp nhận:**
- [ ] Trang `/cart` hiển thị: ảnh variant, tên, Loại, Kích thước, giá đơn vị, số lượng, thành tiền.
- [ ] Stepper "+"/"-" cập nhật thành tiền và tổng đơn realtime.
- [ ] Xóa item: cập nhật tổng ngay, hiển thị "Giỏ hàng trống" nếu xóa hết.
- [ ] Order Summary hiển thị: subtotal, phí ship ước tính, tổng thanh toán.
- [ ] Member đăng nhập lại thấy persistent cart từ session trước.
- [ ] Item vừa hết hàng (giữa session): hiển thị cảnh báo trên item, block checkout cho đến khi xóa item đó.
- [ ] Tăng số lượng vượt tồn kho: tự giới hạn về mức tối đa, hiển thị thông báo.

---

### US-007

**UC tham chiếu:** UC05  
**Actor:** Customer, System  
**Priority:** SH  
**Feature Flag:** FF-11

> **As a** Customer, **I want to** automatically receive free gift offers when my cart total reaches a promotion threshold, **so that** I feel rewarded for buying more and can choose a gift I like.

**Điều kiện chấp nhận:**
- [ ] Khi FF-11 bật và tổng đơn ≥ ngưỡng cấu hình, hiển thị carousel sản phẩm tặng kèm.
- [ ] Carousel hiển thị: ảnh quà, tên, label "MIỄN PHÍ".
- [ ] Khi tổng chưa đủ ngưỡng: carousel hiển thị "Còn thiếu X.000đ để nhận quà".
- [ ] Customer chọn quà → hệ thống thêm vào giỏ với giá 0 VNĐ, hiển thị dòng riêng trong Order Summary.
- [ ] Tổng giỏ giảm xuống dưới ngưỡng → sản phẩm tặng tự động bị xóa, hiển thị thông báo.
- [ ] Nhiều ngưỡng promotion: cộng dồn quà theo từng ngưỡng đạt được.
- [ ] Sản phẩm tặng hết hàng: ẩn khỏi carousel, hiển thị sản phẩm thay thế nếu có.

---

### US-008

**UC tham chiếu:** UC06  
**Actor:** Customer  
**Priority:** SH  
**Feature Flag:** FF-10

> **As a** Customer, **I want to** enter a coupon code in my cart to receive a discount, **so that** I can save money on my purchase.

**Điều kiện chấp nhận:**
- [ ] Có ô nhập mã coupon trên trang `/cart`, button "Áp dụng".
- [ ] Mã hợp lệ: hiển thị dòng giảm giá trong Order Summary, cập nhật tổng.
- [ ] Mã giảm %: tính đúng X% × subtotal.
- [ ] Mã có điều kiện tổng đơn tối thiểu: thông báo nếu chưa đủ điều kiện.
- [ ] Xóa mã đang áp dụng: khôi phục giá gốc.
- [ ] Mã không tồn tại / hết hạn / hết lượt: hiển thị thông báo lỗi rõ ràng.
- [ ] Mã không áp dụng cho sản phẩm trong giỏ: thông báo rõ lý do.

---

## Epic 3: Checkout

### US-009

**UC tham chiếu:** UC07  
**Actor:** Guest  
**Priority:** MH  
**Feature Flag:** FF-05  
**Gap:** Custom Module (Single-page Checkout)

> **As a** Guest, **I want to** complete my order on a single `/cart` page without creating an account, **so that** I can buy quickly with minimal friction.

**Điều kiện chấp nhận:**
- [ ] Trang `/cart` có 2 cột: cột trái (form giao hàng), cột phải (Order Summary).
- [ ] Form yêu cầu: Họ tên, Số điện thoại, Email, Tỉnh/Thành, Quận/Huyện, Phường/Xã, Địa chỉ cụ thể.
- [ ] Phí ship tính realtime khi chọn địa chỉ, cập nhật Order Summary.
- [ ] Nhấn "ĐẶT HÀNG" validate toàn bộ form trước khi tạo đơn.
- [ ] Validation lỗi: highlight các trường thiếu, thông báo inline.
- [ ] Sau đặt hàng thành công: redirect đến trang xác nhận đơn hàng, email xác nhận gửi đến Guest.
- [ ] Sale Order được tạo với trạng thái "New".
- [ ] Khi có item vừa hết hàng lúc đặt: không tạo đơn, thông báo cụ thể item bị lỗi.
- [ ] Guest có thể đăng nhập giữa chừng, giỏ hàng được giữ nguyên sau đăng nhập.

---

### US-010

**UC tham chiếu:** UC08  
**Actor:** Member  
**Priority:** MH  
**Gap:** Custom Module (Single-page Checkout)

> **As a** Member, **I want to** have my saved address auto-filled at checkout and optionally pay with CoolCash, **so that** I can complete orders faster than a guest.

**Điều kiện chấp nhận:**
- [ ] Form giao hàng tự động điền từ địa chỉ mặc định đã lưu của Member.
- [ ] Nếu có nhiều địa chỉ đã lưu: dropdown/list để chọn, form tự điền khi chọn.
- [ ] Member có thể chỉnh sửa form và tick "Lưu địa chỉ này" để thêm địa chỉ mới vào profile.
- [ ] Hiển thị số dư CoolCash và toggle "Dùng CoolCash" nếu FF-06 bật và số dư > 0.
- [ ] Sau đặt hàng thành công: CoolCash bị trừ ngay (nếu đã dùng), email xác nhận gửi đến Member.

---

### US-011

**UC tham chiếu:** UC07, UC08  
**Actor:** Customer  
**Priority:** SH  
**Feature Flag:** FF-19  
**Gap:** Custom field trên Sale Order

> **As a** Customer, **I want to** specify a different recipient's name and phone number at checkout, **so that** I can send gifts to friends or family directly.

**Điều kiện chấp nhận:**
- [ ] Khi FF-19 bật, trang `/cart` có checkbox "Giao cho người khác".
- [ ] Tick vào checkbox hiện thêm 2 trường: Tên người nhận, Số điện thoại người nhận.
- [ ] 2 trường này là bắt buộc khi checkbox được tick.
- [ ] Thông tin người nhận thay được lưu trên Sale Order (custom field).
- [ ] Email xác nhận vẫn gửi đến địa chỉ email của người đặt, không phải người nhận.

---

### US-012

**UC tham chiếu:** UC07, UC08  
**Actor:** Customer  
**Priority:** SH  
**Feature Flag:** FF-20  
**Gap:** Custom field trên Sale Order

> **As a** Customer, **I want to** select a gender-appropriate title (Anh / Chị) when filling in my delivery information, **so that** the store can address me correctly in communications.

**Điều kiện chấp nhận:**
- [ ] Khi FF-20 bật, có dropdown "Danh xưng" với 2 lựa chọn: Anh, Chị.
- [ ] Lựa chọn mặc định có thể là blank (bắt buộc chọn) hoặc "Anh" (cần confirm với BA).
- [ ] Giá trị được lưu trên Sale Order và hiển thị trong email xác nhận ("Kính gửi Anh Nguyễn Văn A").
- [ ] Nếu FF-20 tắt: dropdown không hiện, không ảnh hưởng đến form.

---

## Epic 4: Payment

### US-013

**UC tham chiếu:** UC09  
**Actor:** Customer  
**Priority:** MH

> **As a** Customer, **I want to** choose Cash on Delivery as my payment method, **so that** I can pay when I receive the goods without needing a bank card or e-wallet.

**Điều kiện chấp nhận:**
- [ ] Tab "Thanh toán khi nhận hàng (COD)" hiển thị trong khu vực chọn phương thức thanh toán.
- [ ] Chọn COD hiển thị ghi chú: "Bạn sẽ thanh toán khi nhận được hàng. Áp dụng nội địa Việt Nam."
- [ ] Sau đặt hàng: đơn hàng ghi nhận payment_method = COD, trạng thái = "Chờ thu tiền".
- [ ] COD kết hợp CoolCash: đơn ghi rõ phần CoolCash đã trừ và phần thu khi giao.
- [ ] COD không khả dụng cho 1 số khu vực: ẩn tab COD, hiển thị thông báo giải thích.

---

### US-014

**UC tham chiếu:** UC10  
**Actor:** Customer  
**Priority:** MH  
**Gap:** App Store hoặc Custom Module (VNPay/MoMo/ZaloPay)

> **As a** Customer, **I want to** pay online via VNPay, MoMo, or ZaloPay, **so that** I can complete my purchase immediately with a familiar Vietnamese payment provider.

**Điều kiện chấp nhận:**
- [ ] Danh sách phương thức thanh toán hiển thị các cổng đang được bật (VNPay, MoMo, ZaloPay).
- [ ] Sau khi chọn và nhấn "ĐẶT HÀNG": đơn tạo trạng thái "Chờ thanh toán", redirect đến cổng thanh toán.
- [ ] Cổng thanh toán callback thành công: hệ thống xác thực chữ ký, cập nhật đơn thành "Đã thanh toán".
- [ ] Duplicate callback: idempotency — bỏ qua callback thứ 2 cho cùng Order ID.
- [ ] Thanh toán bị từ chối tại cổng: giữ đơn trạng thái "Chờ thanh toán", cho phép thử lại hoặc chuyển COD.
- [ ] Timeout không nhận callback (sau X phút): cron job hủy đơn, giải phóng tồn kho, gửi email thông báo.

---

### US-015

**UC tham chiếu:** UC11  
**Actor:** Member  
**Priority:** SH  
**Feature Flag:** FF-06  
**Gap:** Custom Module

> **As a** Member, **I want to** use my CoolCash balance (1 CoolCash = 1 VNĐ) to pay for all or part of my order, **so that** I can redeem loyalty rewards I've earned from previous purchases.

**Điều kiện chấp nhận:**
- [ ] Khi FF-06 bật và Member có số dư CoolCash > 0: hiển thị "Số dư CoolCash: X CoolCash" và toggle.
- [ ] Bật toggle: tính số tiền thanh toán bằng CoolCash, cập nhật Order Summary.
- [ ] Số dư đủ thanh toán toàn bộ: phần "Chọn phương thức thanh toán" ẩn đi.
- [ ] Số dư không đủ (thanh toán một phần): hiển thị "Dùng X CoolCash, còn lại Y VNĐ thanh toán bằng:", Member chọn phương thức bổ sung.
- [ ] Khi xác nhận đơn: kiểm tra số dư realtime để tránh race condition; nếu không đủ, trả lỗi rõ ràng.
- [ ] Sau đặt hàng: CoolCash bị trừ ngay, ghi lịch sử "Đã dùng X CoolCash — Đơn #YYYY".
- [ ] CoolCash hết hạn không được tính vào số dư khả dụng.

---

## Epic 5: Account

### US-016

**UC tham chiếu:** UC12  
**Actor:** Guest  
**Priority:** MH

> **As a** Guest, **I want to** create a new account with my email and password, **so that** I can save my addresses, track orders, and earn CoolCash on future purchases.

**Điều kiện chấp nhận:**
- [ ] Form đăng ký: Email, Mật khẩu (≥ 8 ký tự), Xác nhận mật khẩu, Họ tên.
- [ ] Validate: email hợp lệ, chưa được đăng ký, mật khẩu đủ mạnh, xác nhận khớp.
- [ ] Tạo tài khoản thành công: tự động đăng nhập, gửi email xác thực.
- [ ] Nếu email đã có tài khoản: thông báo rõ ràng, gợi ý đăng nhập.
- [ ] Đăng ký từ trang Checkout: redirect trở về `/cart` với giỏ hàng được giữ nguyên.
- [ ] Hệ thống khởi tạo: CoolCash = 0, hạng CoolClub = mặc định, referral code duy nhất (nếu FF-06/07/08 bật).

---

### US-017

**UC tham chiếu:** UC13  
**Actor:** Guest  
**Priority:** SH  
**Feature Flag:** FF-17

> **As a** Guest, **I want to** sign in with my Google or Facebook account, **so that** I don't need to remember a separate password for this store.

**Điều kiện chấp nhận:**
- [ ] Khi FF-17 bật: hiển thị nút "Đăng nhập bằng Google" và "Đăng nhập bằng Facebook".
- [ ] Luồng OAuth chuẩn: redirect đến provider, lấy profile, redirect về hệ thống.
- [ ] Email từ provider đã có tài khoản → đăng nhập vào tài khoản đó.
- [ ] Email chưa có tài khoản → tạo tài khoản mới tự động (không cần form).
- [ ] Email từ provider trùng với tài khoản email/password hiện có → yêu cầu xác thực trước khi liên kết.
- [ ] Guest hủy OAuth consent → redirect về trang đăng nhập với thông báo.

---

### US-018

**UC tham chiếu:** UC13  
**Actor:** Guest  
**Priority:** NH  
**Feature Flag:** FF-18  
**Gap:** Custom Zalo OAuth

> **As a** Vietnamese customer, **I want to** log in by scanning a Zalo QR code, **so that** I can use the app I already have on my phone without needing an email or password.

**Điều kiện chấp nhận:**
- [ ] Khi FF-18 bật: hiển thị nút "Đăng nhập bằng Zalo".
- [ ] Nhấn hiển thị QR code tương thích Zalo Mini App.
- [ ] Guest quét QR bằng Zalo: hệ thống nhận Zalo User ID, tên, avatar.
- [ ] Xử lý tạo tài khoản / đăng nhập tương tự US-017.
- [ ] QR hết hạn (sau X giây): hiển thị nút "Tải lại QR".

---

## Epic 6: Loyalty

### US-019

**UC tham chiếu:** UC14  
**Actor:** Member, System  
**Priority:** SH  
**Feature Flag:** FF-06

> **As a** Member, **I want to** automatically receive CoolCash cashback when my order is delivered, **so that** I'm rewarded for every successful purchase and motivated to buy again.

**Điều kiện chấp nhận:**
- [ ] Khi FF-06 bật: automation trigger khi đơn hàng chuyển trạng thái "Đã giao hàng".
- [ ] CoolCash nhận được = giá trị đơn × % cashback theo hạng CoolClub hiện tại của Member.
- [ ] Phần thanh toán bằng CoolCash không được tính vào giá trị tính cashback (không double-dip).
- [ ] Balance CoolCash cập nhật ngay, ghi lịch sử "Nhận X CoolCash — Đơn hàng #YYYY".
- [ ] (Tuỳ config) Gửi notification/email thông báo CoolCash vừa nhận.
- [ ] Đơn hàng bị hoàn trả: thu hồi CoolCash tương ứng từ balance; nếu đã dùng hết, ghi âm để trừ lần earn tiếp theo.
- [ ] Tỷ lệ cashback chưa cấu hình → dùng 0% mặc định và log cảnh báo cho Admin.

---

### US-020

**UC tham chiếu:** UC15  
**Actor:** Member  
**Priority:** SH  
**Feature Flag:** FF-07

> **As a** Member, **I want to** see my CoolClub tier, current spending, and progress toward the next tier in my account portal, **so that** I can plan purchases to reach higher benefits.

**Điều kiện chấp nhận:**
- [ ] Khi FF-07 bật: trang portal Member hiển thị hạng CoolClub hiện tại (ví dụ: Silver, Gold, Platinum).
- [ ] Hiển thị tổng chi tiêu tích lũy và ngưỡng của hạng tiếp theo (ví dụ: 3.200.000 / 5.000.000 VNĐ).
- [ ] Progress bar trực quan thể hiện khoảng cách đến hạng tiếp theo.
- [ ] Ở hạng cao nhất (Platinum): thay progress bar bằng thông báo "Bạn đang ở hạng cao nhất!".
- [ ] Hiển thị % cashback CoolCash tương ứng với hạng hiện tại.

---

### US-021

**UC tham chiếu:** UC15  
**Actor:** System, Member  
**Priority:** SH  
**Feature Flag:** FF-07

> **As a** Member, **I want to** be automatically upgraded to a higher CoolClub tier when my cumulative spending reaches the required threshold, **so that** I receive better cashback rates without needing to request it manually.

**Điều kiện chấp nhận:**
- [ ] Khi FF-07 bật: sau mỗi đơn giao thành công, hệ thống so sánh tổng chi tiêu với ngưỡng tier tiếp theo.
- [ ] Tổng chi tiêu đạt ngưỡng → nâng hạng tự động, cập nhật % cashback mới.
- [ ] Gửi email chúc mừng nâng hạng kèm thông tin quyền lợi của hạng mới.
- [ ] Portal Member cập nhật hiển thị hạng mới ngay sau khi nâng.
- [ ] Nếu Member đang ở hạng cao nhất: không nâng thêm, không gửi email.
- [ ] Đơn hàng bị hoàn trả làm tổng chi tiêu rớt dưới ngưỡng: hạ hạng và thông báo Member *(hành vi cần confirm với BA)*.

---

### US-022

**UC tham chiếu:** UC16  
**Actor:** Member  
**Priority:** NH  
**Feature Flag:** FF-08

> **As a** Member, **I want to** share my personal referral code with friends and earn 10% CoolCash when they successfully complete their first order, **so that** I'm incentivized to grow the customer base.

**Điều kiện chấp nhận:**
- [ ] Khi FF-08 bật: trang portal Member hiển thị referral code cá nhân (ví dụ: `COOL-NGUYEN123`).
- [ ] Có nút copy link referral và/hoặc chia sẻ mạng xã hội.
- [ ] Sau khi bạn bè hoàn tất đơn đầu tiên thành công: Member nhận 10% × giá trị đơn bạn bè.
- [ ] CoolCash từ referral được ghi vào lịch sử: "Nhận X CoolCash từ referral".
- [ ] CoolCash chỉ được phát sau khi đơn thành công — không phát ngay khi bạn bè áp code.
- [ ] Portal hiển thị: tổng bạn bè đã giới thiệu thành công, tổng CoolCash đã nhận từ referral.

---

### US-023

**UC tham chiếu:** UC17  
**Actor:** New Customer  
**Priority:** NH  
**Feature Flag:** FF-08

> **As a** first-time buyer, **I want to** enter a friend's referral code at checkout, **so that** my friend gets rewarded for introducing me to the store.

**Điều kiện chấp nhận:**
- [ ] Khi FF-08 bật: trang `/cart` hiển thị ô "Mã giới thiệu".
- [ ] Nhập code hợp lệ: hiển thị xác nhận "Mã giới thiệu hợp lệ — được giới thiệu bởi [Tên]".
- [ ] Code không tồn tại: thông báo lỗi inline.
- [ ] Khách đã từng mua hàng trước đây: thông báo "Mã giới thiệu chỉ áp dụng cho lần mua đầu tiên".
- [ ] Khách nhập code của chính mình: thông báo "Không thể dùng mã giới thiệu của chính mình".
- [ ] Code được ghi nhận vào đơn hàng; reward phát sau khi đơn thành công.

---

## Epic 7: Order Management

### US-024

**UC tham chiếu:** UC18  
**Actor:** Member  
**Priority:** MH

> **As a** Member, **I want to** view all my orders and track their current status in my account portal, **so that** I always know where my packages are without contacting support.

**Điều kiện chấp nhận:**
- [ ] Trang "Đơn hàng của tôi" hiển thị danh sách đơn: mã đơn, ngày đặt, tổng tiền, trạng thái.
- [ ] Nhấp vào đơn: hiển thị chi tiết đầy đủ — sản phẩm, địa chỉ, phương thức thanh toán, timeline trạng thái.
- [ ] Đơn đang giao: hiển thị tracking number và link tra cứu (GHN/GHTK hoặc tương đương).
- [ ] Email tự động gửi khi trạng thái đơn thay đổi: Confirmed, Shipped, Delivered — kèm tracking link.

---

### US-025

**UC tham chiếu:** UC18  
**Actor:** Guest  
**Priority:** MH

> **As a** Guest who placed an order without an account, **I want to** look up my order using my order code and email, **so that** I can track my package even without logging in.

**Điều kiện chấp nhận:**
- [ ] Trang tra cứu đơn hàng dành cho Guest: nhập mã đơn + email đã dùng khi đặt.
- [ ] Thông tin khớp: hiển thị thông tin đơn hàng (trạng thái, sản phẩm, địa chỉ, tracking).
- [ ] Thông tin không khớp: thông báo "Không tìm thấy đơn hàng với thông tin này."
- [ ] Không yêu cầu đăng nhập để sử dụng tính năng này.

---

### US-026

**UC tham chiếu:** UC19  
**Actor:** Customer, Staff  
**Priority:** SH

> **As a** Customer, **I want to** request a return/exchange for a delivered order within the allowed period and receive a refund, **so that** I can resolve issues with incorrect or defective products.

**Điều kiện chấp nhận:**
- [ ] Nút "Yêu cầu đổi/trả" chỉ hiển thị trên đơn trạng thái "Đã giao hàng" còn trong thời hạn (ví dụ: 30 ngày).
- [ ] Form yêu cầu: chọn sản phẩm cần trả, lý do, đính kèm ảnh (tùy chọn).
- [ ] Quá thời hạn: hiển thị "Đơn hàng đã quá thời hạn đổi trả".
- [ ] Staff duyệt Return Request trong Odoo backend → tạo Return Delivery → nhập kho → tạo Credit Note.
- [ ] Hoàn tiền về phương thức thanh toán gốc hoặc cộng vào CoolCash (Customer chọn).
- [ ] Staff từ chối: gửi email thông báo từ chối kèm lý do cho Customer.
- [ ] Sau hoàn trả thành công: CoolCash cashback của đơn đó bị thu hồi tự động.

---

## Epic 8: Wishlist

### US-027

**UC tham chiếu:** UC20  
**Actor:** Member  
**Priority:** SH  
**Feature Flag:** FF-01

> **As a** Member, **I want to** save products to a wishlist by clicking a heart icon, **so that** I can revisit them later without having to search again.

**Điều kiện chấp nhận:**
- [ ] Khi FF-01 bật và Member đã đăng nhập: hiển thị icon "♡" trên trang product detail và product card.
- [ ] Nhấp icon: sản phẩm được lưu vào Wishlist, icon chuyển thành "♥".
- [ ] Nhấp icon "♥" lần nữa: xóa khỏi Wishlist, icon quay về "♡".
- [ ] Guest cố nhấp icon: hiển thị modal "Vui lòng đăng nhập để lưu sản phẩm yêu thích", có nút đăng nhập nhanh.
- [ ] Wishlist lưu Product Template (không phải specific variant).

---

### US-028

**UC tham chiếu:** UC20  
**Actor:** Member  
**Priority:** SH  
**Feature Flag:** FF-01

> **As a** Member, **I want to** view and manage all my wishlisted products on a dedicated page, **so that** I can easily add them to cart when I'm ready to buy.

**Điều kiện chấp nhận:**
- [ ] Trang `/wishlist` hiển thị danh sách sản phẩm đã lưu: ảnh, tên, giá.
- [ ] Sản phẩm hết hàng: hiển thị badge "Hết hàng", nút "Thêm vào giỏ" bị disabled.
- [ ] (Tuỳ chọn FF-04) Có nút "Thông báo khi có hàng" cho sản phẩm hết hàng.
- [ ] Nhấn "Thêm vào giỏ" từ Wishlist: chuyển đến trang product để chọn variant, sau đó UC03.
- [ ] Có nút "Xóa" để xóa từng sản phẩm khỏi Wishlist.
- [ ] Sau khi thêm vào giỏ thành công: gợi ý xóa sản phẩm đó khỏi Wishlist.

---

## Phụ lục: Ma trận UC — US

| UC | User Stories liên quan |
|----|----------------------|
| UC01 | US-001, US-002 |
| UC02 | US-003, US-004 |
| UC03 | US-005 |
| UC04 | US-006 |
| UC05 | US-007 |
| UC06 | US-008 |
| UC07 | US-009, US-011, US-012 |
| UC08 | US-010, US-011, US-012 |
| UC09 | US-013 |
| UC10 | US-014 |
| UC11 | US-015 |
| UC12 | US-016 |
| UC13 | US-017, US-018 |
| UC14 | US-019 |
| UC15 | US-020, US-021 |
| UC16 | US-022 |
| UC17 | US-023 |
| UC18 | US-024, US-025 |
| UC19 | US-026 |
| UC20 | US-027, US-028 |

---

## Phụ lục: Tổng hợp theo Priority

| Priority | Số lượng | User Stories |
|----------|----------|-------------|
| Must Have (MH) | 12 | US-001 đến US-010, US-013, US-014, US-016, US-024, US-025 |
| Should Have (SH) | 13 | US-007, US-008, US-011, US-012, US-015, US-017, US-019, US-020, US-021, US-026, US-027, US-028 |
| Nice to Have (NH) | 3 | US-018, US-022, US-023 |

**Tổng cộng: 28 User Stories**
