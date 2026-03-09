import Base from './Base.js';

class Unathorized extends Base {
  constructor(details = []) {
    super('Unathorized!', 401, 'UNATHORIZED', details);
  }
}

export default Unathorized;
