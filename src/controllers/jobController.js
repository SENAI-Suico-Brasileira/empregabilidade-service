const jobService = require("../services/jobService");

async function listPublicJobs(req, res, next) {
  try {
    return res.json(await jobService.listPublicJobs({ categoryId: req.query.categoryId }));
  } catch (err) {
    return next(err);
  }
}

async function getPublicJob(req, res, next) {
  try {
    return res.json(await jobService.getPublicJob(req.params.id));
  } catch (err) {
    err.statusCode = 404;
    return next(err);
  }
}

module.exports = { listPublicJobs, getPublicJob };
