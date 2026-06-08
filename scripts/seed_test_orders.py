#!/usr/bin/env python3
"""Create test orders via the FashionOS REST API so order history page has data.

Flow per user:
  1. Register (or reuse existing) test account
  2. Login -> JWT token
  3. GET /cart -> get or create cart
  4. POST /cart/items -> add 2-3 products
  5. POST /account/addresses -> create shipping address
  6. POST /cart/checkout -> confirm order
  7. Repeat for 3 test users with 2 orders each
"""
import json
import sys
import urllib.request
import urllib.error

BASE = 'http://localhost:8069/fashionos/api/v1'


def call(method, path, body=None, token=None):
    url = f'{BASE}{path}'
    data = json.dumps(body).encode() if body else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())


def get_products(limit=10):
    resp = call('GET', f'/catalog/products?limit={limit}')
    return resp.get('data', [])


def main():
    products = get_products(20)
    if not products:
        print('[ERR] No products returned from catalog')
        sys.exit(1)
    print(f'[INFO] {len(products)} products available')

    TEST_USERS = [
        {'email': 'testuser1@fashionos.vn', 'name': 'Test User 1', 'phone': '0901000001'},
        {'email': 'testuser2@fashionos.vn', 'name': 'Test User 2', 'phone': '0901000002'},
        {'email': 'testuser3@fashionos.vn', 'name': 'Test User 3', 'phone': '0901000003'},
    ]

    total_orders = 0

    for user_info in TEST_USERS:
        email = user_info['email']
        password = 'Test@1234!'

        # Register (ignore error if already exists)
        reg = call('POST', '/auth/register', {
            'email': email,
            'password': password,
            'name': user_info['name'],
            'phone': user_info['phone'],
        })
        if reg.get('success'):
            print(f'[OK] Registered {email}')
        else:
            print(f'[INFO] {email} may already exist: {reg.get("error", {}).get("code", "")}')

        # Login
        login = call('POST', '/auth/login', {'email': email, 'password': password})
        if not login.get('success'):
            print(f'[ERR] Login failed for {email}: {login}')
            continue
        token = login['data']['token']
        partner_id = login['data']['partner_id']
        print(f'[OK] Logged in as {email} (partner_id={partner_id})')

        # Create shipping address
        addr = call('POST', '/account/addresses', {
            'name': user_info['name'],
            'phone': user_info['phone'],
            'street': '123 Nguyen Hue',
            'city': 'Ho Chi Minh',
            'country_id': 241,  # Vietnam
        }, token=token)
        if not addr.get('success'):
            print(f'[WARN] Could not create address: {addr.get("error")}')
            # Try to get existing addresses
            addrs = call('GET', '/account/addresses', token=token)
            if not addrs.get('data'):
                print(f'[ERR] No address available for {email}, skipping')
                continue
            addr_id = addrs['data'][0]['id']
        else:
            addr_id = addr['data']['id']

        print(f'[OK] Using address id={addr_id}')

        # Place 2 orders for this user
        for order_num in range(1, 3):
            # Clear cart first (DELETE items)
            cart_resp = call('GET', '/cart', token=token)
            if cart_resp.get('data', {}).get('items'):
                call('DELETE', '/cart', token=token)

            # Pick 2-3 products (offset by order_num so orders differ)
            offset = (order_num - 1) * 3
            selected = products[offset:offset + 2]

            for prod in selected:
                # Use first variant id
                variants = prod.get('variants', [])
                if not variants:
                    continue
                variant_id = variants[0]['id']
                qty = order_num  # order 1 = qty 1, order 2 = qty 2
                add_resp = call('POST', '/cart/items', {
                    'product_id': variant_id,
                    'quantity': qty,
                }, token=token)
                sname = prod["name"][:35].encode('ascii', 'replace').decode('ascii')
                if add_resp.get('success'):
                    print(f'  [OK] Added {sname} x{qty}')
                else:
                    print(f'  [WARN] Could not add {sname}: {add_resp.get("error")}')

            # Checkout
            checkout = call('POST', '/cart/checkout', {
                'delivery_address_id': addr_id,
                'note': f'Test order #{order_num} - do not fulfill',
            }, token=token)

            if checkout.get('success'):
                order = checkout['data']
                print(f'[OK] Order #{order_num} placed: {order.get("order_name")} total={order.get("amount_total"):,.0f} VND')
                total_orders += 1
            else:
                print(f'[ERR] Checkout failed for order #{order_num}: {checkout.get("error")}')

    print(f'\n[OK] Done -- {total_orders} test orders created')


if __name__ == '__main__':
    main()
