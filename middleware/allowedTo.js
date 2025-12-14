module.exports = (...roles) => {
  console.log("roles", roles);

  return (req, res, next) => {
    if (!roles.includes(req.decoded.role)) {
      return res.status(401).json({ msg: "is unathorized token" });
    }
    next();
  };
};
