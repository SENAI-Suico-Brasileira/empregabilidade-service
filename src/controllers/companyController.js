const companyService = require("../services/companyService");

async function getProfile(req, res, next) {
  try {
    return res.json(await companyService.getProfile(req.user.id));
  } catch (err) {
    err.statusCode = 404;
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    return res.json(await companyService.updateProfile(req.user.id, req.body));
  } catch (err) {
    return next(err);
  }
}

async function listOwnJobs(req, res, next) {
  try {
    return res.json(await companyService.listOwnJobs(req.user.id));
  } catch (err) {
    return next(err);
  }
}

async function listCompletedTemplates(req, res, next) {
  try {
    return res.json(await companyService.listCompletedTemplates(req.user.id));
  } catch (err) {
    return next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const { title, categoryId, lgpdConsent, senaiDisclaimer, contactEmail, contactPhone, contactLink } = req.body;
    if (!title || !categoryId) {
      const err = new Error("Título e categoria são obrigatórios.");
      err.statusCode = 400;
      return next(err);
    }
    if (!contactEmail?.trim() && !contactPhone?.trim() && !contactLink?.trim()) {
      const err = new Error("Informe ao menos uma forma de contato (e-mail, telefone ou link de inscrição).");
      err.statusCode = 400;
      return next(err);
    }
    if (!lgpdConsent || !senaiDisclaimer) {
      const err = new Error("Os termos de consentimento devem ser aceitos.");
      err.statusCode = 400;
      return next(err);
    }
    const job = await companyService.createJob(req.user.id, req.body);
    return res.status(201).json(job);
  } catch (err) {
    return next(err);
  }
}

async function updateJobStatus(req, res, next) {
  try {
    const { status, filledBy, filledStudentName, pauseReason } = req.body;
    if (!status) {
      const err = new Error("Status é obrigatório.");
      err.statusCode = 400;
      return next(err);
    }
    const job = await companyService.updateJobStatus(req.params.id, req.user.id, {
      status,
      filledBy,
      filledStudentName,
      pauseReason,
    });
    return res.json(job);
  } catch (err) {
    err.statusCode = err.statusCode ?? 400;
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      const err = new Error("Senha atual e nova senha são obrigatórias.");
      err.statusCode = 400;
      return next(err);
    }
    if (newPassword.length < 6) {
      const err = new Error("A nova senha deve ter ao menos 6 caracteres.");
      err.statusCode = 400;
      return next(err);
    }
    await companyService.changePassword(req.user.id, currentPassword, newPassword);
    return res.json({ message: "Senha alterada com sucesso." });
  } catch (err) {
    err.statusCode = err.statusCode ?? 400;
    return next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listOwnJobs,
  listCompletedTemplates,
  createJob,
  updateJobStatus,
  changePassword,
};
