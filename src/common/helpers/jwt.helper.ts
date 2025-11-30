import * as jsonwebtoken from 'jsonwebtoken';
import { StringValue } from 'ms';

export function generateJwtToken(
  tokenPayload: any,
  expiresIn: StringValue | 'never' = '60 days',
) {
  const options: any = {};

  // Only set expiration if not permanent
  if (expiresIn !== 'never') {
    options.expiresIn = expiresIn;
  }

  return jsonwebtoken.sign(
    tokenPayload,
    process.env.JWT_SECRET as string,
    options,
  );
}

export function verifyJwtToken(token: string): [boolean, any] {
  return [
    !!jsonwebtoken.verify(token, process.env.JWT_SECRET as string),
    jsonwebtoken.verify(token, process.env.JWT_SECRET as string),
  ];
}
