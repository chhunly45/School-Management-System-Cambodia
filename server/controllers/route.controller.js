const routeService = require('../services/route.service');

const listRoutes = async (req, res, next) => {
  try {
    const routes = await routeService.listRoutes(req.query);
    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
};

const getRoute = async (req, res, next) => {
  try {
    const route = await routeService.getRouteById(req.params.id);
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.body);
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    await routeService.deleteRoute(req.params.id);
    res.json({ success: true, message: 'Route deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute
};