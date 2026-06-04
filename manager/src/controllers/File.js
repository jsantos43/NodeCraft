class File {
  static async read(req, res, next) {
    try {
      return res.status(200).json({ sucess: true });
    } catch (err) {
      return next(err);
    }
  }
}

export default File;
