import Base from './Base.js';

class Internal extends Base {
  constructor(details = []) {
    super('Internal Server Error!', 500, 'INTERNAL_ERROR', details);
  }
}

export default Internal;
