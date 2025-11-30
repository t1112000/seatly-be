import * as bcrypt from 'bcrypt';
import { generate } from 'generate-password';

export const SALT_ROUNDS = 10;

export function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function hashingPassword(password: string): Promise<string> {
  const salt: string = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword: string = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export function generatePassword(): string {
  return generate({
    length: 15,
    numbers: true,
  });
}
