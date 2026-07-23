import crypto from 'crypto';

// Stateless token helpers shared by the Auth and Worker services. Kept in a
// leaf module (no service imports) so neither service has to import the other
// just for crypto — which is what created the Auth ↔ Worker dependency cycle.

// SHA-256 hex digest — used to store tokens/secrets hashed at rest.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Cryptographically-random opaque token (refresh tokens, worker api keys, etc.).
const generateRandomToken = () => crypto.randomBytes(64).toString('hex');

export { hashToken, generateRandomToken };
