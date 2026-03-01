import Base from './Base.js';

class Forbidden extends Base {
  constructor(message = "You don't have necessary permission!") {
    super(message, 403, 'FORBIDDEN');
  }
}

export default Forbidden;
