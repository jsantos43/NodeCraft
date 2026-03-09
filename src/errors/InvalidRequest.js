import Base from './Base.js';

class InvalidRequest extends Base {
  constructor(details = []) {
    super('You sent an invalid request!', 400, 'INVALID_REQUEST', details, null);
  }
}

export default InvalidRequest;
