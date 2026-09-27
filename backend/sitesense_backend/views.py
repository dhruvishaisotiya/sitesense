from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.views.generic import TemplateView


class FrontendAppView(TemplateView):
    """Serves the compiled React app.

    React Router owns client-side routing, so every non-API path returns the
    same index.html and the browser decides which page to render. In local
    development the build does not exist — Vite serves the frontend on :5173 —
    so this explains that rather than raising TemplateDoesNotExist.
    """

    template_name = 'index.html'

    def get(self, request, *args, **kwargs):
        if not Path(settings.FRONTEND_DIST, 'index.html').exists():
            return HttpResponse(
                '<h1>Frontend not built</h1>'
                '<p>Run <code>npm run build</code> in <code>frontend/</code>, '
                'or use the Vite dev server at '
                '<a href="http://localhost:5173">http://localhost:5173</a>.</p>',
                status=501,
                content_type='text/html',
            )
        return super().get(request, *args, **kwargs)
