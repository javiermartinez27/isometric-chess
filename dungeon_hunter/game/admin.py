from django.contrib import admin
from .models import Weapon, Spell, Character, Dungeon

@admin.register(Weapon)
class WeaponAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_damage', 'sprite_path')
    search_fields = ('name',)

@admin.register(Spell)
class SpellAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_damage', 'cooldown', 'shape_type')
    list_filter = ('shape_type',)
    search_fields = ('name',)

@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'current_health', 'max_health', 'weapon')
    list_filter = ('user',)
    search_fields = ('name', 'user__username')
    filter_horizontal = ('unlocked_spells',)

@admin.register(Dungeon)
class DungeonAdmin(admin.ModelAdmin):
    list_display = ('seed', 'created_at')
    search_fields = ('seed',)
    readonly_fields = ('created_at',)
