import Base from './Base.js';

class Conflict extends Base {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

export default Conflict;
