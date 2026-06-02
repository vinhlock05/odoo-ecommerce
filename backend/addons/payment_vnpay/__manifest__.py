{
    'name': 'FashionOS - VNPay Payment',
    'version': '19.0.1.0.0',
    'category': 'eCommerce/Payment',
    'summary': 'VNPay payment gateway integration for FashionOS',
    'description': '''
FashionOS VNPay
===============
Integrates VNPay payment gateway with FashionOS REST API.

Flow:
1. POST /payment/vnpay/create → generates signed VNPay payment URL
2. User pays on VNPay payment page
3. GET  /payment/vnpay/return → VNPay redirect back with result
4. POST /payment/vnpay/ipn    → VNPay IPN webhook confirms payment

Config keys (ir.config_parameter):
  fashionos.vnpay.tmn_code    — VNPay Terminal ID (TmnCode)
  fashionos.vnpay.hash_secret — HMAC-SHA512 secret key
  fashionos.vnpay.return_url  — Frontend URL VNPay redirects to
  fashionos.vnpay.ipn_url     — Backend IPN endpoint URL
  fashionos.vnpay.sandbox     — '1' = sandbox, '0' = production
''',
    'author': 'FashionOS',
    'depends': [
        'fashionos_base',
        'fashion_store_sale',
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
