import { FirebaseError } from "firebase/app";

export function getFirebaseAuthErrorMessage(
  err: unknown,
  fallback = "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "ইমেইল ঠিক নয়। সঠিক ইমেইল দিন।";
      case "auth/missing-email":
        return "ইমেইল লিখুন।";
      case "auth/user-not-found":
        // Same message as success — do not reveal whether email exists
        return "";
      case "auth/too-many-requests":
        return "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
      case "auth/network-request-failed":
        return "ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।";
      case "auth/invalid-continue-uri":
      case "auth/unauthorized-continue-uri":
        return "রিসেট লিংক কনফিগারেশন ভুল। Firebase Authorized domains চেক করুন।";
      default:
        console.error("[firebase-auth]", err.code, err.message);
        return fallback;
    }
  }

  console.error("[firebase-auth]", err);
  return fallback;
}
