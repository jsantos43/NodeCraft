import Base from './Base.js';

class Unathorized extends Base {
  constructor(details = []) {
    super("You aren't authorized!", 401, 'UNATHORIZED', details);
  }
}

export default Unathorized;
