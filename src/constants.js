// constants.js
export const BET_AMOUNT = 100;

export const BASE_POSITIONS = { red: [16, 19, 61, 64], green: [25, 28, 70, 73], blue: [151, 154, 196, 199], yellow: [160, 163, 205, 208] };
export const TURN_ORDER = ['red', 'green', 'yellow', 'blue'];
export const SAFE_SPOTS = [36, 102, 122, 188, 91, 23, 133, 201];
export const MASTER_PATH = [ 91, 92, 93, 94, 95, 81, 66, 51, 36, 21, 6, 7, 8, 23, 38, 53, 68, 83, 99, 100, 101, 102, 103, 104, 119, 134, 133, 132, 131, 130, 129, 143, 158, 173, 188, 203, 218, 217, 216, 201, 186, 171, 156, 141, 125, 124, 123, 122, 121, 120, 105, 90 ];

export const PATHS = {
  red: [...MASTER_PATH.slice(0, 51), 106, 107, 108, 109, 110, 999],
  green: [...MASTER_PATH.slice(13, 52), ...MASTER_PATH.slice(0, 12), 22, 37, 52, 67, 82, 999],
  yellow: [...MASTER_PATH.slice(26, 52), ...MASTER_PATH.slice(0, 25), 118, 117, 116, 115, 114, 999],
  blue: [...MASTER_PATH.slice(39, 52), ...MASTER_PATH.slice(0, 38), 202, 187, 172, 157, 142, 999]
};

export const VOICE_PRESETS = [
  { id: 'ab-dekhna-m', label: 'Ab Dekhna', gender: 'm' }, { id: 'agli-baar-kismat-sath-degi-m', label: 'Agli Baar Kismat', gender: 'm' }, { id: 'amazing-m', label: 'Amazing', gender: 'm' }, { id: 'arey-baap-re-f', label: 'Arey Baap Re', gender: 'f' }, { id: 'arey-nahi-m', label: 'Arey Nahi', gender: 'm' }, { id: 'arey-wah-aaj-toh-f', label: 'Arey Wah Aaj Toh', gender: 'f' }, { id: 'arey-yr-meri-f', label: 'Arey Yaar Meri', gender: 'f' }, { id: 'aur-batao-f', label: 'Aur Batao', gender: 'f' }, { id: 'bach-gaye-m', label: 'Bach Gaye', gender: 'm' }, { id: 'badhiya-chal-m', label: 'Badhiya Chal', gender: 'm' }, { id: 'better-luck-next-time-m', label: 'Better Luck Next Time', gender: 'm' }, { id: 'bohot-badhiya-khela-m', label: 'Bohot Badhiya Khela', gender: 'm' }, { id: 'Good-Luck-m', label: 'Good Luck', gender: 'm' }, { id: 'haha-ye-chaal-toh-f', label: 'Haha Ye Chaal', gender: 'f' }, { id: 'himmat-hai-toh-hara-f', label: 'Himmat Hai Toh Hara', gender: 'f' }, { id: 'hurry-up-m', label: 'Hurry Up', gender: 'm' }, { id: 'jaldi-karo-m', label: 'Jaldi Karo', gender: 'm' }, { id: 'koi-baat-nhi-f', label: 'Koi Baat Nahi', gender: 'f' }, { id: 'koi-baat-nhi-m', label: 'Koi Baat Nahi', gender: 'm' }, { id: 'lets-play-again-m', label: 'Lets Play Again', gender: 'm' }, { id: 'mujhe-harana-itna-f', label: 'Mujhe Harana Itna', gender: 'f' }, { id: 'Nice-move-m', label: 'Nice Move', gender: 'm' }, { id: 'ohho-m', label: 'Ohho', gender: 'm' }, { id: 'oops-m', label: 'Oops', gender: 'm' }, { id: 'pakad-liya-m', label: 'Pakad Liya', gender: 'm' }, { id: 'sambhal-ke-f', label: 'Sambhal Ke', gender: 'f' }, { id: 'soch-lo-f', label: 'Soch Lo', gender: 'f' }, { id: 'subhkamnaye-m', label: 'Subhkamnaye', gender: 'm' }, { id: 'thank-you-m', label: 'Thank You', gender: 'm' }, { id: 'well-played-m', label: 'Well Played', gender: 'm' }, { id: 'yeh-toh-sarasar-f', label: 'Yeh Toh Sarasar', gender: 'f' }, { id: 'your-turn-m', label: 'Your Turn', gender: 'm' }
];

export const EMOJIS = ['😂', '😎', '😡', '😭', '👍', '👎', '🎲', '🔥', '🎉', '😱', '🤫', '🤦‍♂️', '😈', '💀', '✌️', '💪'];

export const COUNTRIES = [ { flag: '🌍', name: 'Global' }, { flag: '🇮🇳', name: 'India' }, { flag: '🇺🇸', name: 'USA' }, { flag: '🇬🇧', name: 'UK' }, { flag: '🇨🇦', name: 'Canada' }, { flag: '🇦🇺', name: 'Australia' }, { flag: '🇵🇰', name: 'Pakistan' }, { flag: '🇧🇩', name: 'Bangladesh' } ];

export const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cleo'
];

export const normalizeTokens = (firebaseTokens) => {
  const norm = {};
  if (!firebaseTokens) return norm;
  Object.keys(firebaseTokens).forEach(color => {
    if (Array.isArray(firebaseTokens[color])) norm[color] = [...firebaseTokens[color]].map(Number);
    else if (typeof firebaseTokens[color] === 'object') norm[color] = Object.values(firebaseTokens[color]).map(Number);
    else norm[color] = [];
  });
  return norm;
};
