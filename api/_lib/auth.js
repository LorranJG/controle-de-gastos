function requirePassword(req, res) {
  const configured = process.env.APP_PASSWORD;
  if (!configured) return true;

  const received = req.headers["x-app-password"];
  if (received === configured) return true;

  res.status(401).json({ error: "Senha inválida ou ausente." });
  return false;
}

module.exports = { requirePassword };
