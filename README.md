# FashionOS — Headless Fashion eCommerce

FashionOS là một nền tảng headless eCommerce hoàn chỉnh kết hợp sức mạnh hệ thống ERP của **Odoo 19** (backend) và sự linh hoạt, tốc độ của **Next.js 16** (frontend), giao tiếp thông qua hệ thống REST API custom bảo mật bằng JWT authentication.

## Giới thiệu & Mục đích

Dự án được xây dựng dưới dạng **dự án cá nhân học tập và nghiên cứu** trong quá trình thực tập tại **TechNext** (đối tác chính thức **Odoo Partner**). 

**Mục đích của dự án:**
- **Nghiên cứu kiến trúc Headless:** Tách biệt hoàn toàn tầng hiển thị (frontend) và tầng dữ liệu/ERP (backend) để tối ưu hóa trải nghiệm người dùng và tốc độ tải trang.
- **Làm chủ Odoo 19:** Tìm hiểu sâu về Odoo ORM, cách viết custom modules, bảo mật, kế thừa mô hình bán hàng và quản lý kho trong phiên bản Odoo mới nhất.
- **Áp dụng thực tiễn:** Xây dựng một kiến trúc tham chiếu phù hợp cho các thương hiệu thời trang tại Việt Nam (theo mô hình Coolmate/Gymbody), tích hợp sẵn các dịch vụ nội địa phổ biến như VNPay và Giao Hàng Nhanh (GHN).
- **Quy chuẩn hóa quy trình phát triển:** Áp dụng hệ điều hành Harness hỗ trợ phát triển bằng AI (Coding Agents) hiệu quả, an toàn.

---

## Kiến trúc Hệ thống

```
[Next.js 16 + TypeScript]  ←  REST API  →  [Odoo 19 + Python]
   App Router + Tailwind        JWT            11 custom modules
        :3000                               PostgreSQL 16 + :8069
              ↑
         [nginx + SSL]
```

---

## Tính năng đã xây dựng

| Phân hệ | Chi tiết tính năng |
|------|-------------|
| **Tài khoản & Auth** | Đăng ký, đăng nhập hệ thống REST API bảo mật với custom JWT (HS256) |
| **Danh mục sản phẩm** | Quản lý sản phẩm, biến thể, thuộc tính màu sắc/kích thước, SEO Slug tự động chuyển đổi tiếng Việt |
| **Giỏ hàng (Cart)** | Quản lý giỏ hàng lưu trữ trên Odoo thông qua trạng thái nháp (`x_is_cart`) |
| **Thanh toán (Checkout)**| Lưu trữ danh sách địa chỉ nhận hàng, áp dụng mã giới thiệu, tính toán đơn hàng |
| **Cổng thanh toán** | Tích hợp cổng thanh toán VNPay kiểm thử chữ ký bảo mật HMAC-SHA512 |
| **Đơn vị vận chuyển** | Tích hợp GHN API v2 tự động tạo đơn giao hàng và xử lý webhook trạng thái |
| **Khách hàng thân thiết**| Tích hợp ví điểm CoolCash tích/tiêu điểm, phân hạng thành viên (Member/Silver/Gold) |
| **Mã giới thiệu (Referral)**| Tự động tạo mã giới thiệu, giảm giá 50k cho người được giới thiệu, tặng 100k cho người giới thiệu |
| **Đổi trả hàng (Returns)**| Khách hàng tự gửi yêu cầu đổi trả trên portal, tự động hoàn trả điểm CoolCash tương ứng |
| **Điều hướng kho (Routing)**| Thuật toán Smart Routing tự động chọn kho xuất hàng gần nhất dựa trên tỉnh/thành của khách hàng |
| **Động cơ Combo (Combo)** | Tự động phân tách sản phẩm Combo thành các dòng sản phẩm con chi tiết khi xác nhận đơn hàng |
| **AI Dashboard & Catalog**| Tích hợp Claude API gợi ý sản phẩm và bảng thông tin phân tích cho admin |

---

## Công nghệ Sử dụng (Tech Stack)

| Tầng | Công nghệ cụ thể |
|-------|-----------|
| **Backend** | Odoo 19, Python 3.11 |
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS v4 |
| **Cơ sở dữ liệu** | PostgreSQL 16 |
| **Xác thực API** | Custom JWT (sử dụng thư viện chuẩn Python `hmac` + `hashlib`) |
| **Cổng thanh toán** | VNPay SandBox |
| **Vận chuyển** | GHN Open API |
| **DevOps / Môi trường** | Docker Compose, GitHub Actions (CI/CD) |
| **Giám sát hệ thống** | Sentry, Webhook kiểm tra trạng thái `/api/health` |
| **Hạ tầng triển khai** | Nginx reverse proxy, SSL Certbot, pg_dump backup tự động |

---

## Hướng dẫn Chạy Nhanh (Development)

**Yêu cầu hệ thống:** Docker, Docker Compose, Node.js 20+

```bash
# 1. Clone dự án và cấu hình biến môi trường
git clone https://github.com/vinhlock05/odoo-ecommerce.git
cd odoo-ecommerce
cp .env.example .env   # Điền mật khẩu và cấu hình local của bạn

# 2. Khởi động Odoo & PostgreSQL backend
docker compose up -d

# 3. Khởi tạo và cài đặt các module Odoo (Chỉ cần chạy lần đầu)
docker compose exec odoo odoo -d fashionos \
  --init=fashion_store_api --stop-after-init

# 4. Khởi động Next.js Storefront frontend
cd frontend/fashionos-web
npm install
npm run dev   # Truy cập tại http://localhost:3000
```

