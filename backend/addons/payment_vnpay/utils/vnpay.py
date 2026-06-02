"""VNPay HMAC-SHA512 utilities."""
import hashlib
import hmac
from datetime import datetime
from urllib.parse import urlencode, quote_plus

VNPAY_SANDBOX_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
VNPAY_LIVE_URL = 'https://pay.vnpay.vn/vpcpay.html'


def build_payment_url(
    *,
    tmn_code: str,
    hash_secret: str,
    amount_vnd: int,
    order_info: str,
    txn_ref: str,
    return_url: str,
    ip_addr: str = '127.0.0.1',
    locale: str = 'vn',
    sandbox: bool = True,
) -> str:
    """Build a signed VNPay payment URL.

    Args:
        tmn_code:   VNPay terminal code (TmnCode).
        hash_secret: HMAC-SHA512 secret key.
        amount_vnd: Order amount in VND (will be multiplied by 100 for VNPay).
        order_info: Short description shown on VNPay payment page.
        txn_ref:    Unique order/transaction reference (max 100 chars).
        return_url: Frontend URL VNPay redirects the customer to after payment.
        ip_addr:    Customer IP address.
        locale:     'vn' or 'en'.
        sandbox:    True = use sandbox endpoint, False = live endpoint.

    Returns:
        Fully signed VNPay payment URL.
    """
    now = datetime.now()
    create_date = now.strftime('%Y%m%d%H%M%S')
    expire_date = now.replace(minute=now.minute + 15).strftime('%Y%m%d%H%M%S')

    params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmn_code,
        'vnp_Amount': str(int(amount_vnd) * 100),
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': txn_ref,
        'vnp_OrderInfo': order_info,
        'vnp_OrderType': 'other',
        'vnp_Locale': locale,
        'vnp_ReturnUrl': return_url,
        'vnp_IpAddr': ip_addr,
        'vnp_CreateDate': create_date,
        'vnp_ExpireDate': expire_date,
    }

    base_url = VNPAY_SANDBOX_URL if sandbox else VNPAY_LIVE_URL
    return _sign_and_build(base_url, params, hash_secret)


def verify_return_params(params: dict, hash_secret: str) -> bool:
    """Verify HMAC-SHA512 signature on VNPay return/IPN parameters.

    Modifies params in-place by removing vnp_SecureHash* keys before hashing.
    Returns True if the computed signature matches vnp_SecureHash.
    """
    received_hash = params.pop('vnp_SecureHash', '')
    params.pop('vnp_SecureHashType', None)

    query_string = _build_query_string(params)
    expected = hmac.new(
        hash_secret.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected.lower(), received_hash.lower())


def _sign_and_build(base_url: str, params: dict, hash_secret: str) -> str:
    """Sort params, compute HMAC-SHA512 signature, return complete URL."""
    query_string = _build_query_string(params)
    signature = hmac.new(
        hash_secret.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha512,
    ).hexdigest()
    return f'{base_url}?{query_string}&vnp_SecureHash={signature}'


def _build_query_string(params: dict) -> str:
    """Return URL-encoded query string with keys sorted alphabetically."""
    sorted_items = sorted(params.items())
    return urlencode(sorted_items, quote_via=quote_plus)
