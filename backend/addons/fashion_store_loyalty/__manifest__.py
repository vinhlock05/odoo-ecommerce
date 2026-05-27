{
    'name': 'FashionOS - Loyalty (CoolCash)',
    'version': '19.0.1.0.0',
    'category': 'eCommerce',
    'summary': 'CoolCash loyalty programme: earn, redeem, tier management',
    'description': '''
FashionOS Loyalty — CoolCash
============================
Adds a full CoolCash loyalty programme to FashionOS:

res.partner:
- x_coolcash_balance  — current spendable balance (VND)
- x_loyalty_tier      — member / silver / gold
- x_lifetime_spend    — cumulative confirmed order spend (VND)

loyalty.transaction:
- Immutable ledger: earn / redeem / expire / adjustment rows
- award_order_coolcash()  — create earn row after order confirm
- redeem_for_order()      — create redeem row and deduct balance

Tier thresholds (lifetime spend):
- member : 0 VND (default)
- silver : >= 5,000,000 VND
- gold   : >= 15,000,000 VND

Earn rates:
- member : 1%
- silver : 2%
- gold   : 3%

CoolCash unit = 1 VND.
''',
    'author': 'FashionOS',
    'depends': [
        'fashionos_base',
        'fashion_store_sale',
        'fashion_store_config',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/cron.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
