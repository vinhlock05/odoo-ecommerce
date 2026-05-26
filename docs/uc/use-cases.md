# Use Cases — Fashion Store eCommerce Platform
**Version:** 1.0  
**Date:** 2026-05-26  
**Status:** Draft  
**Nguồn tham chiếu:** BRD v2.0 (Coolmate Case Study)  
**Platform:** Odoo v19

---

## Quy ước

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `[A]` | Alternative Flow — luồng thay thế hợp lệ |
| `[E]` | Exception Flow — luồng ngoại lệ / lỗi |
| **FF-xx** | Feature Flag liên quan (xem BRD Section 3) |
| **Gap** | Tính năng cần Custom Module (xem BRD Section 8) |

---

## Danh sách Use Cases

| UC | Tên | Actor chính | Khu vực nghiệp vụ |
|----|-----|------------|-------------------|
| UC01 | Duyệt Collection & Lọc sản phẩm | Customer (Guest/Member) | Catalog |
| UC02 | Xem chi tiết sản phẩm và chọn biến thể | Customer | Catalog |
| UC03 | Thêm sản phẩm vào giỏ hàng | Customer | Cart |
| UC04 | Quản lý giỏ hàng | Customer | Cart |
| UC05 | Áp dụng Free Gift Promotion | System, Customer | Cart |
| UC06 | Áp dụng mã giảm giá (Coupon) | Customer | Cart / Checkout |
| UC07 | Single-page Checkout — Guest | Guest | Checkout |
| UC08 | Single-page Checkout — Thành viên | Member | Checkout |
| UC09 | Thanh toán COD | Customer | Payment |
| UC10 | Thanh toán Online (VNPay / MoMo / ZaloPay) | Customer | Payment |
| UC11 | Thanh toán bằng CoolCash | Member | Payment / Loyalty |
| UC12 | Đăng ký tài khoản | Guest | Account |
| UC13 | Đăng nhập Social (Google / Facebook / Zalo) | Guest | Account |
| UC14 | Tích lũy CoolCash sau mua hàng | System, Member | Loyalty |
| UC15 | Nâng hạng CoolClub | System, Member | Loyalty |
| UC16 | Chia sẻ Referral Code và nhận CoolCash | Member | Loyalty / Referral |
| UC17 | Áp dụng Referral Code khi Checkout | New Customer | Checkout / Referral |
| UC18 | Theo dõi trạng thái đơn hàng | Customer | Order |
| UC19 | Đổi / Trả hàng và Hoàn tiền | Customer, Staff | Order / Return |
| UC20 | Quản lý Wishlist | Member | Account / Catalog |

---

## UC01 — Duyệt Collection & Lọc sản phẩm

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Tìm sản phẩm phù hợp trong một collection cụ thể thông qua lọc và sắp xếp.

**Tiền điều kiện:**
- Website đang hoạt động.
- Có ít nhất một collection được publish.

**Luồng chính (Main Flow):**
1. Customer nhấp vào menu điều hướng → chọn danh mục (ví dụ: "Áo thun nam").
2. Hệ thống điều hướng đến `/collection/ao-thun-nam`, hiển thị danh sách sản phẩm dạng grid.
3. Customer áp dụng bộ lọc: chọn **Size** (ví dụ: M), chọn **Loại** (màu Đen).
4. Hệ thống reload danh sách, chỉ hiển thị sản phẩm khớp với bộ lọc.
5. Customer sắp xếp theo "Bán chạy nhất".
6. Hệ thống sắp xếp lại danh sách.
7. Customer nhấp vào sản phẩm → chuyển sang UC02.

**[A1] Lọc theo gender:**
- Customer truy cập `/collection/san-pham-moi?gender_type=male` từ link trực tiếp.
- Hệ thống pre-apply bộ lọc gender từ URL param, hiển thị sản phẩm nam.

**[A2] Collection rỗng sau khi lọc:**
- Sau khi áp dụng bộ lọc, không có sản phẩm nào khớp.
- Hệ thống hiển thị thông báo "Không tìm thấy sản phẩm phù hợp" và gợi ý xóa bớt bộ lọc.

**[E1] Collection không tồn tại:**
- URL `/collection/{slug}` không khớp với bất kỳ collection nào.
- Hệ thống trả về trang 404 kèm gợi ý điều hướng đến trang chủ hoặc `/collection/do-nam`.

**Hậu điều kiện:** Customer đang xem danh sách sản phẩm đã được lọc/sắp xếp.

---

## UC02 — Xem chi tiết sản phẩm và chọn biến thể

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Xem thông tin sản phẩm và chọn đúng biến thể (Loại × Kích thước) trước khi thêm vào giỏ.

**Tiền điều kiện:**
- Customer đang ở trang collection hoặc có link sản phẩm.

**Luồng chính (Main Flow):**
1. Customer nhấp vào sản phẩm từ collection.
2. Hệ thống điều hướng đến `/product/{slug}`, hiển thị ảnh mặc định, giá, mô tả sản phẩm.
3. Customer chọn **Loại** bằng cách nhấp vào image swatch tròn (ví dụ: "Xanh Navy").
4. Hệ thống cập nhật URL thành `/product/{slug}?color=xanh-navy`, thay ảnh gallery thành ảnh của Loại đó.
5. Customer chọn **Kích thước** (ví dụ: L) bằng cách nhấp vào text button.
6. Hệ thống highlight size L là đang chọn.
7. Customer xem thông số kỹ thuật (Công nghệ / Chất liệu / Kiểu dáng / Tính năng / Bảo quản).
8. Customer xem ước tính CoolCash hoàn lại ("Được hoàn lên đến 14.000 CoolCash") **(FF-06)**.
9. Customer nhấn "Thêm vào giỏ hàng" → chuyển sang UC03.

