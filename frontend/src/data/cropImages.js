// Comprehensive high-resolution crop images mapping for all 48 crops

const CROP_IMAGES = {
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
  'maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
  'sorghum': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
  'pearlmillet': 'https://images.unsplash.com/photo-1627920769842-6887c6df05ca?w=600&auto=format&fit=crop&q=80',
  'chickpea': 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=600&auto=format&fit=crop&q=80',
  'kidneybeans': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
  'pigeonpeas': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  'mothbeans': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'mungbean': 'https://images.unsplash.com/photo-1599307767316-77e77478d1f7?w=600&auto=format&fit=crop&q=80',
  'blackgram': 'https://images.unsplash.com/photo-1599307767326-724d14210e7b?w=600&auto=format&fit=crop&q=80',
  'lentil': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&auto=format&fit=crop&q=80',
  'peas': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80',
  'soybean': 'https://images.unsplash.com/photo-1599307767332-9c3f0b2f51f9?w=600&auto=format&fit=crop&q=80',
  'cabbage': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop&q=80',
  'cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-12f0241d99fb?w=600&auto=format&fit=crop&q=80',
  'radish': 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=600&auto=format&fit=crop&q=80',
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=600&auto=format&fit=crop&q=80',
  'garlic': 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  'fenugreek': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
  'pomegranate': 'https://images.unsplash.com/photo-1541344999365-86641e7bf2f6?w=600&auto=format&fit=crop&q=80',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
  'grapes': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&auto=format&fit=crop&q=80',
  'watermelon': 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=600&auto=format&fit=crop&q=80',
  'muskmelon': 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'orange': 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80',
  'papaya': 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=600&auto=format&fit=crop&q=80',
  'coconut': 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&auto=format&fit=crop&q=80',
  'cotton': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80',
  'jute': 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80',
  'coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'sugarcane': 'https://images.unsplash.com/photo-1595085610896-fb31cfd5d4d7?w=600&auto=format&fit=crop&q=80',
  'groundnut': 'https://images.unsplash.com/photo-1567103472667-6898f3a79cf2?w=600&auto=format&fit=crop&q=80',
  'mustard': 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80',
  'sunflower': 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&auto=format&fit=crop&q=80',
  'safflower': 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80',
  'sesame': 'https://images.unsplash.com/photo-1627920769842-6887c6df05ca?w=600&auto=format&fit=crop&q=80',
  'linseed': 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80',
  'castor': 'https://images.unsplash.com/photo-1595085610896-fb31cfd5d4d7?w=600&auto=format&fit=crop&q=80',
  'turmeric': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
};

// Normalize crop string (e.g., "Pearl Millet" or "pearl_millet" -> "pearlmillet")
export const normalizeCropKey = (cropName) => {
  if (!cropName) return '';
  return String(cropName).toLowerCase().replace(/[\s\-_]+/g, '');
};

// Get crop image URL by crop name
export const getCropImage = (cropName) => {
  if (!cropName) return null;
  const key = normalizeCropKey(cropName);
  return CROP_IMAGES[key] || null;
};

export default CROP_IMAGES;
