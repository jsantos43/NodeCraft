import Base from './Base.js';

class NotFound extends Base {
  constructor(message = 'Item not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export default NotFound;