**[A1] Truy cập variant trực tiếp qua URL:**
- Customer nhận link `/product/ao-thun?color=den`.
- Hệ thống pre-select Loại "Đen", hiển thị ảnh của Loại đó ngay khi load trang.

**[A2] Kích thước đang xem đã hết hàng:**
- Size M hiển thị **greyed-out** (disabled, vẫn hiện nhưng không click được).
- Customer thấy rõ M có tồn tại nhưng đang hết hàng — không ẩn khỏi UI.
- Customer chọn size khác còn hàng (L, XL).

**[A3] Customer chưa chọn Kích thước khi nhấn "Thêm vào giỏ":**
- Hệ thống highlight selector Kích thước và hiển thị tooltip "Vui lòng chọn kích thước".
- Customer bắt buộc chọn trước khi có thể thêm vào giỏ.

**[E1] Toàn bộ kích thước của 1 Loại đã hết hàng:**
- Tất cả size button của Loại đó đều greyed-out.
- Customer vẫn có thể xem sản phẩm nhưng không thêm vào giỏ được với Loại này.

**Hậu điều kiện:** Customer đã chọn Loại và Kích thước, sẵn sàng thêm vào giỏ.

---

## UC03 — Thêm sản phẩm vào giỏ hàng

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Thêm biến thể đã chọn vào giỏ hàng với số lượng mong muốn.

**Tiền điều kiện:**
- Customer đã chọn Loại và Kích thước (UC02 hoàn tất bước chọn variant).

**Luồng chính (Main Flow):**
1. Customer điều chỉnh số lượng bằng stepper (mặc định = 1).
2. Customer nhấn "Thêm vào giỏ hàng".
3. Hệ thống kiểm tra tồn kho của variant (Loại × Kích thước) đã chọn.
4. Hệ thống thêm item vào giỏ hàng, cập nhật badge số lượng trên mini cart ở header.
5. Hệ thống hiển thị thông báo thành công (snackbar/toast) "Đã thêm vào giỏ hàng".
6. Customer có thể tiếp tục mua sắm hoặc nhấp vào mini cart để xem giỏ.

**[A1] Sản phẩm đã có trong giỏ hàng:**
- Nếu variant đó đã có trong giỏ, hệ thống **cộng dồn số lượng** thay vì tạo dòng mới.

**[A2] Customer nhấn "Mua ngay":**
- Hệ thống thêm vào giỏ và chuyển thẳng đến `/cart` (Single-page Checkout).

**[E1] Số lượng yêu cầu vượt tồn kho:**
- Hệ thống hiển thị cảnh báo "Chỉ còn X sản phẩm trong kho", giới hạn tối đa theo tồn kho thực.

**[E2] Hết hàng tại thời điểm thêm (race condition):**
- Hệ thống trả về lỗi "Sản phẩm vừa hết hàng", không thêm vào giỏ, cập nhật button thành greyed-out.

**Hậu điều kiện:** Giỏ hàng có ít nhất 1 item; badge mini cart hiển thị đúng số lượng.

---

## UC04 — Quản lý giỏ hàng

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Xem, cập nhật số lượng hoặc xóa sản phẩm trong giỏ trước khi checkout.

**Tiền điều kiện:**
- Giỏ hàng có ít nhất 1 item (UC03 đã hoàn tất).

**Luồng chính (Main Flow):**
1. Customer nhấp vào icon giỏ hàng hoặc điều hướng đến `/cart`.
2. Hệ thống hiển thị danh sách items: ảnh variant, tên sản phẩm, Loại, Kích thước, giá, số lượng, thành tiền.
3. Customer nhấn **"+"** hoặc **"–"** trên stepper để thay đổi số lượng một item.
4. Hệ thống cập nhật thành tiền và tổng đơn hàng realtime.
5. Customer nhấn icon xóa (trash) để loại bỏ 1 item.
6. Hệ thống xóa item, cập nhật lại tổng.
7. Giỏ hàng hiển thị phần Order Summary bên phải với subtotal, phí ship dự kiến, tổng.

**[A1] Giỏ hàng trống sau khi xóa hết:**
- Hệ thống hiển thị trạng thái "Giỏ hàng của bạn đang trống" và CTA gợi ý quay lại mua sắm.

**[A2] Customer là Member đăng nhập lại:**
- Giỏ hàng được khôi phục từ lần session trước (persistent cart).

**[A3] Điều chỉnh số lượng vượt tồn kho:**
- Hệ thống tự giới hạn về số tồn kho thực, hiển thị thông báo "Chỉ còn X sản phẩm".

**[E1] Item trong giỏ vừa hết hàng (giữa session):**
- Hệ thống hiển thị cảnh báo trên item đó: "Sản phẩm này đã hết hàng — không thể đặt".
- Item được giữ trong giỏ nhưng bị đánh dấu lỗi; Customer phải xóa trước khi checkout.

**Hậu điều kiện:** Giỏ hàng phản ánh đúng items và số lượng Customer mong muốn.

---

## UC05 — Áp dụng Free Gift Promotion trong giỏ hàng

**Actor chính:** System (tự động), Customer (chọn quà)  
**Mục tiêu:** Hệ thống đề xuất và khách hàng nhận sản phẩm tặng kèm dựa trên ngưỡng giá trị đơn hàng. **(FF-11)**

**Tiền điều kiện:**
- FF-11 (Free Gift Promotion) đang bật.
- Đã cấu hình promotion rule: giá trị đơn ≥ ngưỡng X → tặng sản phẩm Y.
- Giỏ hàng của Customer có ít nhất 1 item.

