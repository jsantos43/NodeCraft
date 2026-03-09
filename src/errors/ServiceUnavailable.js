import Base from './Base.js';

class ServiceUnavailable extends Base {
  constructor(details = []) {
    super('This service is unavailable!', 503, 'SERVICE_UNAVAILABLE', details);
  }
}

export default ServiceUnavailable;
