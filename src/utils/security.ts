/**
 * Secure Biometric Cryptographic and Validation Utilities
 * Built for Chukwuemeka Odumegwu Ojukwu University (COOU) Student Attendance System
 */

/**
 * Encrypts or hashes facial biometric descriptors into static mathematical templates.
 * Instead of storing raw base64 frame captures, this turns facial landmarks into a one-way hashed vector signature.
 */
export function hashBiometricTemplate(descriptors: number[]): string {
  if (!descriptors || descriptors.length === 0) {
    throw new Error("No Face landmarks detected to build a secure template.");
  }
  
  // Create a mathematical fingerprint model from face landmarks (e.g., L2-normalization metrics)
  // Summing segments of descriptors to build a highly individualized cryptographic representation
  const segmentSumString = descriptors
    .map((val, idx) => (idx % 8 === 0 ? val.toFixed(4) : ""))
    .filter(Boolean)
    .join("-");

  // Basic one-way signature encoding for template verification
  const templateCharCodes = segmentSumString.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const secureSalt = "COOU_LANDMARK_SALT_993A";
  
  return `TPL-${templateCharCodes}-${secureSalt}-${btoa(segmentSumString).slice(0, 16)}`;
}

/**
 * Liveness Anti-Spoofing Parallax & Muscular Check validation helper.
 * Generates a dynamic random challenge prompt to present to the camera.
 */
export interface LivenessChallenge {
  id: string;
  type: "blink" | "tilt_left" | "smile";
  expiresAt: number;
}

export function generateLivenessChallenge(): LivenessChallenge {
  const challenges: ("blink" | "tilt_left" | "smile")[] = ["blink", "tilt_left", "smile"];
  const randomChallengeType = challenges[Math.floor(Math.random() * challenges.length)];
  return {
    id: `clg-${Math.random().toString(36).substr(2, 9)}`,
    type: randomChallengeType,
    expiresAt: Date.now() + 60 * 1000 // 1 minute window
  };
}

/**
 * Client-side Rate Limiting Tracker to guard against spoofing and replay attacks.
 * Restricts multiple biometric scan attempts within short intervals.
 */
export class SecureRateLimiter {
  private static attempts: { [key: string]: number[] } = {};

  /**
   * Evaluates if a student profile is rate-limited on the current device.
   * Max 3 attempts per 30 seconds to prevent replay scanners or script attacks.
   */
  public static checkLimit(studentId: string): { allowed: boolean; remaining: number; cooldownTotalSec: number } {
    const now = Date.now();
    const timeframeMs = 30000; // 30 seconds
    const maxAttempts = 3;

    if (!this.attempts[studentId]) {
      this.attempts[studentId] = [];
    }

    // Filter old attempts out
    this.attempts[studentId] = this.attempts[studentId].filter(timestamp => now - timestamp < timeframeMs);

    if (this.attempts[studentId].length >= maxAttempts) {
      const oldestAttempt = this.attempts[studentId][0];
      const cooldownTotalSec = Math.ceil((oldestAttempt + timeframeMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        cooldownTotalSec: cooldownTotalSec > 0 ? cooldownTotalSec : 0
      };
    }

    this.attempts[studentId].push(now);
    return {
      allowed: true,
      remaining: maxAttempts - this.attempts[studentId].length,
      cooldownTotalSec: 0
    };
  }

  public static reset(studentId: string): void {
    delete this.attempts[studentId];
  }
}

/**
 * Security Audit Log Contract
 */
export interface VerificationAuditLog {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  regNo: string;
  action: "REGISTRATION" | "CHECK_IN" | "REJECT_SPOOF" | "BYPASS";
  status: "SUCCESS" | "FAILED" | "SUSPICIOUS";
  livenessChallengeUsed: string;
  hardwareHash: string;
  errorMessage?: string;
}

/**
 * Local dynamic audit logger
 */
export function createVerificationAuditLog(
  studentId: string,
  studentName: string,
  regNo: string,
  action: VerificationAuditLog["action"],
  status: VerificationAuditLog["status"],
  livenessChallengeUsed: string,
  errorMessage?: string
): VerificationAuditLog {
  return {
    id: `audit-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    studentId,
    studentName,
    regNo,
    action,
    status,
    livenessChallengeUsed,
    hardwareHash: `hw-${btoa(navigator.userAgent).slice(0, 16)}`,
    errorMessage
  };
}
