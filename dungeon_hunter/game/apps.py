from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class GameConfig(AppConfig):
    name = "dungeon_hunter.game"
    verbose_name = _("Game")
