"""Tests for referral code system."""
from odoo.tests import TransactionCase, tagged


@tagged('fashion', 'referral')
class TestReferral(TransactionCase):

    def setUp(self):
        super().setUp()
        self.ReferralCode = self.env['referral.code']
        self.referrer = self.env['res.partner'].create({
            'name': 'Referrer', 'email': 'referrer@test.com', 'customer_rank': 1,
        })
        self.referee = self.env['res.partner'].create({
            'name': 'Referee', 'email': 'referee@test.com', 'customer_rank': 1,
        })

    def test_code_auto_generated(self):
        """get_or_create creates a REF-XXXXXX code."""
        rc = self.ReferralCode.get_or_create(self.referrer)
        self.assertTrue(rc.code.startswith('REF-'), f'Expected REF- prefix, got {rc.code}')
        self.assertEqual(len(rc.code), 10)  # REF- + 6 hex chars

    def test_code_unique_per_partner(self):
        """Calling get_or_create twice returns the same record."""
        rc1 = self.ReferralCode.get_or_create(self.referrer)
        rc2 = self.ReferralCode.get_or_create(self.referrer)
        self.assertEqual(rc1.id, rc2.id)

    def test_code_unique_across_partners(self):
        """Two different partners get different codes."""
        rc1 = self.ReferralCode.get_or_create(self.referrer)
        rc2 = self.ReferralCode.get_or_create(self.referee)
        self.assertNotEqual(rc1.code, rc2.code)

    def test_referral_stats_initial(self):
        """New code has zero referrals and zero earned."""
        rc = self.ReferralCode.get_or_create(self.referrer)
        total_referred, total_earned = rc.get_stats()
        self.assertEqual(total_referred, 0)
        self.assertEqual(total_earned, 0)

    def test_reward_log_stats(self):
        """Reward log entries appear in get_stats()."""
        rc = self.ReferralCode.get_or_create(self.referrer)
        product = self.env['product.product'].create({'name': 'Test Product', 'list_price': 100000})
        order = self.env['sale.order'].create({
            'partner_id': self.referee.id,
            'order_line': [(0, 0, {'product_id': product.id, 'product_uom_qty': 1, 'price_unit': 100000})],
        })
        self.env['referral.reward.log'].create({
            'referral_code_id': rc.id,
            'referee_partner_id': self.referee.id,
            'order_id': order.id,
            'referee_discount': 50_000,
            'referrer_reward': 100_000,
        })
        total_referred, total_earned = rc.get_stats()
        self.assertEqual(total_referred, 1)
        self.assertEqual(total_earned, 100_000)
