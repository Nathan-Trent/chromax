"use client";

import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = async (action: string): Promise<string | null> => {
    if (!executeRecaptcha) return null;
    try {
      return await executeRecaptcha(action);
    } catch {
      return null;
    }
  };

  return { getToken };
}
