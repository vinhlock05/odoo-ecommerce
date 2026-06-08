{
    'description': (
        'FashionOS REST API — Sprint 3 deliverable. '
        'Provides JWT-authenticated REST endpoints for the headless storefront: '
        '/fashionos/api/v1/auth/*, /fashionos/api/v1/catalog/*, '
        '/fashionos/api/v1/cart/*, /fashionos/api/v1/account/*. '
        'JWT is implemented with Python stdlib hmac/hashlib (HS256). '
        'Secret is read from ir.config_parameter key fashionos.jwt.secret_key.'
    ),
    'name': 'FashionOS — REST API',
    'version': '19.0.1.0.0',
    'category': 'Fashion Store',
    'summary': 'Full REST API: auth, catalog, cart, account endpoints',
    'author': 'TechNext',
    'depends': [
        'fashionos_base',
        'fashion_store_config',
        'fashion_store_product',
        'fashion_store_sale',
        'fashion_store_loyalty',
        'payment_vnpay',
        'delivery_ghn',
        'fashion_store_combo',
        'fashion_store_return',
        'fashion_store_routing',
    ],
    'data': [],
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
    'post_init_hook': 'post_init_hook',
}
