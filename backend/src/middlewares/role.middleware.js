export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    console.log(allowedRoles);
    next();
  };
}