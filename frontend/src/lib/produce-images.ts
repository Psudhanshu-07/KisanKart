/**
 * Maps crop/produce names to curated, royalty-free Unsplash images.
 * Falls back to a generic fresh produce image for unknown crops.
 *
 * All images use Unsplash Source CDN with size parameters for fast loading.
 * Using specific photo IDs for consistent, high-quality results.
 */

const PRODUCE_IMAGES: Record<string, { url: string; gradient: string }> = {
  onion: {
    url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&h=400&fit=crop&q=80",
    gradient: "from-amber-900/60 via-amber-800/30 to-transparent",
  },
  tomato: {
    url: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=600&h=400&fit=crop&q=80",
    gradient: "from-red-900/60 via-red-800/30 to-transparent",
  },
  potato: {
    url: "https://images.unsplash.com/photo-1518977676601-b53f82ber633?w=600&h=400&fit=crop&q=80",
    gradient: "from-yellow-900/60 via-yellow-800/30 to-transparent",
  },
  wheat: {
    url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop&q=80",
    gradient: "from-amber-900/60 via-amber-800/30 to-transparent",
  },
  rice: {
    url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=400&fit=crop&q=80",
    gradient: "from-lime-900/60 via-lime-800/30 to-transparent",
  },
  cabbage: {
    url: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-800/30 to-transparent",
  },
  carrot: {
    url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=400&fit=crop&q=80",
    gradient: "from-orange-900/60 via-orange-800/30 to-transparent",
  },
  cauliflower: {
    url: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&h=400&fit=crop&q=80",
    gradient: "from-slate-700/60 via-slate-600/30 to-transparent",
  },
  brinjal: {
    url: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=600&h=400&fit=crop&q=80",
    gradient: "from-purple-900/60 via-purple-800/30 to-transparent",
  },
  eggplant: {
    url: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=600&h=400&fit=crop&q=80",
    gradient: "from-purple-900/60 via-purple-800/30 to-transparent",
  },
  spinach: {
    url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-800/30 to-transparent",
  },
  mango: {
    url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&h=400&fit=crop&q=80",
    gradient: "from-yellow-900/60 via-yellow-700/30 to-transparent",
  },
  banana: {
    url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&h=400&fit=crop&q=80",
    gradient: "from-yellow-900/60 via-yellow-800/30 to-transparent",
  },
  apple: {
    url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=400&fit=crop&q=80",
    gradient: "from-red-900/60 via-red-800/30 to-transparent",
  },
  grape: {
    url: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&h=400&fit=crop&q=80",
    gradient: "from-purple-900/60 via-purple-800/30 to-transparent",
  },
  capsicum: {
    url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-700/30 to-transparent",
  },
  pepper: {
    url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&h=400&fit=crop&q=80",
    gradient: "from-red-900/60 via-red-700/30 to-transparent",
  },
  cucumber: {
    url: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-800/30 to-transparent",
  },
  corn: {
    url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&h=400&fit=crop&q=80",
    gradient: "from-yellow-900/60 via-yellow-800/30 to-transparent",
  },
  garlic: {
    url: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2571?w=600&h=400&fit=crop&q=80",
    gradient: "from-slate-700/60 via-slate-600/30 to-transparent",
  },
  ginger: {
    url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&h=400&fit=crop&q=80",
    gradient: "from-amber-900/60 via-amber-700/30 to-transparent",
  },
  lemon: {
    url: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&h=400&fit=crop&q=80",
    gradient: "from-yellow-800/60 via-yellow-600/30 to-transparent",
  },
  pomegranate: {
    url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=400&fit=crop&q=80",
    gradient: "from-red-900/60 via-red-800/30 to-transparent",
  },
  peas: {
    url: "https://images.unsplash.com/photo-1587735243615-c067550202c7?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-800/30 to-transparent",
  },
  sugarcane: {
    url: "https://images.unsplash.com/photo-1597916829826-02e5bb4a54a0?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-700/30 to-transparent",
  },
  chilli: {
    url: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&h=400&fit=crop&q=80",
    gradient: "from-red-900/60 via-red-700/30 to-transparent",
  },
  okra: {
    url: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-800/30 to-transparent",
  },
  ladyfinger: {
    url: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&h=400&fit=crop&q=80",
    gradient: "from-green-900/60 via-green-800/30 to-transparent",
  },
};

const DEFAULT_IMAGE = {
  url: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop&q=80",
  gradient: "from-emerald-900/60 via-emerald-800/30 to-transparent",
};

/**
 * Returns the image URL and gradient overlay color for a given crop name.
 * Performs fuzzy matching — if the crop name contains a known keyword, it matches.
 */
export function getProduceImage(cropName: string): { url: string; gradient: string } {
  if (!cropName) return DEFAULT_IMAGE;

  const lower = cropName.toLowerCase().trim();

  // Exact match first
  if (PRODUCE_IMAGES[lower]) {
    return PRODUCE_IMAGES[lower];
  }

  // Fuzzy: check if the crop name *contains* any known keyword
  for (const [keyword, imageData] of Object.entries(PRODUCE_IMAGES)) {
    if (lower.includes(keyword) || keyword.includes(lower)) {
      return imageData;
    }
  }

  return DEFAULT_IMAGE;
}