**Luồng chính (Main Flow):**
1. Customer xem giỏ hàng (UC04).
2. Hệ thống tính tổng giá trị giỏ hàng hiện tại.
3. Tổng giá trị đạt hoặc vượt ngưỡng promotion (ví dụ: ≥ 500.000 VNĐ).
4. Hệ thống hiển thị **carousel sản phẩm tặng kèm** (ví dụ: TOTECOOL, áo thun basic).
5. Carousel hiển thị: tên quà, ảnh, và label "MIỄN PHÍ".
6. Customer nhấn "Chọn quà" → chọn 1 sản phẩm (hoặc 1 variant nếu quà có size).
7. Hệ thống thêm sản phẩm tặng vào giỏ với giá 0 VNĐ.
8. Order summary cập nhật: dòng riêng "Quà tặng: [Tên quà] — 0đ".

**[A1] Tổng giỏ hàng chưa đủ ngưỡng:**
- Carousel vẫn hiển thị nhưng với trạng thái "Còn thiếu X.000đ để nhận quà".
- Giúp Customer biết cần thêm bao nhiêu để đủ điều kiện.

**[A2] Có nhiều mức promotion:**
- Đơn ≥ 300k → quà A; đơn ≥ 700k → quà A + quà B.
- Hệ thống tự động cộng dồn quà theo từng ngưỡng đã đạt.

**[A3] Customer xóa bớt item, tổng rơi xuống dưới ngưỡng:**
- Hệ thống tự động xóa sản phẩm tặng khỏi giỏ và thông báo "Quà tặng đã bị xóa vì tổng đơn chưa đủ điều kiện".

**[E1] Sản phẩm tặng đã hết hàng:**
- Hệ thống ẩn sản phẩm tặng đó khỏi carousel, hiển thị sản phẩm tặng thay thế (nếu có cấu hình).

**Hậu điều kiện:** Giỏ hàng có sản phẩm tặng với giá 0 VNĐ; tổng thanh toán không thay đổi.

---

## UC06 — Áp dụng mã giảm giá (Coupon)

**Actor chính:** Customer  
**Mục tiêu:** Nhập mã coupon tại giỏ hàng / checkout để được giảm giá. **(FF-10)**

**Tiền điều kiện:**
- FF-10 (Coupon) đang bật.
- Giỏ hàng có ít nhất 1 item.

**Luồng chính (Main Flow):**
1. Customer nhìn thấy ô "Nhập mã giảm giá" trong giỏ hàng.
2. Customer nhập mã coupon (ví dụ: `COOL10`) và nhấn "Áp dụng".
3. Hệ thống validate mã: mã tồn tại, còn hiệu lực, Customer đủ điều kiện áp dụng.
4. Hệ thống tính toán số tiền giảm và cập nhật Order Summary.
5. Dòng giảm giá xuất hiện: "Mã COOL10: − 50.000 VNĐ".
6. Tổng thanh toán được cập nhật.

**[A1] Mã giảm % (ví dụ: giảm 10%):**
- Hệ thống tính 10% × subtotal, áp dụng giảm.

**[A2] Mã có điều kiện tổng đơn tối thiểu:**
- Mã chỉ áp dụng khi tổng đơn ≥ 200.000 VNĐ.
- Nếu chưa đủ: hệ thống thông báo "Mã này yêu cầu đơn hàng tối thiểu 200.000 VNĐ".

**[A3] Customer muốn xóa mã đã áp dụng:**
- Nhấn icon "✕" bên cạnh mã đang áp dụng.
- Hệ thống xóa coupon, khôi phục giá gốc.

**[E1] Mã không tồn tại:**
- Hệ thống hiển thị "Mã giảm giá không hợp lệ hoặc đã hết hạn".

**[E2] Mã đã sử dụng hết lượt:**
- Hệ thống hiển thị "Mã giảm giá đã được sử dụng hết lượt cho phép".

**[E3] Mã không áp dụng cho sản phẩm trong giỏ:**
- Hệ thống hiển thị "Mã này không áp dụng cho các sản phẩm trong giỏ hàng của bạn".

**Hậu điều kiện:** Order Summary hiển thị đúng số tiền giảm và tổng mới.

---

## UC07 — Single-page Checkout — Guest

**Actor chính:** Guest (chưa đăng nhập)  
**Mục tiêu:** Hoàn tất đặt hàng mà không cần đăng ký tài khoản trên trang `/cart`. **(Gap: Custom Module)**

**Tiền điều kiện:**
- FF-05 (Guest Checkout) đang bật.
- Giỏ hàng có ít nhất 1 item hợp lệ.
- Guest đang ở trang `/cart`.

**Luồng chính (Main Flow):**
1. Guest xem trang `/cart`: **cột trái** là form giao hàng, **cột phải** là Order Summary.
2. Guest điền form giao hàng:
   - Chọn **Danh xưng** (Anh / Chị) từ dropdown **(FF-20)**.
   - Nhập **Họ tên**.
   - Nhập **Số điện thoại**.
   - Nhập **Email**.
   - Chọn Tỉnh/Thành → Quận/Huyện → Phường/Xã → Địa chỉ cụ thể.
3. *(Tuỳ chọn)* Guest tick "Giao cho người khác" → nhập Tên + SĐT người nhận thay **(FF-19)**.
4. Hệ thống tính phí vận chuyển realtime dựa trên địa chỉ, cập nhật Order Summary.
5. Guest chọn **phương thức thanh toán** (xem UC09, UC10).
6. Guest nhấn nút **"ĐẶT HÀNG"**.
7. Hệ thống validate toàn bộ form (required fields, phone format, email format).
8. Hệ thống tạo Sale Order trạng thái "New".
9. Hệ thống gửi email xác nhận đơn hàng đến địa chỉ email Guest đã nhập.
10. Hệ thống chuyển Guest đến trang xác nhận đơn hàng với mã đơn và thông tin tóm tắt.

