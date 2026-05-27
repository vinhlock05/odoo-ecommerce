"""
Seed demo data for FashionOS MVP presentation.

Usage (Odoo shell):
    docker compose exec -T odoo odoo shell -d fashionos < backend/scripts/seed_demo_data.py

Creates 5 fashion products with Size + Color variants, a demo customer,
and a default delivery address for checkout testing.
"""
import logging

_logger = logging.getLogger(__name__)

print("=== FashionOS Demo Data Seeder ===")

# ---------------------------------------------------------------------------
# 1. Product attributes: Size + Color
# ---------------------------------------------------------------------------

Attribute = env['product.attribute']
AttributeValue = env['product.attribute.value']

size_attr = Attribute.search([('name', '=', 'Size')], limit=1)
if not size_attr:
    size_attr = Attribute.create({'name': 'Size', 'display_type': 'select'})
    print("Created attribute: Size")
else:
    print("Size attribute already exists")

color_attr = Attribute.search([('name', '=', 'Màu sắc')], limit=1)
if not color_attr:
    color_attr = Attribute.create({'name': 'Màu sắc', 'display_type': 'color'})
    print("Created attribute: Màu sắc")
else:
    print("Màu sắc attribute already exists")

# Ensure size values exist
size_names = ['S', 'M', 'L', 'XL']
for sn in size_names:
    existing = AttributeValue.search([('name', '=', sn), ('attribute_id', '=', size_attr.id)], limit=1)
    if not existing:
        AttributeValue.create({'name': sn, 'attribute_id': size_attr.id})

# Ensure color values exist
color_data = [
    ('Đen', '#1A1A1A'),
    ('Trắng', '#F5F5F5'),
    ('Xanh Navy', '#1E3A5F'),
    ('Xám', '#9E9E9E'),
    ('Đỏ', '#D32F2F'),
]
color_vals = {}
for cname, chex in color_data:
    existing = AttributeValue.search(
        [('name', '=', cname), ('attribute_id', '=', color_attr.id)], limit=1
    )
    if not existing:
        existing = AttributeValue.create({
            'name': cname,
            'attribute_id': color_attr.id,
            'html_color': chex,
        })
    color_vals[cname] = existing

print(f"Attributes ready — Size values: {size_names}, Colors: {list(color_vals.keys())}")

# ---------------------------------------------------------------------------
# 2. Product categories
# ---------------------------------------------------------------------------

Category = env['product.category']
cat_ao = Category.search([('name', '=', 'Áo')], limit=1)
if not cat_ao:
    cat_ao = Category.create({'name': 'Áo'})

cat_quan = Category.search([('name', '=', 'Quần')], limit=1)
if not cat_quan:
    cat_quan = Category.create({'name': 'Quần'})

print("Categories: Áo, Quần")

# ---------------------------------------------------------------------------
# 3. Products
# ---------------------------------------------------------------------------

Template = env['product.template']
AttrLine = env['product.template.attribute.line']

PRODUCTS = [
    {
        'name': 'Áo Thun Active Pro',
        'list_price': 299000,
        'categ_id': cat_ao.id,
        'x_gender_type': 'unisex',
        'x_material': 'Cotton 100%',
        'x_technology': 'CoolFit',
        'x_care_instruction': 'Giặt máy 30°C, không sấy',
        'description_sale': 'Áo thun thể thao thoáng mát, thấm hút mồ hôi tốt. Phù hợp tập gym và hoạt động ngoài trời.',
        'colors': ['Đen', 'Trắng', 'Xanh Navy'],
    },
    {
        'name': 'Quần Short Chạy Bộ',
        'list_price': 249000,
        'categ_id': cat_quan.id,
        'x_gender_type': 'male',
        'x_material': 'Polyester 88% + Spandex 12%',
        'x_technology': 'DryFit',
        'x_care_instruction': 'Giặt máy 30°C, phơi khô tự nhiên',
        'description_sale': 'Quần short nhẹ, co giãn tốt. Thiết kế phù hợp cho chạy bộ và tập luyện cardio.',
        'colors': ['Đen', 'Xám', 'Đỏ'],
    },
    {
        'name': 'Áo Polo Premium',
        'list_price': 349000,
        'categ_id': cat_ao.id,
        'x_gender_type': 'male',
        'x_material': 'Pique Cotton 95% + Elastane 5%',
        'x_technology': 'CoolDry',
        'x_care_instruction': 'Giặt máy 40°C, ủi nhẹ',
        'description_sale': 'Áo polo lịch sự, phù hợp đi làm và dạo phố. Chất liệu pique cao cấp, mềm mại.',
        'colors': ['Trắng', 'Xanh Navy', 'Xám'],
    },
    {
        'name': 'Áo Khoác Gió Ultralight',
        'list_price': 499000,
        'categ_id': cat_ao.id,
        'x_gender_type': 'unisex',
        'x_material': 'Nylon 100%',
        'x_technology': 'WindShield',
        'x_care_instruction': 'Giặt tay hoặc máy chế độ nhẹ, không vắt mạnh',
        'description_sale': 'Áo khoác gió siêu nhẹ, chống nước nhẹ. Gấp gọn vào túi, tiện lợi mang theo.',
        'colors': ['Đen', 'Xanh Navy'],
    },
    {
        'name': 'Quần Jogger Comfort',
        'list_price': 399000,
        'categ_id': cat_quan.id,
        'x_gender_type': 'unisex',
        'x_material': 'Cotton 60% + Polyester 35% + Spandex 5%',
        'x_technology': 'FlexFit',
        'x_care_instruction': 'Giặt máy 30°C, phơi khô tự nhiên',
        'description_sale': 'Quần jogger co giãn 4 chiều, êm ái. Phù hợp mặc nhà, tập gym và đi dạo.',
        'colors': ['Đen', 'Xám', 'Xanh Navy'],
    },
]

created_products = []

for p_data in PRODUCTS:
    existing = Template.search([('name', '=', p_data['name'])], limit=1)
    if existing:
        print(f"Skip (exists): {p_data['name']}")
        created_products.append(existing)
        continue

    colors = p_data.pop('colors')

    tmpl = Template.create({
        **p_data,
        'type': 'consu',
        'sale_ok': True,
        'purchase_ok': False,
        'invoice_policy': 'order',
    })

    # Add Size attribute line
    size_vals = AttributeValue.search([('attribute_id', '=', size_attr.id)])
    AttrLine.create({
        'product_tmpl_id': tmpl.id,
        'attribute_id': size_attr.id,
        'value_ids': [(6, 0, size_vals.ids)],
    })

    # Add Color attribute line
    color_value_ids = [color_vals[c].id for c in colors if c in color_vals]
    AttrLine.create({
        'product_tmpl_id': tmpl.id,
        'attribute_id': color_attr.id,
        'value_ids': [(6, 0, color_value_ids)],
    })

    variant_count = len(size_vals) * len(color_value_ids)
    print(f"Created: {tmpl.name} — {variant_count} variants — {int(p_data['list_price']):,}đ")
    created_products.append(tmpl)

# ---------------------------------------------------------------------------
# 4. Demo customer + delivery address
# ---------------------------------------------------------------------------

Partner = env['res.partner']
User = env['res.users']

DEMO_EMAIL = 'demo@fashionos.vn'
DEMO_PASS = 'Demo@12345'

demo_partner = Partner.search([('email', '=', DEMO_EMAIL)], limit=1)
if not demo_partner:
    demo_partner = Partner.create({
        'name': 'Nguyễn Văn Demo',
        'email': DEMO_EMAIL,
        'phone': '0901234567',
        'x_gender_title': 'anh',
        'customer_rank': 1,
    })
    # Create portal user
    User.with_context(no_reset_password=True).create({
        'name': 'Nguyễn Văn Demo',
        'login': DEMO_EMAIL,
        'email': DEMO_EMAIL,
        'partner_id': demo_partner.id,
        'group_ids': [(6, 0, [env.ref('base.group_portal').id])],
        'password': DEMO_PASS,
    })
    print(f"\nDemo user: {DEMO_EMAIL} / {DEMO_PASS}")
else:
    print(f"\nDemo user exists: {DEMO_EMAIL}")

# Demo delivery address
demo_addr = Partner.search([
    ('parent_id', '=', demo_partner.id), ('type', '=', 'delivery')
], limit=1)
if not demo_addr:
    demo_addr = Partner.create({
        'name': 'Nguyễn Văn Demo',
        'parent_id': demo_partner.id,
        'type': 'delivery',
        'street': '123 Nguyễn Thị Minh Khai',
        'city': 'Quận 1',
        'zip': '70000',
        'country_id': env.ref('base.vn').id,
        'phone': '0901234567',
    })
    print(f"Demo address ID: {demo_addr.id} — 123 Nguyễn Thị Minh Khai, Q1")
else:
    print(f"Demo address exists: ID={demo_addr.id}")

# ---------------------------------------------------------------------------
# 5. JWT secret key (required for login to work)
# ---------------------------------------------------------------------------

ICP = env['ir.config_parameter'].sudo()
jwt_key = ICP.get_param('fashionos.jwt.secret_key', '')
if not jwt_key:
    import secrets
    jwt_secret = secrets.token_hex(32)
    ICP.set_param('fashionos.jwt.secret_key', jwt_secret)
    print(f"\nJWT secret key set: {jwt_secret[:16]}...")
else:
    print(f"\nJWT secret key already configured.")

# ---------------------------------------------------------------------------
# 6. Commit
# ---------------------------------------------------------------------------

env.cr.commit()

print("\n=== Seed complete ===")
print(f"Products: {len(created_products)}")
print(f"Demo login: {DEMO_EMAIL} / {DEMO_PASS}")
print(f"Delivery address ID (for checkout test): {demo_addr.id}")
