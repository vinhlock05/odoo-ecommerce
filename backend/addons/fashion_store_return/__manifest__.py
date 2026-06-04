{
    'name': 'FashionOS - Returns Portal',
    'version': '19.0.1.0.0',
    'category': 'eCommerce',
    'summary': 'KF-1: Customer-initiated returns with CoolCash refund',
    'depends': ['fashion_store_sale', 'fashion_store_loyalty'],
    'data': ['security/ir.model.access.csv', 'data/sequence.xml'],  # mail_templates.xml deferred: needs QWeb conversion for Odoo 19
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
