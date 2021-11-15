export const register = (req, res) => {
  console.log(req.body);
  res.send("register api hit from controller");
};
