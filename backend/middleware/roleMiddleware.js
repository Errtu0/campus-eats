const isStaff = (req, res, next) => {
  // Use Number() to ensure we aren't comparing "1" !== 1
  const userRole = req.user.role;
  
  if (userRole === 'STAFF' || userRole === 'ADMIN') {
    next();
  } else {
    console.log("ROLE DENIED:", userRole);
    return res.status(403).json({ error: "Access denied. Staff only." });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
};

module.exports = { isStaff, isAdmin };