Odoo Admin Dashboard: http://localhost:8069 (Database: `fashionos`)

---

## Quy trình phát triển với Coding Agent (Harness)

Dự án này tích hợp sẵn hệ thống **Harness** để chuẩn hóa quy trình làm việc giữa lập trình viên và các AI coding agents (Claude Code, Cursor, Windsurf, Copilot, v.v.).

Khi bắt đầu code hoặc thêm tính năng mới, vui lòng đọc các tài liệu sau để nắm rõ quy tắc:
- **[Quy trình phát triển Spec (DEVELOPMENT_FLOW.md)](file:///c:/My%20Folder/Project/odoo-ecommerce/docs/DEVELOPMENT_FLOW.md)**: Quy trình 7 bước cụ thể (từ Intake, tạo Story, Code, Test đến ghi nhận Trace).
- **[Quy ước Harness (HARNESS.md)](file:///c:/My%20Folder/Project/odoo-ecommerce/docs/HARNESS.md)**: Cách thức tương tác và sử dụng CLI `harness-cli` cục bộ.

---

## Cấu trúc Thư mục Dự án

```
├── backend/
│   ├── addons/           # 11 custom Odoo modules
│   │   ├── fashionos_base/
│   │   ├── fashion_store_api/      # JWT + 50+ REST endpoints
│   │   ├── fashion_store_loyalty/  # CoolCash + referral
│   │   ├── payment_vnpay/          # Cổng thanh toán VNPay
│   │   ├── delivery_ghn/           # Webhook & API GHN
│   │   └── ...
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/fashionos-web/
│   ├── app/              # Next.js App Router Pages (storefront)
│   ├── components/       # UI Components tái sử dụng
│   └── lib/api.ts        # Typed API client giao tiếp Odoo
├── infra/
│   ├── nginx/            # Cấu hình Nginx reverse proxy, SSL
│   ├── backup/           # Script backup & phục hồi database PostgreSQL
│   ├── monitoring/       # Cấu hình uptime check
│   └── setup/            # Script cấu hình máy chủ ban đầu
├── .github/workflows/    # CI (typecheck + lint) + CD (SSH deploy)
├── docker-compose.yml
└── docker-compose.prod.yml
```

---

## Triển khai Production

```bash
# Trên máy chủ Ubuntu 22.04 mới:
curl -sL https://raw.githubusercontent.com/vinhlock05/odoo-ecommerce/main/infra/setup/server-setup.sh | sudo bash

# Đăng nhập bằng user deploy và chạy:
cd /opt/fashionos
cp .env.example .env && nano .env
bash infra/setup/first-deploy.sh
sudo certbot --nginx -d yourdomain.com
```

---

## Tham chiếu API

- **Base URL:** `/fashionos/api/v1/`  
- **Header xác thực:** `Authorization: Bearer <jwt_token>`
- **Các endpoint chính:** `POST /auth/login`, `GET /catalog/products`, `POST /cart/items`, `POST /cart/checkout`, `GET /account/orders`, `POST /account/returns`

---

## Bài học Rút ra từ Dự án (Learnings)

Thông qua việc phát triển dự án FashionOS trong kỳ thực tập tại TechNext, bản thân đã tích lũy được nhiều bài học quý giá:

1. **Lập trình và Tùy biến Odoo 19:**
   - Hiểu rõ triết lý thiết kế module của Odoo, cách kế thừa các model lõi (`sale.order`, `product.template`, `res.partner`) mà không phá vỡ tính toàn vẹn của ERP gốc.
   - Sử dụng các API nâng cao của Odoo ORM và hiểu rõ tầm quan trọng của việc cập nhật trạng thái thông qua các hàm có sẵn như `.write()` thay vì gán trực tiếp để hệ thống đồng bộ chuẩn xác.
2. **Thiết kế REST API & Xác thực JWT:**
   - Xây dựng tầng API gateway không dùng các framework hỗ trợ sẵn (do OCA rest-framework chưa có branch cho Odoo 19) giúp hiểu sâu sắc về kiến trúc HTTP Controller của Odoo và cấu trúc payload JWT.
   - Nhận thức tầm quan trọng của việc parse và xác thực dữ liệu chặt chẽ ngay tại ranh giới API (Boundary) bằng cách xử lý lỗi `ValueError` để chống lại các request lỗi cấu trúc.
3. **Tích hợp Dịch vụ Vận chuyển & Thanh toán thực tế:**
   - Nắm vững quy trình thanh toán Redirect và ký chữ ký số HMAC-SHA512 bảo vệ giao dịch VNPay.
   - Xử lý các luồng webhook bất đồng bộ từ cổng giao hàng (GHN) để cập nhật trạng thái đơn hàng thời gian thực trên Odoo ERP.
4. **Kiến trúc Headless eCommerce:**
   - Tối ưu hóa hiệu năng bằng cách kết hợp sức mạnh quản lý giao dịch của ERP với giao diện Next.js động, mượt mà giúp cải thiện điểm số SEO và trải nghiệm mua sắm của khách hàng.
5. **Vận hành Harness & Quy trình DevOps:**
   - Làm quen với cách thức quản lý vòng đời tính năng qua Harness để theo dõi dấu vết phát triển (Trace) và giảm thiểu tối đa rủi ro khi deploy code lên môi trường production.
   - Cấu hình Nginx reverse proxy an toàn, tự động hóa backup cơ sở dữ liệu định kỳ và thiết lập CI/CD tự động bằng GitHub Actions.

---

## License

Dự án phát hành dưới giấy phép MIT.
