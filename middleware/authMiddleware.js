module.exports = function (req, res, next) {
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
