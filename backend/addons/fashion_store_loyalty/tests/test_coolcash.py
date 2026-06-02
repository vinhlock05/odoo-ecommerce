"""Tests for CoolCash wallet (earn, redeem, tier logic)."""
from odoo.tests import TransactionCase, tagged


@tagged('fashion', 'coolcash')
class TestCoolCash(TransactionCase):

    def setUp(self):
        super().setUp()
        self.partner = self.env['res.partner'].create({
            'name': 'Test Customer',
            'email': 'testcoolcash@fashionos.test',
            'customer_rank': 1,
        })
        self.LoyaltyTxn = self.env['loyalty.transaction']

    # ------------------------------------------------------------------
    # Wallet credit / debit
    # ------------------------------------------------------------------

    def test_wallet_credit(self):
        """Earning CoolCash increases balance."""
        self.LoyaltyTxn._create_txn(
            partner=self.partner,
            txn_type='earn',
            amount=100_000,
            description='Test earn',
        )
        self.assertEqual(self.partner.x_coolcash_balance, 100_000)

    def test_wallet_debit(self):
        """Redeeming CoolCash decreases balance."""
        self.LoyaltyTxn._create_txn(
            partner=self.partner, txn_type='earn',
            amount=200_000, description='Setup balance',
        )
        self.LoyaltyTxn._create_txn(
            partner=self.partner, txn_type='redeem',
            amount=-50_000, description='Test redeem',
        )
        self.assertEqual(self.partner.x_coolcash_balance, 150_000)

    def test_wallet_debit_insufficient_raises(self):
        """Redeeming more than balance raises UserError."""
        from odoo.exceptions import UserError
        with self.assertRaises(UserError):
            self.LoyaltyTxn._create_txn(
                partner=self.partner, txn_type='redeem',
                amount=-1, description='Should fail',
            )

    def test_balance_after_recorded(self):
        """Transaction records correct balance_after."""
        txn = self.LoyaltyTxn._create_txn(
            partner=self.partner, txn_type='earn',
            amount=75_000, description='Test',
        )
        self.assertEqual(txn.balance_after, 75_000)

    # ------------------------------------------------------------------
    # Tier logic
    # ------------------------------------------------------------------

    def test_tier_member_default(self):
        self.assertEqual(self.partner.x_loyalty_tier, 'member')

    def test_tier_upgrades_to_silver(self):
        self.partner.write({'x_lifetime_spend': 5_000_000})
        self.partner.action_recalculate_tier()
        self.assertEqual(self.partner.x_loyalty_tier, 'silver')

    def test_tier_upgrades_to_gold(self):
        self.partner.write({'x_lifetime_spend': 15_000_000})
        self.partner.action_recalculate_tier()
        self.assertEqual(self.partner.x_loyalty_tier, 'gold')

    def test_earn_rate_by_tier(self):
        self.partner.write({'x_loyalty_tier': 'gold'})
        self.assertAlmostEqual(self.partner.coolcash_earn_rate(), 0.03)
        self.partner.write({'x_loyalty_tier': 'silver'})
        self.assertAlmostEqual(self.partner.coolcash_earn_rate(), 0.02)
        self.partner.write({'x_loyalty_tier': 'member'})
        self.assertAlmostEqual(self.partner.coolcash_earn_rate(), 0.01)