**[A1] Guest muốn đăng nhập giữa chừng:**
- Nhấp "Đăng nhập" → hệ thống giữ giỏ hàng, chuyển sang UC08 sau khi đăng nhập thành công.

**[A2] Nhập referral code:**
- Guest nhập referral code vào ô "Mã giới thiệu" → hệ thống validate (xem UC17).

**[E1] Form thiếu thông tin bắt buộc:**
- Nhấn "ĐẶT HÀNG" khi còn trường trống → hệ thống highlight các trường lỗi, hiển thị thông báo "Vui lòng điền đầy đủ thông tin".

**[E2] Số điện thoại sai định dạng:**
- Hệ thống hiển thị "Số điện thoại không hợp lệ" inline dưới field.

**[E3] Hết hàng tại thời điểm đặt:**
- Sau khi nhấn "ĐẶT HÀNG", hệ thống phát hiện 1 variant vừa hết hàng.
- Hệ thống không tạo đơn, thông báo "Sản phẩm X vừa hết hàng, vui lòng xóa khỏi giỏ để tiếp tục".

**Hậu điều kiện:** Sale Order được tạo trạng thái "New"; email xác nhận đã gửi đến Guest.

---

## UC08 — Single-page Checkout — Thành viên đã đăng nhập

**Actor chính:** Member (đã đăng nhập)  
**Mục tiêu:** Hoàn tất đặt hàng nhanh hơn nhờ thông tin đã lưu, và có thể dùng CoolCash. **(Gap: Custom Module)**

**Tiền điều kiện:**
- Member đã đăng nhập vào tài khoản.
- Giỏ hàng có ít nhất 1 item hợp lệ.
- Member đang ở trang `/cart`.

**Luồng chính (Main Flow):**
1. Member xem trang `/cart`.
2. Hệ thống **tự động điền** form giao hàng từ địa chỉ mặc định đã lưu trong tài khoản.
3. Member xem lại thông tin — có thể chỉnh sửa nếu muốn.
4. *(Tuỳ chọn)* Member tick "Giao cho người khác" → nhập thông tin người nhận thay **(FF-19)**.
5. Hệ thống hiển thị **số dư CoolCash** của Member và option "Dùng CoolCash để thanh toán" **(FF-06)**.
6. *(Tuỳ chọn)* Member bật toggle "Dùng CoolCash" → xem UC11.
7. Member chọn phương thức thanh toán bổ sung hoặc duy nhất (COD, VNPay, MoMo...).
8. Member nhấn **"ĐẶT HÀNG"**.
9. Hệ thống validate, tạo Sale Order, trừ CoolCash (nếu có).
10. Hệ thống gửi email xác nhận đơn hàng.
11. Hệ thống chuyển đến trang xác nhận đơn hàng.

**[A1] Member có nhiều địa chỉ đã lưu:**
- Hệ thống hiển thị dropdown/list các địa chỉ đã lưu.
- Member chọn địa chỉ mong muốn, form tự điền.

**[A2] Member muốn lưu địa chỉ mới:**
- Sau khi điền form địa chỉ mới, Member tick "Lưu địa chỉ này".
- Hệ thống thêm địa chỉ vào profile sau khi đơn được tạo thành công.

**[E1] Số dư CoolCash không đủ để thanh toán toàn bộ:**
- Xem UC11 [A1] — Member dùng CoolCash kết hợp với phương thức khác.

**Hậu điều kiện:** Sale Order tạo thành công; CoolCash bị trừ ngay (nếu đã dùng); email xác nhận đã gửi.

---

## UC09 — Thanh toán COD

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Chọn thanh toán khi nhận hàng — không cần trả trước.

**Tiền điều kiện:**
- Customer đang ở bước chọn phương thức thanh toán (UC07 bước 5 hoặc UC08 bước 7).
- COD đang được bật cho website này.

**Luồng chính (Main Flow):**
1. Customer nhìn thấy tab "Thanh toán khi nhận hàng (COD)" ở khu vực phương thức thanh toán.
2. Customer chọn tab COD.
3. Hệ thống hiển thị ghi chú "Bạn sẽ thanh toán khi nhận được hàng. Chỉ áp dụng trong nội địa Việt Nam."
4. Customer nhấn "ĐẶT HÀNG".
5. Hệ thống tạo đơn với trạng thái payment = "COD — Chờ thu tiền".
6. Email xác nhận đơn hàng gửi đến Customer.

**[A1] COD kết hợp CoolCash:**
- Customer dùng CoolCash để trả 1 phần, phần còn lại thu khi giao hàng.
- Đơn hàng ghi rõ: "CoolCash: −X.000 VNĐ | COD: Y.000 VNĐ".

**[E1] COD không khả dụng cho địa chỉ này:**
- Một số địa chỉ xa / tỉnh đặc biệt có thể bị tắt COD.
- Hệ thống ẩn tab COD, hiển thị thông báo "COD không khả dụng cho khu vực này, vui lòng chọn phương thức khác".

**Hậu điều kiện:** Đơn hàng tạo thành công; payment chờ thu khi giao.

---

## UC10 — Thanh toán Online (VNPay / MoMo / ZaloPay)

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Thanh toán trực tuyến qua cổng thanh toán Việt Nam. **(Gap: App Store hoặc Custom)**

**Tiền điều kiện:**
- Customer đang ở bước chọn phương thức thanh toán.
- Ít nhất một cổng thanh toán online (VNPay/MoMo/ZaloPay) đang hoạt động.

