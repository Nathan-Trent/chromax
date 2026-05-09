export interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
  error?: string;
}

type GoogleSiteVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export const RECAPTCHA_USER_ERROR =
  "We detected unusual activity. Please refresh the page and try again.";

/**
 * Verifies a reCAPTCHA v3 token with Google.
 * @param minScore Minimum acceptable score (default 0.5). Admin flows may use 0.7.
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  minScore = 0.5,
): Promise<RecaptchaResult> {
  if (!token || token.trim() === "") {
    return { success: false, score: 0, action: "" };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim() ?? "";
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, score: 0, action: "" };
    }
    console.warn(
      "[recaptcha] RECAPTCHA_SECRET_KEY is not set; verification bypassed (development only)",
    );
    return { success: true, score: 1, action: "" };
  }

  let response: GoogleSiteVerifyResponse;
  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      return {
        success: false,
        score: 0,
        action: "",
        error: "Verification service unavailable",
      };
    }
    response = (await res.json()) as GoogleSiteVerifyResponse;
  } catch {
    return {
      success: false,
      score: 0,
      action: "",
      error: "Verification service unavailable",
    };
  }

  if (!response.success) {
    return {
      success: false,
      score: 0,
      action: "",
      error: "Invalid token",
    };
  }

  const score = response.score ?? 0;
  const action = response.action ?? "";

  if (score < minScore) {
    return {
      success: false,
      score,
      action,
      error: "Bot detected",
    };
  }

  if (expectedAction !== undefined && expectedAction !== "" && action !== expectedAction) {
    return {
      success: false,
      score,
      action,
      error: "Action mismatch",
    };
  }

  return { success: true, score, action };
}
