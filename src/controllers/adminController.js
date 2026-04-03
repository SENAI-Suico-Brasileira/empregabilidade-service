const adminService = require("../services/adminService");

async function getIndicators(req, res, next) {
  try {
    return res.json(await adminService.getIndicators());
  } catch (err) {
    return next(err);
  }
}

async function listAllJobs(req, res, next) {
  try {
    return res.json(await adminService.listAllJobs({ status: req.query.status }));
  } catch (err) {
    return next(err);
  }
}

async function approveJob(req, res, next) {
  try {
    return res.json(await adminService.approveJob(req.params.id));
  } catch (err) {
    return next(err);
  }
}

async function rejectJob(req, res, next) {
  try {
    const { reason } = req.body;
    return res.json(await adminService.rejectJob(req.params.id, reason));
  } catch (err) {
    return next(err);
  }
}

async function listCompanies(req, res, next) {
  try {
    return res.json(await adminService.listCompanies());
  } catch (err) {
    return next(err);
  }
}

async function getCompany(req, res, next) {
  try {
    return res.json(await adminService.getCompany(req.params.id));
  } catch (err) {
    err.statusCode = 404;
    return next(err);
  }
}

async function createCompany(req, res, next) {
  try {
    const { name, userEmail, userPassword } = req.body;
    if (!name || !userEmail || !userPassword) {
      const err = new Error("Nome, e-mail e senha são obrigatórios.");
      err.statusCode = 400;
      return next(err);
    }
    const result = await adminService.createCompany(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function updateCompany(req, res, next) {
  try {
    return res.json(await adminService.updateCompany(req.params.id, req.body));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getIndicators,
  listAllJobs,
  approveJob,
  rejectJob,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
};
