import Base from './Base.js';

class ServiceUnavailable extends Base {
  constructor(details = []) {
    super('Service is unavailable!', 503, 'SERVICE_UNAVAILABLE', details);
  }
}

export default ServiceUnavailable;
