import { argon2id, hash, needsRehash, verify, HashOptions } from "argon2";
import bcrypt from "bcryptjs"

const ARGON2_OPTIONS = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} satisfies HashOptions;

const BCRYPT_PREFIX = /^\$2[aby]\$/;

export interface PasswordCheck {
  valid: boolean;
  needsRehash: boolean;
}

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(storedHash: string, plain: string): Promise<PasswordCheck> {
  if (BCRYPT_PREFIX.test(storedHash)) {
    const valid = await bcrypt.compare(plain, storedHash);
    return { valid, needsRehash: valid };
  }
  try {
    const valid = await verify(storedHash, plain);
    return {
      valid,
      needsRehash:
        valid &&
        needsRehash(storedHash, {
          timeCost: ARGON2_OPTIONS.timeCost,
          memoryCost: ARGON2_OPTIONS.memoryCost,
          parallelism: ARGON2_OPTIONS.parallelism,
        }),
    };
  } catch {
    return {
      valid: false, needsRehash: false
    }
  }
}

let dummyHashPromise: Promise<string> | undefined;

export async function burnPasswordChekc(plain: string): Promise<void> {
  dummyHashPromise ??= hashPassword("timing-equalisation-placeholder");
  await verify(await dummyHashPromise, plain).catch(() => false);
}