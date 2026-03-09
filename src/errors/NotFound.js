import Base from './Base.js';

class NotFound extends Base {
  constructor(details = '') {
    super('Item not found', 404, 'NOT_FOUND', details);
  }
}

export default NotFound;
