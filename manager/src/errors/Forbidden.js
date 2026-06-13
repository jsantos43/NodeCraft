import Base from './Base.js';

class Forbidden extends Base {
  constructor(details = []) {
    super("You don't have necessary permission!", 403, 'FORBIDDEN', details);
  }
}

export default Forbidden;
