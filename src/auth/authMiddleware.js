const jwt = require("jsonwebtoken");
require("dotenv").config();

const verificarPermissao = (rolesPermitidas) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Token não fornecido" });

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded;
      if (decoded.funcoes.includes("ADMIN")) {
        return next();
      }
      const temPermissao = rolesPermitidas.some((role) =>
        decoded.funcoes.includes(role)
      );

      if (!temPermissao) {
        return res
          .status(403)
          .json({ error: "Você não tem permissão para esta ação" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }
  };
};

module.exports = verificarPermissao;
