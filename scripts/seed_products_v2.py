#!/usr/bin/env python3
"""FashionOS Product Seeder v2 — women's + new categories (dresses, sports bra, sets, accessories)."""
import xmlrpc.client
import sys

URL = 'http://localhost:8069'
DB = 'fashionos'

def main():
    common = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/common')
    uid, used_pwd = None, 'admin'
    for user, pwd in [('admin', 'admin'), ('admin', 'odoo')]:
        result = common.authenticate(DB, user, pwd, {})
        if result:
            uid, used_pwd = result, pwd
            print(f"✅ Authenticated (uid={uid})")
            break
    if not uid:
        print("❌ Auth failed"); sys.exit(1)

    models = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/object')
    def call(model, method, *args, **kwargs):
        return models.execute_kw(DB, uid, used_pwd, model, method, list(args), kwargs)

    # ---- Get existing attrs ----
    size_attr_id  = call('product.attribute', 'search', [('name', '=', 'Size')])[0]
    color_attr_id = call('product.attribute', 'search', [('name', '=', 'Màu sắc')])[0]

    def get_or_create_val(attr_id, name):
        ids = call('product.attribute.value', 'search', [('attribute_id','=',attr_id),('name','=',name)])
        if ids: return ids[0]
        return call('product.attribute.value', 'create', {'attribute_id': attr_id, 'name': name})

    SZ = {s: get_or_create_val(size_attr_id, s) for s in ['XS','S','M','L','XL','XXL','One Size']}
    CL = {c: get_or_create_val(color_attr_id, c) for c in [
        'Trắng','Đen','Xám','Xanh Navy','Xanh Cobalt','Xanh Mint','Đỏ','Đỏ Burgundy',
        'Xanh Olive','Be/Kem','Nâu','Cam','Tím','Hồng','Vàng Nhạt','Xanh Sage','Đen Trắng',
    ]}

    # ---- Get/create categories ----
    def get_or_create_cat(name, parent_id=None):
        domain = [('name','=',name)]
        if parent_id: domain.append(('parent_id','=',parent_id))
        ids = call('product.category', 'search', domain)
        if ids: return ids[0]
        vals = {'name': name}
        if parent_id: vals['parent_id'] = parent_id
        return call('product.category', 'create', vals)

    cat_root  = get_or_create_cat('FashionOS')
    cat_tops  = get_or_create_cat('Áo', cat_root)
    cat_bots  = get_or_create_cat('Quần', cat_root)
    cat_outer = get_or_create_cat('Áo Khoác & Hoodie', cat_root)

    cat_dress  = get_or_create_cat('Váy & Đầm', cat_root)
    cat_sets   = get_or_create_cat('Đồ Bộ Thể Thao', cat_root)
    cat_inner  = get_or_create_cat('Đồ Lót & Sports Bra', cat_root)

    cat_tshirt = get_or_create_cat('Áo Thun', cat_tops)
    cat_polo   = get_or_create_cat('Áo Polo', cat_tops)
    cat_shirt  = get_or_create_cat('Áo Sơ Mi', cat_tops)
    cat_hoodie = get_or_create_cat('Hoodie & Sweatshirt', cat_outer)
    cat_jacket = get_or_create_cat('Áo Khoác', cat_outer)
    cat_shorts = get_or_create_cat('Quần Short', cat_bots)
    cat_jogger = get_or_create_cat('Quần Jogger', cat_bots)
    cat_pants  = get_or_create_cat('Quần Dài', cat_bots)

    def attr_lines(sizes, colors):
        lines = []
        if sizes:
            lines.append((0,0,{'attribute_id':size_attr_id,'value_ids':[(6,0,[SZ[s] for s in sizes if s in SZ])]}))
        if colors:
            lines.append((0,0,{'attribute_id':color_attr_id,'value_ids':[(6,0,[CL[c] for c in colors if c in CL])]}))
        return lines

    PRODUCTS = [
        # ===== VÁY & ĐẦM =====
        dict(name='Váy Thể Thao Nữ Tennis Skirt', list_price=349000, categ_id=cat_dress,
             x_gender_type='female', x_material='Polyester 95% Spandex 5%', x_technology='StretchFit',
             description_sale='Váy tennis nữ phong cách, lót shorts bên trong tiện lợi. Vải co giãn thoáng mát, dáng xòe nhẹ dễ chịu.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Đen','Hồng','Xanh Navy']),

        dict(name='Đầm Thể Thao Nữ Active Dress', list_price=429000, categ_id=cat_dress,
             x_gender_type='female', x_material='Nylon 80% Spandex 20%', x_technology='DryFit',
             description_sale='Đầm thể thao liền thân co giãn 4 chiều. Thiết kế 2 trong 1: đầm + shorts bên trong, phù hợp yoga và aerobic.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Xanh Cobalt','Tím','Hồng']),

        dict(name='Váy Midi Linen Nữ Casual', list_price=479000, categ_id=cat_dress,
             x_gender_type='female', x_material='Linen 60% Cotton 40%', x_technology='LinenSoft',
             description_sale='Váy midi dáng chữ A thời trang. Vải linen thoáng mát tự nhiên, phù hợp đi làm, đi chơi cuối tuần.',
             sizes=['XS','S','M','L','XL'], colors=['Be/Kem','Xanh Sage','Trắng','Hồng']),

        dict(name='Váy Mini Nữ Ribbed Knit', list_price=389000, categ_id=cat_dress,
             x_gender_type='female', x_material='Viscose 65% Nylon 35%', x_technology='RibbedKnit',
             description_sale='Váy mini dệt ribbed ôm nhẹ, vải có độ giữ form tốt. Dễ phối áo thun hoặc áo denim.',
             sizes=['XS','S','M','L'], colors=['Đen','Be/Kem','Đỏ Burgundy','Xanh Navy']),

        dict(name='Chân Váy Thể Thao Nữ Running', list_price=299000, categ_id=cat_dress,
             x_gender_type='female', x_material='Polyester QuickDry 100%', x_technology='QuickDry Pro',
             description_sale='Chân váy chạy bộ nhẹ thoáng, shorts lót bên trong. Đường xẻ hông thoải mái khi vận động mạnh.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Trắng','Hồng','Xanh Cobalt']),

        # ===== SPORTS BRA & ĐỒ LÓT =====
        dict(name='Sports Bra Nữ Medium Support', list_price=279000, categ_id=cat_inner,
             x_gender_type='female', x_material='Nylon 75% Spandex 25%', x_technology='Compression Soft',
             description_sale='Áo ngực thể thao hỗ trợ mức trung, phù hợp yoga và barre. Dây vai rộng, vải mềm không gây kích ứng.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Trắng','Hồng','Tím']),

        dict(name='Sports Bra High Support Nữ Pro', list_price=349000, categ_id=cat_inner,
             x_gender_type='female', x_material='Nylon 70% Spandex 30%', x_technology='MaxSupport',
             description_sale='Hỗ trợ cao dành cho chạy bộ và HIIT. Dây lưng chéo cố định, gọng mềm thoải mái, lớp lót thấm ẩm.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Xanh Cobalt','Xanh Mint','Be/Kem']),

        dict(name='Bralette Nữ Cotton Lace', list_price=219000, categ_id=cat_inner,
             x_gender_type='female', x_material='Cotton 90% Spandex 10%', x_technology='SoftLace',
             description_sale='Bralette cotton mềm mại có ren viền trang trí nhẹ nhàng. Không gọng thoải mái, mặc nhà hoặc mặc thấy qua áo ngoài.',
             sizes=['XS','S','M','L'], colors=['Trắng','Đen','Hồng','Be/Kem']),

        # ===== ĐỒ BỘ THỂ THAO (SETS) =====
        dict(name='Bộ Tập Yoga Nữ Seamless Set', list_price=599000, categ_id=cat_sets,
             x_gender_type='female', x_material='Nylon 75% Spandex 25%', x_technology='Seamless Knit',
             description_sale='Combo sports bra + legging không đường may đồng bộ. Co giãn 4 chiều, tôn dáng hoàn hảo khi tập yoga và gym.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Tím','Xanh Cobalt','Hồng']),

        dict(name='Bộ Thể Thao Nam Tracksuit', list_price=799000, categ_id=cat_sets,
             x_gender_type='male', x_material='Polyester 100%', x_technology='Performance Knit',
             description_sale='Bộ áo hoodie + quần jogger đồng bộ. Vải performance knit thoáng khí giữ form, thích hợp tập luyện và đường phố.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Xanh Navy']),

        dict(name='Bộ Shorts + Áo Thun Nữ Matching', list_price=499000, categ_id=cat_sets,
             x_gender_type='female', x_material='Cotton 60% Polyester 40%', x_technology='SoftBlend',
             description_sale='Bộ đôi áo thun crop + shorts đồng màu. Vải cotton blend mềm nhẹ, form thời trang dễ mặc cả ngày.',
             sizes=['XS','S','M','L','XL'], colors=['Be/Kem','Hồng','Xanh Mint','Trắng']),

        dict(name='Bộ Đồ Nhà Nữ Cozy Lounge Set', list_price=549000, categ_id=cat_sets,
             x_gender_type='female', x_material='Cotton 80% Modal 20%', x_technology='ModalSoft',
             description_sale='Bộ áo sweater + quần jogger mặc ở nhà siêu mềm. Modal-cotton ấm áp thoải mái, không cần ra ngoài vẫn chỉn chu.',
             sizes=['XS','S','M','L','XL'], colors=['Be/Kem','Hồng','Xanh Sage','Tím']),

        # ===== ÁO THUN NỮ BỔ SUNG =====
        dict(name='Áo Thun Nữ Ribbed Tank Midi', list_price=259000, categ_id=cat_tshirt,
             x_gender_type='female', x_material='Viscose 65% Polyester 35%', x_technology='RibbedKnit',
             description_sale='Áo thun kiểu ribbed body-con dài đến eo, thích hợp phối với quần high-waist hoặc chân váy.',
             sizes=['XS','S','M','L'], colors=['Đen','Be/Kem','Trắng','Xanh Sage']),

        dict(name='Áo Thun Nữ Off-Shoulder', list_price=289000, categ_id=cat_tshirt,
             x_gender_type='female', x_material='Cotton 90% Spandex 10%', x_technology='SoftStretch',
             description_sale='Áo thun trễ vai nữ tính, cổ rộng thoải mái. Vải cotton mềm co giãn nhẹ, form vừa vặn.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Đen','Hồng','Be/Kem']),

        dict(name='Áo Thun Nữ Long Sleeve Cozy', list_price=309000, categ_id=cat_tshirt,
             x_gender_type='female', x_material='Cotton 95% Spandex 5%', x_technology='SoftFeel',
             description_sale='Áo thun dài tay nữ cơ bản, chất cotton dày dặn giữ ấm nhẹ. Phù hợp mùa se lạnh hoặc mặc làm lớp trong.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Đen','Xám','Be/Kem','Hồng']),

        # ===== ÁO KHOÁC NỮ BỔ SUNG =====
        dict(name='Áo Khoác Denim Nữ Oversized', list_price=699000, categ_id=cat_jacket,
             x_gender_type='female', x_material='Cotton Denim 100%', x_technology='WashedDenim',
             description_sale='Áo khoác denim nữ form oversize classic. Vải denim wash mềm theo thời gian, phong cách casual chic bất hủ.',
             sizes=['XS','S','M','L','XL'], colors=['Xanh Cobalt','Xanh Navy','Đen Trắng']),

        dict(name='Áo Khoác Nữ Quilted Puffer', list_price=799000, categ_id=cat_jacket,
             x_gender_type='female', x_material='Nylon Shell + Polyester Fill', x_technology='PufferLight',
             description_sale='Áo puffer nữ dáng ngắn giữ ấm tốt, siêu nhẹ. Họa tiết quilted thời trang, dây kéo metallic tinh tế.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Be/Kem','Hồng','Đỏ Burgundy']),

        # ===== ÁO SƠ MI NỮ BỔ SUNG =====
        dict(name='Áo Sơ Mi Nữ Oversized Cuff', list_price=529000, categ_id=cat_shirt,
             x_gender_type='female', x_material='Cotton 100%', x_technology='EasyIron',
             description_sale='Sơ mi nữ form rộng, tay gấp cuff thời trang. Vải cotton dày dặn mát mẻ, dễ là ủi. Mix được cả cạp trong lẫn cạp ngoài.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Be/Kem','Xanh Cobalt','Vàng Nhạt']),

        dict(name='Áo Sơ Mi Nữ Floral Linen', list_price=569000, categ_id=cat_shirt,
             x_gender_type='female', x_material='Linen 55% Cotton 45%', x_technology='LinenSoft',
             description_sale='Sơ mi linen hoa nhỏ tươi tắn. Nhẹ mát thoáng khí cho mùa hè, màu hoa tinh tế không quá sặc sỡ.',
             sizes=['XS','S','M','L','XL'], colors=['Be/Kem','Trắng','Hồng']),

        # ===== QUẦN NỮ BỔ SUNG =====
        dict(name='Quần Wide Leg Nữ Linen', list_price=549000, categ_id=cat_pants,
             x_gender_type='female', x_material='Linen 60% Cotton 40%', x_technology='LinenSoft',
             description_sale='Quần ống rộng vải linen tự nhiên, lưng chun thoải mái. Dáng wide-leg tôn chiều cao, thoáng mát cả ngày.',
             sizes=['XS','S','M','L','XL'], colors=['Be/Kem','Trắng','Xanh Sage','Xám']),

        dict(name='Quần Culottes Nữ Formal', list_price=499000, categ_id=cat_pants,
             x_gender_type='female', x_material='Polyester 70% Viscose 30%', x_technology='FormalBlend',
             description_sale='Quần culottes ống rộng kiểu formal nhẹ nhàng. Phù hợp đi làm, có thể phối áo sơ mi hoặc áo thun tuck-in.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Be/Kem','Xanh Navy','Đỏ Burgundy']),

        dict(name='Quần Jogger Nữ Wide Cargo', list_price=449000, categ_id=cat_jogger,
             x_gender_type='female', x_material='Cotton 65% Polyester 35%', x_technology='SoftBlend',
             description_sale='Quần cargo jogger nữ túi hộp thời trang. Dáng rộng thoải mái, lưng chun điều chỉnh, cạp cao tôn dáng.',
             sizes=['XS','S','M','L','XL'], colors=['Đen','Xanh Olive','Be/Kem','Xám']),

        # ===== ÁO POLO NỮ BỔ SUNG =====
        dict(name='Áo Polo Nữ Sleeveless', list_price=389000, categ_id=cat_polo,
             x_gender_type='female', x_material='Cotton Pique 95% Spandex 5%', x_technology='CoolFit',
             description_sale='Áo polo không tay nữ thanh lịch. Cổ polo nhỏ gọn, armhole rộng thoáng, phù hợp tennis và golf.',
             sizes=['XS','S','M','L','XL'], colors=['Trắng','Đen','Hồng','Be/Kem']),

        # ===== SWEATSHIRT NAM BỔ SUNG =====
        dict(name='Crewneck Sweatshirt Nam Essential', list_price=529000, categ_id=cat_hoodie,
             x_gender_type='male', x_material='Cotton 80% Polyester 20%', x_technology='FleecePlus',
             description_sale='Áo sweater nam cổ tròn basic chất lượng cao. Vải bông dày dặn giữ ấm, cổ tay và gấu ribbing chắc chắn.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Xanh Navy','Be/Kem']),

        dict(name='Hoodie Nam Quarter Zip', list_price=649000, categ_id=cat_hoodie,
             x_gender_type='male', x_material='Cotton 75% Polyester 25% Fleece', x_technology='FleecePlus',
             description_sale='Hoodie nam quarter-zip cổ bẻ thể thao. Cổ 1/4 khóa kéo tiện điều chỉnh, mũ 2 lớp chắn gió nhẹ.',
             sizes=['S','M','L','XL','XXL'], colors=['Đen','Xám','Xanh Navy','Xanh Olive']),
    ]

    created = skipped = failed = 0
    for p in PRODUCTS:
        sizes  = p.pop('sizes', [])
        colors = p.pop('colors', [])

        if call('product.template', 'search_count', [('name','=',p['name'])]):
            print(f"  ⏭  Skip: {p['name']}")
            skipped += 1
            continue

        vals = {**p, 'type': 'consu', 'sale_ok': True, 'purchase_ok': True,
                'attribute_line_ids': attr_lines(sizes, colors)}
        try:
            pid = call('product.template', 'create', vals)
            print(f"  ✅ [{pid}] {p['name']}")
            created += 1
        except Exception as e:
            print(f"  ❌ {p['name']} — {e}")
            failed += 1

    total = call('product.template', 'search_count', [('sale_ok','=',True)])
    print(f"\n🎉 Done! Created: {created} | Skipped: {skipped} | Failed: {failed}")
    print(f"   Total in catalog: {total} products")

if __name__ == '__main__':
    main()
