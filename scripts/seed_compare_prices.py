#!/usr/bin/env python3
"""Set x_compare_price on ~15 products to enable sale badges on the storefront."""
import xmlrpc.client
import sys

URL = 'http://localhost:8069'
DB = 'fashionos'


def main():
    common = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/common')

    uid = None
    for user, pwd in [('admin', 'admin'), ('admin', 'odoo'), ('admin', 'admin1'), ('odoo', 'odoo')]:
        try:
            result = common.authenticate(DB, user, pwd, {})
            if result:
                uid = result
                print(f"[OK] Authenticated as {user} (uid={uid})")
                break
        except Exception:
            continue

    if not uid:
        print("[ERR] Authentication failed")
        sys.exit(1)

    models = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/object')

    # Fetch all saleable products (id, name, list_price)
    products = models.execute_kw(DB, uid, 'admin' if uid else 'odoo',
        'product.template', 'search_read',
        [[('sale_ok', '=', True), ('active', '=', True)]],
        {'fields': ['id', 'name', 'list_price'], 'limit': 60, 'order': 'id asc'}
    )

    print(f"[INFO] Found {len(products)} products")

    # We'll put ~15 on sale — pick every 4th product and a few extras
    # Sale discount rates: 10%, 15%, 20%, 25%, 30%
    discount_cycle = [10, 15, 20, 20, 25, 30, 15, 20, 10, 25, 30, 20, 15, 25, 10]

    sale_products = products[::4][:15]  # every 4th, max 15
    if len(sale_products) < 15:
        # pad with some from index 1
        extra = [p for p in products[1::4] if p not in sale_products]
        sale_products += extra[:15 - len(sale_products)]

    updated = 0
    for i, prod in enumerate(sale_products):
        discount = discount_cycle[i % len(discount_cycle)]
        current_price = prod['list_price']
        if current_price <= 0:
            continue
        # compare_price = current_price / (1 - discount/100), rounded to nearest 1000
        compare_price = current_price / (1 - discount / 100)
        compare_price = round(compare_price / 1000) * 1000  # round to nearest 1k VND
        if compare_price <= current_price:
            compare_price = current_price + 50000  # fallback

        models.execute_kw(DB, uid, 'admin',
            'product.template', 'write',
            [[prod['id']], {'x_compare_price': compare_price}]
        )
        safe_name = prod['name'][:40].encode('ascii', 'replace').decode('ascii')
        print(f"  SALE {safe_name:<40} {current_price:>10,.0f} -> compare {compare_price:>10,.0f} (-{discount}%)")
        updated += 1

    print(f"\n[OK] Done -- {updated} products now have sale badges")


if __name__ == '__main__':
    main()
