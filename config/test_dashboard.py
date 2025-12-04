"""
Tests for Dashboard Summary API
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from products.models import Product, Brand, Category
from quotes.models import Quote, QuoteType, QuoteState
from contacts.models import Contact, ContactState, Message

User = get_user_model()


class DashboardSummaryTestCase(TestCase):
    """
    Test suite for the dashboard summary endpoint.
    """

    def setUp(self):
        """Set up test data for dashboard tests."""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        # Create API client and authenticate
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create test data for products
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category', display_order=1)

        Product.objects.create(
            name='Product 1',
            brand=self.brand,
            category=self.category,
            is_active=True
        )
        Product.objects.create(
            name='Product 2',
            brand=self.brand,
            category=self.category,
            is_active=True
        )

        # Create test data for contacts and quotes
        contact_state = ContactState.objects.create(name='Active')
        self.contact = Contact.objects.create(
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            company_name='Test Company',
            state=contact_state
        )

        quote_type = QuoteType.objects.create(name='Standard')
        quote_state = QuoteState.objects.create(name='Draft')

        Quote.objects.create(
            contact=self.contact,
            quote_type=quote_type,
            state=quote_state,
            total_amount=1000
        )

        # Create test messages
        Message.objects.create(
            first_name='Jane',
            last_name='Smith',
            company_name='Another Company',
            message='Test message',
            state=contact_state
        )

    def test_dashboard_summary_authenticated(self):
        """
        Test 1: Dashboard summary returns data when authenticated
        """
        response = self.client.get('/dashboard/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('recent_activity', response.data)

    def test_dashboard_summary_stats_structure(self):
        """
        Test 2: Dashboard summary has correct stats structure
        """
        response = self.client.get('/dashboard/summary/')

        stats = response.data['stats']
        self.assertIn('active_users', stats)
        self.assertIn('products', stats)
        self.assertIn('quotes', stats)
        self.assertIn('new_messages', stats)

        # Verify data types
        self.assertIsInstance(stats['active_users'], int)
        self.assertIsInstance(stats['products'], int)
        self.assertIsInstance(stats['quotes'], int)
        self.assertIsInstance(stats['new_messages'], int)

    def test_dashboard_summary_counts_correct(self):
        """
        Test 3: Dashboard summary returns correct counts
        """
        response = self.client.get('/dashboard/summary/')

        stats = response.data['stats']

        # We created 1 active user (testuser)
        self.assertEqual(stats['active_users'], 1)

        # We created 2 active products
        self.assertEqual(stats['products'], 2)

        # We created 1 quote
        self.assertEqual(stats['quotes'], 1)

        # We created 1 message
        self.assertEqual(stats['new_messages'], 1)

    def test_dashboard_summary_recent_activity(self):
        """
        Test 4: Dashboard summary includes recent activity
        """
        response = self.client.get('/dashboard/summary/')

        recent_activity = response.data['recent_activity']
        self.assertIsInstance(recent_activity, list)

        # Should have at least some activity
        self.assertGreaterEqual(len(recent_activity), 1)

        # Check structure of first activity item
        if len(recent_activity) > 0:
            first_activity = recent_activity[0]
            self.assertIn('type', first_activity)
            self.assertIn('title', first_activity)
            self.assertIn('time_ago', first_activity)

    def test_dashboard_summary_unauthenticated(self):
        """
        Test 5: Dashboard summary requires authentication
        """
        # Create unauthenticated client
        unauth_client = APIClient()
        response = unauth_client.get('/dashboard/summary/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_summary_activity_types(self):
        """
        Test 6: Dashboard summary includes different activity types
        """
        response = self.client.get('/dashboard/summary/')

        recent_activity = response.data['recent_activity']

        # Collect all activity types
        activity_types = {item['type'] for item in recent_activity}

        # Should have at least one type
        self.assertGreater(len(activity_types), 0)

        # Verify valid types
        valid_types = {'quote', 'message', 'product'}
        for activity_type in activity_types:
            self.assertIn(activity_type, valid_types)
