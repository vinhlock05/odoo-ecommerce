{
    'name': 'FashionOS - Sale',
    'version': '19.0.1.0.0',
    'category': 'eCommerce',
    'summary': 'Fashion-specific sale order fields: CoolCash, referral, smart routing',
    'description': '''
FashionOS Sale
==============
Extends sale.order and sale.order.line with fashion-specific fields:

sale.order:
- Gender title (Anh / Chị)
- Alternate receiver (name, phone, address)
- CoolCash amount used / earned
- Referral code
- Smart routing: split-order flag, routed warehouse
- Return request links

sale.order.line:
- Combo header / component flags
- Parent combo line reference (Many2one self)
''',
    'author': 'FashionOS',
    'depends': ['sale', 'fashion_store_config', 'stock'],
    'data': [],  # mail_templates.xml deferred: needs QWeb conversion for Odoo 19
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
