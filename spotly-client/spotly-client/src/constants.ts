// src/constants.ts

// Görseldeki kırmızı hattı takip eden detaylı dış sınır
export const BOUNDARY_POLYGON = [
    [28.9950, 41.0390], [28.9910, 41.0410], [28.9860, 41.0395], [28.9810, 41.0370], 
    [28.9750, 41.0330], [28.9700, 41.0290], [28.9645, 41.0265], [28.9600, 41.0235], 
    [28.9550, 41.0180], [28.9500, 41.0130], [28.9460, 41.0080], [28.9480, 41.0030], 
    [28.9550, 41.0005], [28.9650, 40.9990], [28.9750, 41.0000], [28.9850, 41.0050], 
    [28.9880, 41.0110], [28.9870, 41.0140], [28.9840, 41.0230], [28.9860, 41.0280], 
    [28.9910, 41.0340], [28.9950, 41.0390]
  ];
  
// Haliç ve Boğaz içindeki deniz alanı sınırları
export const SEA_POLYGON = [
    [28.9600, 41.0235], [28.9645, 41.0265], [28.9680, 41.0240], [28.9730, 41.0230], 
    [28.9770, 41.0225], [28.9810, 41.0245], [28.9840, 41.0230], [28.9870, 41.0140], 
    [28.9800, 41.0155], [28.975, 41.0165], [28.9710, 41.0180], [28.9660, 41.0205], 
    [28.9600, 41.0235]
  ];

// Uygulama Renk Paleti (Adaçayı Teması)
export const THEME_COLORS = {
    sagePrimary: '#7EA182',   // Adaçayı Yeşili
    sageDark: '#5F7E64',      // Koyu Adaçayı
    sageLight: '#E8EFE9',     // Açık Adaçayı
    sageBg: '#F5F7F5',        // Arka Plan
    coralSoft: '#E09891',     // Mercan (Aksiyon butonları)
    white: '#FFFFFF',
    border: '#E2E8F0',
    textDark: '#2D3748',
    textMuted: '#718096'
  };

  // src/constants.ts (Dosyanın en alt kısmına ekle)

export const API_BASE_URL = 'http://localhost:5094/api';