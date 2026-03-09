import Base from './Base.js';

class InvalidRequest extends Base {
  constructor(details = []) {
    super('Invalid Request', 400, 'INVALID_REQUEST', details, null);
  }
}

export default InvalidRequest;