**Luồng chính (Main Flow — ví dụ: VNPay):**
1. Customer chọn "VNPay" từ danh sách phương thức thanh toán.
2. Customer nhấn "ĐẶT HÀNG".
3. Hệ thống tạo đơn hàng ở trạng thái "Chờ thanh toán", lưu Order ID.
4. Hệ thống redirect Customer đến cổng VNPay với thông tin đơn hàng.
5. Customer hoàn tất thanh toán trên VNPay (chọn ngân hàng, nhập OTP).
6. VNPay gửi **payment callback** (webhook) về hệ thống.
7. Hệ thống xác thực chữ ký callback, đối chiếu Order ID.
8. Hệ thống cập nhật đơn hàng: trạng thái = "Đã thanh toán".
9. Hệ thống cộng CoolCash cho Member (nếu FF-06 bật) → xem UC14.
10. Hệ thống redirect Customer về trang xác nhận đơn hàng thành công.

**[A1] Customer dùng MoMo hoặc ZaloPay:**
- Luồng tương tự, chỉ khác cổng thanh toán được redirect đến.

**[A2] Callback xử lý trùng (duplicate callback):**
- Hệ thống kiểm tra idempotency key — bỏ qua callback thứ 2 trở đi cho cùng Order ID.

**[E1] Thanh toán bị từ chối tại cổng:**
- Customer hủy hoặc thẻ bị từ chối trên VNPay.
- Cổng redirect về URL thất bại của hệ thống.
- Hệ thống giữ đơn trạng thái "Chờ thanh toán", hiển thị thông báo "Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức khác."
- Customer có thể thử lại hoặc chuyển sang COD.

**[E2] Timeout — không nhận được callback:**
- Sau X phút không có callback, hệ thống tự động hủy đơn qua cron job, giải phóng tồn kho đã giữ.
- Gửi email thông báo đơn hàng đã hết hạn.

**Hậu điều kiện (thành công):** Đơn hàng trạng thái "Đã thanh toán"; Invoice được tạo tự động.

---

## UC11 — Thanh toán bằng CoolCash

**Actor chính:** Member (đã đăng nhập, có số dư CoolCash)  
**Mục tiêu:** Dùng CoolCash (tiền tệ loyalty 1:1 VNĐ) để thanh toán toàn bộ hoặc một phần đơn hàng. **(FF-06, Gap: Custom)**

**Tiền điều kiện:**
- FF-06 (CoolCash) đang bật.
- Member đã đăng nhập, có số dư CoolCash > 0.
- Đang ở trang `/cart`.

**Luồng chính (Main Flow — thanh toán toàn bộ bằng CoolCash):**
1. Hệ thống hiển thị số dư CoolCash: "Số dư CoolCash: 150.000 CoolCash".
2. Member bật toggle "Dùng CoolCash để thanh toán".
3. Hệ thống tính: nếu số dư ≥ tổng đơn → hiển thị "Thanh toán 0 VNĐ bằng CoolCash".
4. Phần "Chọn phương thức thanh toán" ẩn đi (không cần chọn thêm).
5. Member nhấn "ĐẶT HÀNG".
6. Hệ thống kiểm tra số dư CoolCash realtime tại thời điểm tạo đơn (tránh race condition).
7. Hệ thống trừ CoolCash từ balance của Member.
8. Hệ thống tạo đơn hàng trạng thái "Đã thanh toán (CoolCash)".
9. Ghi lịch sử giao dịch CoolCash: "Đã dùng X CoolCash — Đơn hàng #YYYY".

**[A1] Số dư CoolCash không đủ thanh toán toàn bộ:**
- Hệ thống hiển thị: "Dùng 100.000 CoolCash, còn lại 50.000 VNĐ thanh toán bằng:".
- Member chọn thêm phương thức bổ sung (COD, VNPay...) cho phần còn lại.
- Hệ thống xử lý thanh toán kết hợp.

**[A2] Member tắt toggle CoolCash:**
- Hệ thống khôi phục tổng đơn về giá gốc, hiển thị lại phần chọn phương thức thanh toán.

**[E1] Số dư CoolCash vừa bị trừ bởi session khác (race condition):**
- Tại thời điểm xác nhận đơn, số dư không còn đủ.
- Hệ thống trả lỗi "Số dư CoolCash không đủ, vui lòng kiểm tra lại".
- Không tạo đơn; Member thấy số dư CoolCash thực tế mới nhất.

**[E2] CoolCash đã hết hạn:**
- Phần CoolCash hết hạn không được tính vào số dư khả dụng.
- Hệ thống chỉ hiển thị số dư còn hiệu lực.

**Hậu điều kiện:** CoolCash bị trừ từ balance; đơn hàng thanh toán thành công.

---

## UC12 — Đăng ký tài khoản

**Actor chính:** Guest  
**Mục tiêu:** Tạo tài khoản mới để hưởng quyền lợi thành viên (CoolCash, CoolClub, lưu địa chỉ...).

**Tiền điều kiện:**
- Guest chưa có tài khoản hoặc chưa đăng nhập.

**Luồng chính (Main Flow):**
1. Guest nhấp "Đăng ký" từ header hoặc từ trang checkout.
2. Hệ thống hiển thị form đăng ký: Email, Mật khẩu, Xác nhận mật khẩu, Họ tên.
3. Guest điền thông tin và nhấn "Tạo tài khoản".
4. Hệ thống validate: email hợp lệ, chưa được dùng, mật khẩu đủ mạnh (≥ 8 ký tự).
5. Hệ thống tạo tài khoản, gửi email xác thực đến địa chỉ đã nhập.
6. Hệ thống tự động đăng nhập Guest vào tài khoản mới.
7. Guest (nay là Member) được chuyển đến trang chào mừng hoặc trang trước đó.
8. Hệ thống tạo referral code duy nhất cho Member **(FF-08)**.
9. Hệ thống khởi tạo số dư CoolCash = 0, hạng CoolClub = mặc định **(FF-06, FF-07)**.

