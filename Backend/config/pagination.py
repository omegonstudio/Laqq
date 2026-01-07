"""
Custom pagination classes for the API.
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that provides complete pagination metadata.

    Response format:
    {
        "count": 100,           # Total number of items
        "next": "http://...",   # URL to next page (null if last page)
        "previous": "http://...", # URL to previous page (null if first page)
        "page_size": 25,        # Number of items per page
        "current_page": 2,      # Current page number
        "total_pages": 4,       # Total number of pages
        "results": [...]        # Array of items for current page
    }
    """
    page_size = 25
    page_size_query_param = 'page_size'  # Allow client to override page size
    max_page_size = 100  # Maximum allowed page size

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page.paginator.per_page,  # Use actual page size from paginator
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })
