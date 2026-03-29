class Base extends Error {
  constructor(message = 'Internal Server Error!', status = 500, code = 'INTERNAL_ERROR', details = [], meta = {}) {
    super(message);
    this.message = message;
    this.status = status;
    this.code = code;
    this.meta = meta;

    if (typeof details === 'string') {
      this.details = [details];
    } else {
      this.details = details;
    }
  }

  send(res) {
    res.status(this.status).send({
      success: false,
      error: this.code,
      message: this.message,
      details: this.details,
    });
  }
}

export default Base;