**[A1] Đăng ký từ trang Checkout:**
- Sau đăng ký thành công, hệ thống redirect trở về `/cart`, giỏ hàng được giữ nguyên.

**[E1] Email đã được đăng ký:**
- Hệ thống hiển thị "Email này đã có tài khoản. Vui lòng đăng nhập hoặc dùng email khác."

**[E2] Mật khẩu không khớp:**
- Hệ thống hiển thị "Mật khẩu xác nhận không khớp" inline.

**Hậu điều kiện:** Tài khoản Member được tạo; CoolCash = 0; referral code được phát.

---

## UC13 — Đăng nhập Social (Google / Facebook / Zalo)

**Actor chính:** Guest  
**Mục tiêu:** Đăng nhập nhanh bằng tài khoản mạng xã hội, không cần nhớ mật khẩu. **(FF-17, FF-18)**

**Tiền điều kiện:**
- FF-17 (Social Login) đang bật.
- Guest đang ở trang đăng nhập hoặc checkout.

**Luồng chính (Main Flow — Google):**
1. Guest nhấp "Đăng nhập bằng Google".
2. Hệ thống redirect đến Google OAuth consent screen.
3. Guest đồng ý cấp quyền (tên, email, ảnh đại diện).
4. Google trả về authorization code về callback URL của hệ thống.
5. Hệ thống đổi code lấy access token, lấy thông tin profile từ Google.
6. Hệ thống kiểm tra email từ Google đã có tài khoản chưa:
   - **Có**: đăng nhập vào tài khoản hiện tại.
   - **Chưa**: tự động tạo tài khoản mới (xem UC12 bước 8-9).
7. Member được đăng nhập, redirect về trang trước đó.

**[A1] Đăng nhập bằng Facebook:**
- Luồng tương tự, sử dụng Facebook OAuth. **(FF-17)**

**[A2] Đăng nhập bằng Zalo (QR):** **(FF-18, Gap: Custom)**
- Hệ thống hiển thị QR code Zalo Mini App.
- Guest mở Zalo trên điện thoại, quét QR.
- Zalo xác thực và trả về thông tin profile (Zalo User ID, tên, avatar).
- Hệ thống xử lý tương tự bước 6-7.

**[E1] Guest từ chối cấp quyền trên OAuth:**
- Hệ thống redirect về trang đăng nhập, hiển thị thông báo "Đăng nhập bị hủy. Vui lòng thử lại hoặc dùng email/mật khẩu."

**[E2] Email từ Social provider đã có tài khoản đăng ký bằng email/mật khẩu:**
- Hệ thống yêu cầu Guest xác thực quyền sở hữu tài khoản email đó (nhập mật khẩu hoặc OTP) trước khi liên kết.

**Hậu điều kiện:** Member được đăng nhập; nếu tài khoản mới, CoolCash = 0 và referral code được phát.

---

## UC14 — Tích lũy CoolCash sau mua hàng

**Actor chính:** System (tự động), Member  
**Mục tiêu:** Sau khi đơn hàng hoàn tất, Member tự động nhận CoolCash cashback theo hạng CoolClub. **(FF-06)**

**Tiền điều kiện:**
- FF-06 (CoolCash) đang bật.
- Member đã đặt hàng thành công và đơn hàng chuyển sang trạng thái "Đã giao hàng" (hoặc "Đã thanh toán" với COD).

**Luồng chính (Main Flow):**
1. Đơn hàng cập nhật trạng thái "Đã giao hàng".
2. Hệ thống kích hoạt automation: tính CoolCash = `giá trị đơn hàng × % cashback theo hạng CoolClub của Member`.
3. Hệ thống cộng CoolCash vào balance của Member.
4. Hệ thống ghi lịch sử giao dịch: "Nhận X CoolCash — Hoàn tiền từ đơn hàng #YYYY".
5. *(Tuỳ config)* Hệ thống gửi notification/email: "Bạn vừa nhận X CoolCash!".
6. Hệ thống tính lại tổng chi tiêu tích luỹ của Member → kiểm tra điều kiện nâng hạng CoolClub (xem UC15).

**[A1] Member dùng CoolCash để thanh toán 1 phần đơn:**
- CoolCash cashback chỉ tính trên phần giá trị thanh toán bằng tiền thật (không tính trên phần thanh toán bằng CoolCash).

**[A2] Đơn hàng bị hoàn trả (Return):**
- Hệ thống thu hồi CoolCash đã phát cho đơn đó (nếu còn trong balance).
- Nếu Member đã tiêu CoolCash đó, ghi nợ âm vào lịch sử, trừ ở lần earn tiếp theo.

**[E1] Tỷ lệ cashback chưa được cấu hình cho hạng của Member:**
- Hệ thống dùng tỷ lệ mặc định (0%) và ghi log cảnh báo cho Admin.

**Hậu điều kiện:** Balance CoolCash của Member tăng; lịch sử giao dịch được ghi nhận.

---

## UC15 — Nâng hạng CoolClub

**Actor chính:** System (tự động), Member  
**Mục tiêu:** Hệ thống tự động nâng hạng CoolClub khi tổng chi tiêu tích luỹ của Member đạt ngưỡng cấu hình. **(FF-07)**

**Tiền điều kiện:**
- FF-07 (CoolClub) đang bật.
- Admin đã cấu hình các ngưỡng tier và tỷ lệ cashback tương ứng.

