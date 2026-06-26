import { createCipheriv, createDecipheriv } from 'crypto';

import { Injectable } from '@nestjs/common';

const ALGORITHM = 'aes-256-cbc';

@Injectable()
export class CryptoService {
  private readonly key = Buffer.from(
    process.env.CRYPTO_SECRET_KEY ?? '',
    'utf-8',
  );
  private readonly iv = Buffer.from(process.env.CRYPTO_IV ?? '', 'utf-8');

  encrypt(text: string): string {
    const cipher = createCipheriv(ALGORITHM, this.key, this.iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf-8'),
      cipher.final(),
    ]);

    return encrypted.toString('hex');
  }

  decrypt(hash: string): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, this.iv);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(hash, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }
}
