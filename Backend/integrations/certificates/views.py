from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .service import CertificateSearchError, search_certificates


class CertificateSearchAPIView(APIView):
    """
    Proxy público hacia Fisher / Solstice.
    POST { provider, articleNo?, lotNo? }
    """

    permission_classes = [AllowAny]
    throttle_classes = []  # búsqueda pública ligera; el upstream ya limita

    def post(self, request, *args, **kwargs):
        provider = request.data.get("provider") or request.data.get("brand")
        article_no = request.data.get("articleNo") or request.data.get("article_no")
        lot_no = request.data.get("lotNo") or request.data.get("lot_no")

        try:
            result = search_certificates(
                provider=provider,
                article_no=article_no,
                lot_no=lot_no,
            )
        except CertificateSearchError as exc:
            return Response(
                {"message": str(exc)},
                status=exc.status_code
                if 400 <= exc.status_code < 600
                else status.HTTP_400_BAD_REQUEST,
            )

        return Response(result, status=status.HTTP_200_OK)
