#!/usr/bin/env python3
"""FashionOS Product Seeder — 35+ products across 8 categories with size/color variants."""
import xmlrpc.client
import sys

URL = 'http://localhost:8069'
DB = 'fashionos'

def main():
    common = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/common')

    uid = None
    used_pwd = None
    for user, pwd in [('admin', 'admin'), ('admin', 'odoo'), ('admin', 'admin1'), ('odoo', 'odoo')]:
        try:
            result = common.authenticate(DB, user, pwd, {})
            if result:
                uid = result
                used_pwd = pwd
                print(f"✅ Authenticated as {user} (uid={uid})")
                break
        except Exception:
            continue

    if not uid:
        print("❌ Authentication failed — check Odoo admin password")
        sys.exit(1)

    models = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/object')

    def call(model, method, *args, **kwargs):
        return models.execute_kw(DB, uid, used_pwd, model, method, list(args), kwargs)

    # ---- Categories ----
    print("\n📁 Setting up categories...")

    def get_or_create_cat(name, parent_id=None):
        domain = [('name', '=', name)]
        if parent_id:
            domain.append(('parent_id', '=', parent_id))
        ids = call('product.category', 'search', domain)
        if ids:
            return ids[0]
        vals = {'name': name}
        if parent_id:
            vals['parent_id'] = parent_id
        return call('product.category', 'create', vals)

    cat_root     = get_or_create_cat('FashionOS')
    cat_tops     = get_or_create_cat('Áo', cat_root)
    cat_bottoms  = get_or_create_cat('Quần', cat_root)
    cat_outer    = get_or_create_cat('Áo Khoác & Hoodie', cat_root)

    cat_tshirt   = get_or_create_cat('Áo Thun', cat_tops)
    cat_polo     = get_or_create_cat('Áo Polo', cat_tops)
    cat_tank     = get_or_create_cat('Áo Ba Lỗ', cat_tops)
    cat_shirt    = get_or_create_cat('Áo Sơ Mi', cat_tops)
    cat_shorts   = get_or_create_cat('Quần Short', cat_bottoms)
    cat_jogger   = get_or_create_cat('Quần Jogger', cat_bottoms)
    cat_pants    = get_or_create_cat('Quần Dài', cat_bottoms)
    cat_hoodie   = get_or_create_cat('Hoodie & Sweatshirt', cat_outer)
    cat_jacket   = get_or_create_cat('Áo Khoác', cat_outer)

    print("  ✅ Categories ready")

    # ---- Attributes ----
    print("\n🎨 Setting up attributes...")

    def get_or_create_attr(name):
        ids = call('product.attribute', 'search', [('name', '=', name)])
        if ids:
            return ids[0]
        return call('product.attribute', 'create', {'name': name, 'create_variant': 'always'})

    size_attr_id  = get_or_create_attr('Size')
    color_attr_id = get_or_create_attr('Màu sắc')

    def get_or_create_val(attr_id, name):
        ids = call('product.attribute.value', 'search', [
            ('attribute_id', '=', attr_id), ('name', '=', name)
        ])
        if ids:
            return ids[0]
        return call('product.attribute.value', 'create', {'attribute_id': attr_id, 'name': name})

    SZ = {s: get_or_create_val(size_attr_id, s) for s in ['XS', 'S', 'M', 'L', 'XL', 'XXL']}
    CL = {c: get_or_create_val(color_attr_id, c) for c in [
        'Trắng', 'Đen', 'Xám', 'Xanh Navy', 'Xanh Cobalt', 'Xanh Mint',
        'Đỏ', 'Đỏ Burgundy', 'Xanh Olive', 'Be/Kem', 'Nâu', 'Cam', 'Tím', 'Hồng',
    ]}

    print("  ✅ Attributes ready")

    def attr_lines(sizes, colors):
        lines = []
        if sizes:
            lines.append((0, 0, {'attribute_id': size_attr_id, 'value_ids': [(6, 0, [SZ[s] for s in sizes if s in SZ])]}))
        if colors:
            lines.append((0, 0, {'attribute_id': color_attr_id, 'value_ids': [(6, 0, [CL[c] for c in colors if c in CL])]}))
        return lines

    # ---- Products ----
    print("\n👕 Creating products...")

    PRODUCTS = [
        # ===== ÁO THUN =====
        dict(name='Áo Thun Cotton CoolFit Nam', list_price=299000, categ_id=cat_tshirt,
             x_gender_type='male', x_material='Cotton 100%', x_technology='CoolFit',
             description_sale='Áo thun cotton 100% cao cấp, công nghệ CoolFit giữ mát suốt ngày. Phù hợp đi làm và thể thao nhẹ.',
             sizes=['S','M','L','XL','XXL'], colors=['Trắng','Đen','Xám','Xanh Navy']),

        dict(name='Áo Thun Oversize Unisex Basic', list_price=259000, categ_id=cat_tshirt,
             x_gender_type='unisex', x_material='Cotton 60% Polyester 40%', x_technology='Softwave',
             description_sale='Form rộng basic, cotton-polyester blend mềm mại thoáng khí. Dễ phối nhiều phong cách.',
             sizes=['S','M','L','XL'], colors=['Trắng','Đen','Xám','Be/Kem']),

        dict(name='Áo Thun Nữ Slimfit DryFit', list_price=279000, categ_id=cat_tshirt,
             x_gender_type='female', x_material='Polyester 90% Spandex 10%', x_technology='DryFit',
             description_sale='Form slim tôn dáng, vải DryFit thoát ẩm nhanh. Tập yoga, gym hoặc mặc hàng ngày.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Đen','Xanh Cobalt','Hồng']),

        dict(name='Áo Thun Thể Thao Nam AirMesh', list_price=349000, categ_id=cat_tshirt,
             x_gender_type='male', x_material='Polyester AirMesh 100%', x_technology='AirMesh Pro',
             description_sale='Chất liệu AirMesh siêu thoáng, hút ẩm cực nhanh. Thiết kế ergonomic hỗ trợ vận động.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xanh Navy','Xanh Cobalt','Đỏ']),

        dict(name='Áo Thun Unisex Graphic Tee', list_price=319000, categ_id=cat_tshirt,
             x_gender_type='unisex', x_material='Cotton 100% Washed', x_technology='ColorLock Print',
             description_sale='In graphic nghệ thuật, cotton wash mềm mịn. Giặt bền màu không phai.',
             sizes=['S','M','L','XL'], colors=['Trắng','Be/Kem','Xanh Mint']),

        dict(name='Áo Thun Cổ V Nam Bamboo', list_price=389000, categ_id=cat_tshirt,
             x_gender_type='male', x_material='Bamboo Fiber 70% Cotton 30%', x_technology='BambooTech',
             description_sale='Sợi tre tự nhiên kháng khuẩn khử mùi. Siêu mềm mại, thân thiện môi trường.',
             sizes=['S','M','L','XL','XXL'], colors=['Trắng','Xám','Xanh Olive','Nâu']),

        dict(name='Áo Thun Nữ Crop Basic', list_price=239000, categ_id=cat_tshirt,
             x_gender_type='female', x_material='Cotton 95% Spandex 5%', x_technology='SoftStretch',
             description_sale='Áo thun nữ dạng crop, cạp ngắn trendy. Vải cotton co giãn nhẹ thoải mái.',
             sizes=['XS','S','M','L'], colors=['Trắng','Đen','Hồng','Tím']),

        # ===== ÁO POLO =====
        dict(name='Áo Polo Nam CoolTech Classic', list_price=449000, categ_id=cat_polo,
             x_gender_type='male', x_material='Cotton Pique 100%', x_technology='CoolTech',
             description_sale='Vải pique cotton cao cấp, CoolTech kiểm soát nhiệt độ. Cổ bo thoáng, không bai giãn.',
             sizes=['S','M','L','XL','XXL'], colors=['Trắng','Đen','Xanh Navy','Đỏ Burgundy']),

        dict(name='Áo Polo Nam Slim Fit Performance', list_price=499000, categ_id=cat_polo,
             x_gender_type='male', x_material='Cotton 65% Polyester 35%', x_technology='Performance Blend',
             description_sale='Slim fit cho dân công sở năng động. Thoáng khí, chống nhăn nhẹ.',
             sizes=['S','M','L','XL'], colors=['Trắng','Xanh Navy','Xám','Xanh Cobalt']),

        dict(name='Áo Polo Nữ Short Sleeve', list_price=419000, categ_id=cat_polo,
             x_gender_type='female', x_material='Cotton Pique 95% Spandex 5%', x_technology='CoolFit',
             description_sale='Polo nữ tay ngắn, cổ nhỏ gọn. Form body tôn dáng, phù hợp đi làm và đi chơi.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Đen','Hồng','Be/Kem']),

        dict(name='Áo Polo Thể Thao Nam DrySport UV50', list_price=549000, categ_id=cat_polo,
             x_gender_type='male', x_material='Polyester DrySport 100%', x_technology='DrySport + UV50',
             description_sale='Chuyên dụng golf và tennis. Thoát mồ hôi siêu nhanh, chống tia UV UPF50+.',
             sizes=['S','M','L','XL','XXL'], colors=['Trắng','Xanh Navy','Đen','Cam']),

        # ===== ÁO BA LỖ =====
        dict(name='Tank Top Nam Gym Performance', list_price=199000, categ_id=cat_tank,
             x_gender_type='male', x_material='Polyester AirMesh 100%', x_technology='AirMesh Pro',
             description_sale='AirMesh siêu nhẹ, không gò bó. Tối ưu cho tập gym và thể thao cường độ cao.',
             sizes=['S','M','L','XL'], colors=['Đen','Trắng','Xanh Cobalt','Đỏ']),

        dict(name='Áo Ba Lỗ Nữ Yoga Seamless', list_price=249000, categ_id=cat_tank,
             x_gender_type='female', x_material='Nylon 75% Spandex 25%', x_technology='Seamless Knit',
             description_sale='Không đường may, ôm sát. Hỗ trợ hoàn hảo cho yoga, pilates và thể dục nhịp điệu.',
             sizes=['XS','S','M','L'], colors=['Đen','Xanh Mint','Tím','Hồng']),

        dict(name='Tank Top Unisex Cotton Casual', list_price=179000, categ_id=cat_tank,
             x_gender_type='unisex', x_material='Cotton 100%', x_technology='SoftFeel',
             description_sale='Cotton thoải mái cho mùa hè, basic dễ mix đồ. Mặc hàng ngày siêu thoáng.',
             sizes=['S','M','L','XL'], colors=['Trắng','Đen','Xám','Be/Kem']),

        # ===== QUẦN SHORT =====
        dict(name='Quần Short Thể Thao Nam QuickDry', list_price=299000, categ_id=cat_shorts,
             x_gender_type='male', x_material='Polyester QuickDry 100%', x_technology='QuickDry Pro',
             description_sale='Thoáng khí, lót lưới bên trong. Phù hợp chạy bộ, tập gym, thể thao ngoài trời.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xanh Navy','Xám','Xanh Cobalt']),

        dict(name='Quần Short Nữ Bike Spandex', list_price=269000, categ_id=cat_shorts,
             x_gender_type='female', x_material='Nylon 80% Spandex 20%', x_technology='StretchFit',
             description_sale='Bike shorts ôm sát, co giãn 4 chiều. Lưng cao tôn dáng, hỗ trợ tốt khi tập luyện.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Xanh Navy','Hồng','Tím']),

        dict(name='Quần Short Casual Unisex Terry', list_price=249000, categ_id=cat_shorts,
             x_gender_type='unisex', x_material='Cotton Terry 80% Polyester 20%', x_technology='SoftTerry',
             description_sale='Vải terry cotton mềm mại, casual thoải mái. Túi bên tiện dụng, dây rút điều chỉnh.',
             sizes=['S','M','L','XL'], colors=['Xám','Đen','Be/Kem','Xanh Olive']),

        dict(name='Quần Short Bơi Nam WaveBlock', list_price=329000, categ_id=cat_shorts,
             x_gender_type='male', x_material='Polyester WaveBlock 100%', x_technology='WaveBlock + QuickDry',
             description_sale='Chống nước, khô nhanh. Dây thắt lưng, túi có khóa kéo bảo vệ đồ vật.',
             sizes=['S','M','L','XL','XXL'], colors=['Xanh Navy','Đen','Xanh Cobalt','Cam']),

        # ===== QUẦN JOGGER =====
        dict(name='Quần Jogger Nam Cotton Fleece', list_price=399000, categ_id=cat_jogger,
             x_gender_type='male', x_material='Cotton 70% Polyester 30% Fleece', x_technology='FleecePlus',
             description_sale='Cotton fleece ấm áp, cạp chun đàn hồi, túi bên tiện dụng. Mặc nhà, gym hoặc ra đường.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Xanh Navy','Nâu']),

        dict(name='Quần Jogger Nữ Slim Tapered', list_price=369000, categ_id=cat_jogger,
             x_gender_type='female', x_material='Cotton 65% Modal 35%', x_technology='ModalSoft',
             description_sale='Dáng slim tapered tôn dáng chân thon. Vải modal mềm mịn, co giãn nhẹ.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Xám','Be/Kem','Hồng']),

        dict(name='Quần Jogger AirStretch Unisex', list_price=429000, categ_id=cat_jogger,
             x_gender_type='unisex', x_material='Polyester 90% Spandex 10%', x_technology='AirStretch 4D',
             description_sale='Co giãn 4 chiều, siêu nhẹ và thoáng khí. Đường may phẳng không gây khó chịu.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Xanh Navy','Xanh Cobalt']),

        # ===== QUẦN DÀI =====
        dict(name='Quần Chino Nam Slim Fit', list_price=549000, categ_id=cat_pants,
             x_gender_type='male', x_material='Cotton Twill 98% Spandex 2%', x_technology='ComfortStretch',
             description_sale='Cotton twill bền đẹp, slim fit lịch lãm. Đi làm văn phòng đến đi chơi đều hợp.',
             sizes=['S','M','L','XL','XXL'], colors=['Be/Kem','Xanh Navy','Đen','Nâu']),

        dict(name='Quần Legging Nữ Pro Compression', list_price=449000, categ_id=cat_pants,
             x_gender_type='female', x_material='Nylon 75% Spandex 25%', x_technology='Compression Pro',
             description_sale='Compression hỗ trợ cơ bắp, lưng cao bảo phủ tốt. Vải không trong suốt khi cúi.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Xanh Navy','Tím','Xanh Cobalt']),

        dict(name='Quần Cargo Nam Utility', list_price=599000, categ_id=cat_pants,
             x_gender_type='male', x_material='Cotton Ripstop 100%', x_technology='RipStop Durable',
             description_sale='Cargo nhiều túi tiện lợi, vải ripstop bền chắc chống rách. Phong cách urban outdoorsy.',
             sizes=['S','M','L','XL','XXL'], colors=['Xanh Olive','Đen','Nâu','Xám']),

        # ===== HOODIE & SWEATSHIRT =====
        dict(name='Hoodie Fleece Classic Unisex', list_price=599000, categ_id=cat_hoodie,
             x_gender_type='unisex', x_material='Cotton 80% Polyester 20% Fleece', x_technology='FleecePlus',
             description_sale='Cotton fleece kinh điển, mũ 2 lớp giữ ấm. Form regular fit dễ mặc và dễ phối.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Trắng','Xanh Navy']),

        dict(name='Hoodie Zip-Up CoolClub Edition', list_price=699000, categ_id=cat_hoodie,
             x_gender_type='male', x_material='Cotton Pháp 100%', x_technology='FrenchTerry',
             description_sale='Khóa kéo phiên bản CoolClub, cotton pháp cao cấp, thêu logo tinh tế.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Xanh Navy','Đỏ Burgundy']),

        dict(name='Sweatshirt Nữ Crewneck Cozy', list_price=549000, categ_id=cat_hoodie,
             x_gender_type='female', x_material='Cotton 75% Polyester 25%', x_technology='CozyFleece',
             description_sale='Cổ tròn vải bông mềm mịn. Form oversize dễ thương, ấm áp ngày se lạnh.',
             sizes=['XS','S','M','L','XL'], colors=['Be/Kem','Hồng','Tím','Xám']),

        dict(name='Hoodie Oversize Unisex Y2K', list_price=629000, categ_id=cat_hoodie,
             x_gender_type='unisex', x_material='Cotton 70% Polyester 30%', x_technology='SoftFleece',
             description_sale='Form oversize trend Y2K, vải mềm dày dặn. Túi kangaroo rộng rãi tiện lợi.',
             sizes=['S','M','L','XL'], colors=['Xám','Be/Kem','Đỏ Burgundy','Xanh Navy']),

        # ===== ÁO KHOÁC =====
        dict(name='Áo Khoác Gió Nam Windbreaker', list_price=649000, categ_id=cat_jacket,
             x_gender_type='male', x_material='Nylon 100% Lightweight', x_technology='WindShield + DWR',
             description_sale='Siêu nhẹ, chống gió và thấm nước nhẹ. Gấp gọn bỏ túi, tiện mang theo mọi lúc.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xanh Navy','Xanh Cobalt','Xanh Olive']),

        dict(name='Áo Khoác Track Jacket Nữ', list_price=599000, categ_id=cat_jacket,
             x_gender_type='female', x_material='Polyester Pique 100%', x_technology='StretchFit',
             description_sale='Track jacket hai màu thời trang, tay raglan thoải mái. Khóa kéo YKK bền chắc.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Trắng','Hồng','Xanh Navy']),

        dict(name='Áo Bomber Unisex Basic', list_price=749000, categ_id=cat_jacket,
             x_gender_type='unisex', x_material='Polyester Satin 100%', x_technology='SatinSoft',
             description_sale='Bomber jacket cơ bản thời trang. Satin nhẹ bóng, lót ấm, ribbed cuffs and hem.',
             sizes=['S','M','L','XL'], colors=['Đen','Xanh Olive','Nâu','Xanh Navy']),

        dict(name='Áo Khoác Mùa Đông PufferLight', list_price=899000, categ_id=cat_jacket,
             x_gender_type='unisex', x_material='Nylon Shell + Polyester Fill', x_technology='PufferLight',
             description_sale='Áo phao siêu nhẹ ấm áp, chất độn polyester giữ nhiệt hiệu quả. Gấp gọn tiện lợi.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xanh Navy','Be/Kem','Đỏ Burgundy']),

        # ===== ÁO SƠ MI =====
        dict(name='Áo Sơ Mi Nam Oxford Slim Fit', list_price=599000, categ_id=cat_shirt,
             x_gender_type='male', x_material='Cotton Oxford 100%', x_technology='EasyIron',
             description_sale='Oxford chất lượng cao, slim fit lịch lãm. Chống nhăn nhẹ, dễ là ủi.',
             sizes=['S','M','L','XL','XXL'], colors=['Trắng','Xanh Cobalt','Xám','Xanh Navy']),

        dict(name='Áo Sơ Mi Nữ Linen Casual', list_price=549000, categ_id=cat_shirt,
             x_gender_type='female', x_material='Linen 55% Cotton 45%', x_technology='LinenSoft',
             description_sale='Linen tự nhiên siêu thoáng mát cho mùa hè. Thanh lịch, phù hợp đi làm và dạo phố.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Be/Kem','Xanh Mint','Hồng']),
    ]

    created = skipped = failed = 0

    for p in PRODUCTS:
        sizes  = p.pop('sizes', [])
        colors = p.pop('colors', [])

        existing = call('product.template', 'search', [('name', '=', p['name'])])
        if existing:
            print(f"  ⏭  Skip: {p['name']}")
            skipped += 1
            continue

        vals = {
            **{k: v for k, v in p.items()},
            'type': 'consu',
            'sale_ok': True,
            'purchase_ok': True,
            'attribute_line_ids': attr_lines(sizes, colors),
        }

        try:
            pid = call('product.template', 'create', vals)
            print(f"  ✅ Created [{pid}]: {p['name']}")
            created += 1
        except Exception as e:
            print(f"  ❌ Failed: {p['name']} — {e}")
            failed += 1

    print(f"\n🎉 Done! Created: {created} | Skipped: {skipped} | Failed: {failed}")
    print(f"   Total products in store: {call('product.template', 'search_count', [('sale_ok','=',True)])}")

if __name__ == '__main__':
    main()
