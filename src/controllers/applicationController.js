const applicationService = require("../services/applicationService");

/** GET /api/jobs/:id/applicants/check?cpf=XXX */
async function checkCpf(req, res, next) {
  try {
    const result = await applicationService.findApplicantByCpf(req.query.cpf || "", req.params.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

/** POST /api/jobs/:id/apply */
async function apply(req, res, next) {
  try {
    const contact = await applicationService.apply(req.params.id, req.body);
    return res.status(201).json(contact);
  } catch (err) {
    err.statusCode = err.statusCode ?? 400;
    return next(err);
  }
}

/** GET /api/jobs/:id/applicants  (empresa ou admin) */
async function listApplicants(req, res, next) {
  try {
    const applications = await applicationService.listApplicants(req.params.id);
    return res.json(applications);
  } catch (err) {
    return next(err);
  }
}

module.exports = { checkCpf, apply, listApplicants };
