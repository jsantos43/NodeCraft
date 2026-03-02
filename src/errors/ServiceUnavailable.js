import Base from './Base.js';

class ServiceUnavailable extends Base {
  constructor(message = 'Service is unavailable!') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export default ServiceUnavailable;
