{
    'name': 'FashionOS - Config',
    'version': '19.0.1.0.0',
    'category': 'eCommerce',
    'summary': 'Feature flags and business configuration for FashionOS',
    'description': '''
FashionOS Config
================
Centralised feature-flag store (FF-01..FF-20) and business configuration
parameters for the FashionOS headless eCommerce platform.

All flags are stored in ir.config_parameter so they survive module upgrades
and are editable from Settings → FashionOS Config.
''',
    'author': 'FashionOS',
    'depends': ['base', 'mail'],
    'data': [
        'data/config_defaults.xml',
        'views/res_config_settings_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
