{
    'name': 'FashionOS - Base',
    'version': '19.0.1.0.0',
    'category': 'eCommerce',
    'summary': 'Headless eCommerce REST API for Fashion Brands',
    'description': '''
FashionOS Base
==============
Provides REST API endpoints for headless eCommerce architecture.
Built on Odoo v19 + OCA FastAPI philosophy — Odoo as pure backend.

Endpoints:
    GET /fashionos/api/v1/health          Health check
    GET /fashionos/api/v1/products        Product list (paginated)
    GET /fashionos/api/v1/products/<id>   Single product detail
''',
    'author': 'FashionOS',
    'depends': ['product', 'sale'],
    'data': [],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
