{
    'name': 'FashionOS - GHN Delivery',
    'version': '19.0.1.0.0',
    'category': 'eCommerce/Delivery',
    'summary': 'GHN (Giao Hàng Nhanh) delivery integration for FashionOS',
    'description': '''
FashionOS GHN Integration
==========================
Integrates GHN delivery service with FashionOS.

Features:
- Create GHN shipment orders via REST API
- Receive tracking updates via GHN webhook
- Auto-update sale.order delivery status

Config keys (ir.config_parameter):
  fashionos.ghn.token     — GHN API token (from GHN merchant dashboard)
  fashionos.ghn.shop_id   — GHN shop ID
  fashionos.ghn.sandbox   — '1' = sandbox, '0' = production
''',
    'author': 'FashionOS',
    'depends': [
        'fashionos_base',
        'payment_vnpay',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/config_params.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
