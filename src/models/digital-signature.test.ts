import { describe, expect, it } from 'vitest';
import {
  SIGN_GROUP,
  SIGN_MESSAGE,
  SIGN_PRIVATE,
  signaturePow,
  signaturePublic,
  signatureRecoverReusedNonce,
  signatureSign,
  signatureVerify,
} from './digital-signature';
describe('tiny Schnorr teaching signatures', () => {
  it('uses a prime-order subgroup and matches independent BigInt modular exponentiation', () => {
    expect(signaturePow(4, 509)).toBe(1);
    expect(new Set(Array.from({ length: 509 }, (_, i) => signaturePow(4, i))).size).toBe(509);
    for (let n = 0; n < 509; n += 7)
      expect(signaturePow(4, n)).toBe(Number(4n ** BigInt(n) % 1019n));
    expect(SIGN_GROUP.q).toBe(509);
  });
  it('verifies eighty independently varied key/nonce/message cases and rejects wrong inputs', () => {
    for (let i = 1; i <= 80; i++) {
      const secret = 1 + ((i * 31) % 508),
        nonce = 1 + ((i * 17) % 508),
        message = `note-${i}-签名`,
        signed = signatureSign(message, secret, nonce);
      const check = signatureVerify(message, signed.signature, signed.publicKey);
      expect(check.valid).toBe(true);
      expect(check.left).toBe(Number(4n ** BigInt(signed.signature.s) % 1019n));
      expect(check.right).toBe(
        Number(
          (BigInt(signed.signature.R) * BigInt(signed.publicKey) ** BigInt(signed.challenge)) %
            1019n,
        ),
      );
    }
    const s = signatureSign(SIGN_MESSAGE);
    expect(signatureVerify(SIGN_MESSAGE + '!', s.signature, s.publicKey).valid).toBe(false);
    expect(signatureVerify(SIGN_MESSAGE, s.signature, signaturePublic(99)).valid).toBe(false);
    expect(signatureVerify(SIGN_MESSAGE, { R: 1, s: 0 }, s.publicKey).valid).toBe(false);
    expect(signatureVerify(SIGN_MESSAGE, { R: s.signature.R, s: NaN }, s.publicKey).valid).toBe(
      false,
    );
  });
  it('recovers the actual private scalar from two valid signatures that reuse a nonce', () => {
    const a = signatureSign('HELLO'),
      b = signatureSign('WORLD');
    expect(a.signature.R).toBe(b.signature.R);
    const recovered = signatureRecoverReusedNonce(
      { message: 'HELLO', signature: a.signature },
      { message: 'WORLD', signature: b.signature },
      a.publicKey,
    );
    expect(recovered).toBe(SIGN_PRIVATE);
    expect(signaturePublic(recovered)).toBe(a.publicKey);
    expect(() =>
      signatureRecoverReusedNonce(
        { message: 'HELLO', signature: a.signature },
        { message: 'HELLO', signature: a.signature },
        a.publicKey,
      ),
    ).toThrow(/invertible/);
  });
  it('rejects invalid key, nonce, byte limit and malformed Unicode rather than inventing a signature', () => {
    expect(() => signatureSign('x', 0, 1)).toThrow();
    expect(() => signatureSign('x', 1, 0)).toThrow();
    expect(() => signatureSign('x'.repeat(97))).toThrow();
    expect(() => signatureSign('\ud800')).toThrow();
    expect(() => signaturePow(4, -1)).toThrow();
  });
});
