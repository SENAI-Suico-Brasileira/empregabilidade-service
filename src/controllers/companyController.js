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
    const { title, categoryId, lgpdConsent, senaiDisclaimer } = req.body;
    if (!title || !categoryId) {
      const err = new Error("Título e categoria são obrigatórios.");
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

module.exports = {
  getProfile,
  updateProfile,
  listOwnJobs,
  listCompletedTemplates,
  createJob,
  updateJobStatus,
};
