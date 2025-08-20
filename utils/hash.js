import bcrypt from 'bcryptjs';

export function hashPassword(plain, saltRounds = 10) {
  return bcrypt.hash(plain, saltRounds);
}
