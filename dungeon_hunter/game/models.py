from django.db import models
from django.conf import settings

class Weapon(models.Model):
    name = models.CharField(max_length=100)
    base_damage = models.IntegerField(default=1)
    sprite_path = models.CharField(max_length=255, help_text="Path to the sprite image, e.g., 'art/weapons/sword.png'")
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Spell(models.Model):
    SHAPE_CHOICES = [
        ('single', 'Single Tile'),
        ('ranged_single', 'Ranged Single Tile'),
        ('line', 'Line'),
        ('aoe', 'Area of Effect'),
        ('cross', 'Cross'),
    ]

    name = models.CharField(max_length=100)
    base_damage = models.IntegerField(default=1)
    cooldown = models.IntegerField(default=0, help_text="Cooldown in turns")
    shape_type = models.CharField(max_length=20, choices=SHAPE_CHOICES, default='single')
    range = models.IntegerField(default=0, help_text="Range for ranged spells")
    radius = models.IntegerField(default=0, help_text="Radius for AoE spells")
    visual_config = models.JSONField(default=dict, help_text="JSON configuration for visual effects (type, style, etc.)")
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Character(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=100)
    current_health = models.IntegerField(default=10)
    max_health = models.IntegerField(default=10)
    base_damage = models.IntegerField(default=1)
    base_movement = models.IntegerField(default=5)
    
    weapon = models.ForeignKey(Weapon, on_delete=models.SET_NULL, null=True, blank=True, related_name='characters')
    unlocked_spells = models.ManyToManyField(Spell, blank=True, related_name='characters')
    
    sprite_path_idle = models.CharField(max_length=255, default='art/player/Idle.png')
    sprite_path_attack = models.CharField(max_length=255, default='art/player/Attack1.png')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.user.email})"

class Dungeon(models.Model):
    seed = models.CharField(max_length=100, unique=True)
    data = models.JSONField(help_text="Matrix and generation data")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dungeon {self.seed}"
