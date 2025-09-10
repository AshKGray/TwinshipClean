import { create } from "zustand";

// zodiac helper
export function getZodiacSign(month: number, day: number): string {
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries";
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Taurus";
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gemini";
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cancer";
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo";
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo";
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Scorpio";
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagittarius";
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Capricorn";
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquarius";
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Pisces";
  return "Unknown";
}

interface TwinProfile {
  name: string;
  birthday: Date;
  zodiacSign: string;
}

interface TwinState {
  userProfile?: TwinProfile;
  setUserProfile: (profile: { name: string; birthday: Date }) => void;
  clearProfile: () => void;
}

export const useTwinStore = create<TwinState>((set) => ({
  userProfile: undefined,

  setUserProfile: (profile) => {
    const month = profile.birthday.getMonth() + 1; // JS months are 0-based
    const day = profile.birthday.getDate();
    const zodiacSign = getZodiacSign(month, day);

    set({
      userProfile: {
        ...profile,
        zodiacSign,
      },
    });
  },

  clearProfile: () => set({ userProfile: undefined }),
}));