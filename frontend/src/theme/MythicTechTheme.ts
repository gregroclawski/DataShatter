// Mythic-Tech Idle RPG Theme
// Hybrid Fantasy + Futuristic Aesthetics

export const MythicTechColors = {
  // Primary neon colors
  neonBlue: '#00f5ff',
  neonPurple: '#bf00ff',
  neonCyan: '#00ffff',
  neonPink: '#ff00aa',
  neonGreen: '#00ff88',
  neonOrange: '#ff6600',
  
  // Background colors
  darkSpace: '#0a0a0f',
  deepVoid: '#111118',
  shadowGrid: '#1a1a2e',
  cosmicDark: '#16213e',
  
  // Accent colors
  plasmaGlow: '#ff3366',
  divineGold: '#ffd700',
  voidSilver: '#c0c0c0',
  mysticRed: '#ff1744',
  
  // UI states
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff3366',
  info: '#00f5ff',
  
  // Gradients (CSS format for backgrounds)
  gradients: {
    primary: 'linear-gradient(45deg, #00f5ff, #bf00ff)',
    secondary: 'linear-gradient(135deg, #ff00aa, #00ffff)', 
    combat: 'linear-gradient(180deg, #0a0a0f, #1a1a2e)',
    boss: 'linear-gradient(45deg, #ff3366, #bf00ff)',
  }
};

export const CharacterProgressionNames = {
  1: {
    title: 'Digital Initiate',
    description: 'Connected to the neural grid',
    aura: MythicTechColors.neonBlue
  },
  5000: {
    title: 'Cyber-Mage',
    description: 'Master of techno-mysticism',
    aura: MythicTechColors.neonPurple
  },
  10000: {
    title: 'Tech-Warrior',
    description: 'Fusion of flesh and circuitry',
    aura: MythicTechColors.neonCyan
  },
  15000: {
    title: 'Digital Ascendant',
    description: 'Transcended mortal limitations',
    aura: MythicTechColors.divineGold
  }
};

// Weapon progression theming
export const WeaponProgression = {
  earlyGame: {
    names: ['pebbles', 'kunai', 'bones', 'fire_talismans'],
    theme: MythicTechColors.neonBlue,
    description: 'Ancient tools awakening to power'
  },
  midGame: {
    names: ['elemental_orbs', 'runed_chakrams', 'cursed_cards', 'spirit_discs'],
    theme: MythicTechColors.neonPurple,
    description: 'Mystical weapons infused with energy'
  },
  lateGame: {
    names: ['plasma_discs', 'blackhole_shuriken', 'godly_relics', 'void_fragments'],
    theme: MythicTechColors.divineGold,
    description: 'Weapons that bend reality itself'
  }
};

// Boss element theming (mythic-tech style)
export const BossElementThemes = {
  fire: {
    color: MythicTechColors.plasmaGlow,
    glowColor: '#ff3366aa',
    name: 'Plasma',
    icon: '🔥⚡',
    description: 'Superheated energy matrix'
  },
  ice: {
    color: MythicTechColors.neonCyan,
    glowColor: '#00ffffaa',
    name: 'Cryo',
    icon: '❄️🔮',
    description: 'Absolute zero technology'
  },
  shadow: {
    color: MythicTechColors.neonPurple,
    glowColor: '#bf00ffaa',
    name: 'Void',
    icon: '🌑💫',
    description: 'Dark matter manipulation'
  },
  earth: {
    color: MythicTechColors.neonGreen,
    glowColor: '#00ff88aa',
    name: 'Quantum',
    icon: '⚛️🌍',
    description: 'Atomic restructuring field'
  }
};

// UI Component theming
export const UIThemes = {
  overlay: {
    background: 'rgba(10, 10, 15, 0.95)',
    border: MythicTechColors.neonBlue,
    shadow: '0 0 20px ' + MythicTechColors.neonBlue + '44'
  },
  button: {
    primary: {
      background: MythicTechColors.neonBlue,
      shadow: '0 0 15px ' + MythicTechColors.neonBlue
    },
    secondary: {
      background: MythicTechColors.neonPurple,
      shadow: '0 0 15px ' + MythicTechColors.neonPurple
    }
  },
  text: {
    primary: '#ffffff',
    secondary: MythicTechColors.neonCyan,
    accent: MythicTechColors.neonPink,
    muted: '#888888'
  }
};