**Luồng chính (Main Flow):**
1. Sau UC14, hệ thống cập nhật tổng chi tiêu tích luỹ của Member.
2. Hệ thống so sánh tổng chi tiêu mới với ngưỡng của hạng kế tiếp.
3. Tổng chi tiêu đạt ngưỡng → hệ thống thay đổi hạng của Member (ví dụ: từ Silver → Gold).
4. Hệ thống cập nhật % cashback CoolCash mới theo hạng Gold.
5. Hệ thống gửi email chúc mừng nâng hạng: "Chúc mừng! Bạn đã lên hạng [Gold] CoolClub!"
6. Email kèm thông tin quyền lợi của hạng mới.
7. Member Portal cập nhật hiển thị hạng mới và thanh tiến trình đến hạng tiếp theo.

**[A1] Member xem tiến trình trong Portal:**
- Member vào `/my/account` (hoặc trang CoolClub), thấy:
  - Hạng hiện tại: Gold.
  - Tổng chi tiêu: 3.200.000 VNĐ / 5.000.000 VNĐ (ngưỡng lên Platinum).
  - Thanh progress bar trực quan.

**[A2] Member ở hạng cao nhất (Platinum):**
- Hệ thống không thực hiện nâng hạng; không gửi email nâng hạng.
- Portal hiển thị "Bạn đang ở hạng cao nhất!" thay vì thanh tiến trình.

**[E1] Tổng chi tiêu bị reset sau Return:**
- Khi đơn hàng bị hoàn trả, tổng chi tiêu bị trừ lại.
- Nếu tổng mới rơi xuống dưới ngưỡng hạng hiện tại → hệ thống **hạ hạng** và thông báo cho Member.
- *Lưu ý: đây là quyết định business cần confirm — hạ hạng hay giữ nguyên?*

**Hậu điều kiện:** Hạng CoolClub của Member được cập nhật; email thông báo đã gửi.

---

## UC16 — Chia sẻ Referral Code và nhận CoolCash

**Actor chính:** Member (người giới thiệu)  
**Mục tiêu:** Member chia sẻ referral code cá nhân; khi bạn bè mua hàng thành công lần đầu, Member nhận 10% CoolCash. **(FF-08)**

**Tiền điều kiện:**
- FF-08 (Referral) đang bật.
- Member đã đăng nhập, có referral code (phát tự động khi tạo tài khoản).

**Luồng chính (Main Flow):**
1. Member vào trang referral (ví dụ: `/my/referral` hoặc widget trong portal).
2. Hệ thống hiển thị referral code cá nhân (ví dụ: `COOL-NGUYEN123`).
3. Member copy link referral hoặc chia sẻ qua mạng xã hội.
4. Bạn bè nhận link, truy cập website, và áp dụng referral code khi checkout (xem UC17).
5. Bạn bè hoàn tất đơn hàng đầu tiên thành công.
6. Hệ thống tính: CoolCash cho Member = 10% × giá trị đơn hàng của bạn bè.
7. Hệ thống cộng CoolCash vào balance của Member.
8. Hệ thống ghi lịch sử: "Nhận X CoolCash từ referral — Bạn bè: [tên/email ẩn danh]".
9. *(Tuỳ config)* Gửi notification cho Member "Bạn bè của bạn vừa mua hàng, bạn nhận được X CoolCash!".

**[A1] Member xem lịch sử referral:**
- Trang portal hiển thị danh sách: tổng số bạn bè đã giới thiệu, tổng CoolCash đã nhận từ referral.

**[E1] Bạn bè sử dụng referral code nhưng không hoàn tất đơn hàng:**
- CoolCash chưa được phát; hệ thống chỉ phát sau khi đơn hàng thành công (không phải khi áp code).

**Hậu điều kiện:** Balance CoolCash của Member tăng theo % giá trị đơn hàng bạn bè.

---

## UC17 — Áp dụng Referral Code khi Checkout

**Actor chính:** New Customer (chưa từng mua hàng)  
**Mục tiêu:** New Customer nhập referral code của bạn bè tại checkout để kích hoạt quyền lợi referral. **(FF-08)**

**Tiền điều kiện:**
- FF-08 (Referral) đang bật.
- New Customer có referral code hợp lệ từ bạn bè.
- New Customer đang ở trang `/cart`, chưa từng hoàn tất đơn hàng nào trước đó.

**Luồng chính (Main Flow):**
1. New Customer điền form giao hàng tại trang `/cart`.
2. New Customer nhìn thấy ô "Mã giới thiệu" và nhập referral code.
3. Hệ thống validate:
   - Code tồn tại và thuộc về 1 Member.
   - New Customer chưa từng đặt đơn thành công (điều kiện "đơn hàng đầu tiên").
   - New Customer không nhập code của chính mình.
4. Hệ thống xác nhận code hợp lệ, hiển thị "Mã giới thiệu hợp lệ — Bạn đang được giới thiệu bởi [Tên bạn bè]".
5. New Customer hoàn tất đặt hàng (UC07 hoặc UC08).
6. Sau khi đơn thành công, hệ thống kích hoạt referral reward → UC16 bước 6-9.

**[A1] New Customer muốn biết quyền lợi khi nhập code:**
- Hệ thống hiển thị tooltip: "Khi nhập mã giới thiệu, bạn bè của bạn sẽ nhận thêm CoolCash từ đơn hàng này."

**[E1] Referral code không tồn tại:**
- Hệ thống hiển thị "Mã giới thiệu không hợp lệ" inline.

**[E2] Customer đã từng mua hàng trước đây:**
- Hệ thống phát hiện email/account đã có lịch sử đơn hàng.
- Hiển thị "Mã giới thiệu chỉ áp dụng cho lần mua hàng đầu tiên."

**[E3] Customer nhập code của chính mình:**
- Hệ thống phát hiện code thuộc về chính tài khoản đang đặt hàng.
- Hiển thị "Bạn không thể dùng mã giới thiệu của chính mình."

**Hậu điều kiện:** Referral code được ghi nhận vào đơn hàng; reward sẽ được phát sau khi đơn thành công.

---

