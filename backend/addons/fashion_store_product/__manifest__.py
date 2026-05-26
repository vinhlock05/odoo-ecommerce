{
    'name': 'FashionOS - Product',
    'version': '19.0.1.0.0',
    'category': 'eCommerce',
    'summary': 'Fashion-specific product fields, attributes and categories',
    'description': '''
FashionOS Product
=================
Extends product.template with fashion-specific fields:
- Gender type (male / female / unisex)
- Material, technology, care instructions
- Size guide URL
- Combo product support (combo header + component lines)
- SEO slug (auto-generated from product name)
- CoolCash earn rate override per product

Also loads S1 master data:
- Product attributes: Kích thước (XS→3XL), Size Quần (28→34), Màu sắc (8 colours)
- Product category tree: Áo / Quần / Phụ kiện / Đồ lót / Đồ thể thao
''',
    'author': 'FashionOS',
    'depends': ['product', 'fashion_store_config'],
    'data': [
        'data/product_attributes.xml',
        'data/product_categories.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
