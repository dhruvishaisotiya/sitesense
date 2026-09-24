import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AiEngineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_engine'

    def ready(self):
        # Load AI models once when Django starts up
        from ai_engine.services import AiPredictionService
        try:
            loaded = AiPredictionService.load_models()
            if loaded:
                logger.info('AI engine ready: trained ML models loaded into memory.')
            else:
                logger.warning(
                    'AI engine started without trained ML models; '
                    'predictions will use the velocity fallback.'
                )
        except Exception as e:
            logger.warning('Could not load ML models on startup: %s', e)