## UC18 — Theo dõi trạng thái đơn hàng

**Actor chính:** Customer (Guest hoặc Member)  
**Mục tiêu:** Kiểm tra trạng thái hiện tại và lịch sử cập nhật của đơn hàng đã đặt.

**Tiền điều kiện:**
- Đơn hàng đã được tạo thành công (UC07 hoặc UC08 đã hoàn tất).

**Luồng chính (Main Flow — Member đã đăng nhập):**
1. Member đăng nhập, vào "Tài khoản" → "Đơn hàng của tôi".
2. Hệ thống hiển thị danh sách đơn hàng: mã đơn, ngày đặt, tổng tiền, trạng thái.
3. Member nhấp vào 1 đơn cụ thể.
4. Hệ thống hiển thị chi tiết: danh sách sản phẩm, địa chỉ giao hàng, phương thức thanh toán, lịch sử trạng thái.
5. Nếu đơn đang giao: hiển thị tracking number và link tra cứu GHN/GHTK.

**[A1] Guest theo dõi bằng mã đơn + email:**
- Guest truy cập trang tracking, nhập mã đơn hàng + email đã dùng khi đặt.
- Hệ thống hiển thị thông tin đơn hàng mà không yêu cầu đăng nhập.

**[A2] Customer nhận email cập nhật tự động:**
- Mỗi khi trạng thái đơn thay đổi (Confirmed, Shipped, Delivered), hệ thống gửi email thông báo kèm tracking link.

**[E1] Mã đơn hoặc email không khớp (Guest):**
- Hệ thống hiển thị "Không tìm thấy đơn hàng với thông tin này."

**Hậu điều kiện:** Customer nắm được trạng thái mới nhất của đơn hàng.

---

## UC19 — Đổi / Trả hàng và Hoàn tiền

**Actor chính:** Customer, Warehouse Staff  
**Mục tiêu:** Xử lý yêu cầu hoàn trả sản phẩm và hoàn tiền cho Customer.

**Tiền điều kiện:**
- Đơn hàng ở trạng thái "Đã giao hàng".
- Còn trong thời hạn đổi trả (ví dụ: 30 ngày).

**Luồng chính (Main Flow):**
1. Customer vào portal → tìm đơn hàng → nhấn "Yêu cầu đổi/trả".
2. Customer chọn sản phẩm muốn trả, nhập lý do và đính kèm ảnh (nếu yêu cầu).
3. Hệ thống tạo Return Request, thông báo cho Staff.
4. Staff xem xét và duyệt Return Request trong Odoo backend.
5. Staff tạo Return Delivery (reverse picking) — nhận hàng về kho.
6. Hàng nhập kho, tồn kho tăng lại.
7. Staff tạo Credit Note (hoàn tiền): hoàn vào phương thức thanh toán gốc hoặc cộng vào CoolCash.
8. Hệ thống gửi email xác nhận hoàn tiền cho Customer.
9. Hệ thống thu hồi CoolCash cashback đã phát cho đơn đó (xem UC14 [A2]).

**[A1] Hoàn tiền bằng CoolCash thay vì tiền mặt:**
- Customer chọn nhận hoàn tiền bằng CoolCash (xử lý nhanh hơn so với refund ngân hàng).
- Hệ thống cộng CoolCash tương ứng vào balance.

**[E1] Yêu cầu đổi trả quá hạn:**
- Hệ thống kiểm tra ngày đặt hàng, hiển thị "Đơn hàng này đã quá thời hạn đổi trả (30 ngày)."

**[E2] Staff từ chối Return Request:**
- Staff ghi lý do từ chối trong backend.
- Hệ thống gửi email thông báo từ chối kèm lý do cho Customer.

**Hậu điều kiện:** Hàng nhập kho; Customer nhận tiền hoàn; CoolCash cashback bị thu hồi nếu cần.

---

## UC20 — Quản lý Wishlist

**Actor chính:** Member (đã đăng nhập)  
**Mục tiêu:** Lưu sản phẩm yêu thích để theo dõi và mua sau. **(FF-01)**

**Tiền điều kiện:**
- FF-01 (Wishlist) đang bật.
- Member đã đăng nhập.

**Luồng chính (Main Flow):**
1. Member đang xem trang product detail.
2. Member nhấp icon "♡" (Thêm vào Wishlist).
3. Hệ thống lưu sản phẩm (Product Template, không gắn với variant cụ thể) vào Wishlist của Member.
4. Icon chuyển thành "♥" (đã lưu).
5. Member vào trang `/wishlist` để xem danh sách sản phẩm đã lưu.
6. Member nhấp "Thêm vào giỏ" từ Wishlist → chọn variant → UC03.
7. Sau khi thêm vào giỏ thành công, Member có thể xóa sản phẩm đó khỏi Wishlist.

**[A1] Member xóa sản phẩm khỏi Wishlist:**
- Nhấp icon "♥" lần nữa trên product page, hoặc nhấp "Xóa" trên trang `/wishlist`.
- Hệ thống xóa khỏi danh sách, cập nhật icon về "♡".

**[A2] Sản phẩm trong Wishlist hết hàng:**
- Trang `/wishlist` hiển thị badge "Hết hàng" trên sản phẩm đó.
- Nút "Thêm vào giỏ" bị disabled.
- *(Tuỳ chọn FF-04)* Member đăng ký nhận thông báo khi có hàng trở lại.

**[E1] Guest cố gắng thêm vào Wishlist khi chưa đăng nhập:**
- Hệ thống hiển thị modal "Vui lòng đăng nhập để lưu sản phẩm yêu thích."
- Guest có thể đăng nhập nhanh từ modal này.

**Hậu điều kiện:** Sản phẩm được lưu trong Wishlist của Member; Member có thể quay lại mua sau.
