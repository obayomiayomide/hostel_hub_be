const asyncHandler = require('express-async-handler');
const sendResponse = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

// @route   GET /api/v1/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getAdminStats();
  sendResponse(res, 200, 'Admin dashboard stats fetched successfully', stats);
});

// @route   GET /api/v1/dashboard/occupancy
// @access  Private/Admin
const getOccupancy = asyncHandler(async (req, res) => {
  const occupancy = await dashboardService.getHostelOccupancy();
  sendResponse(res, 200, 'Hostel occupancy fetched successfully', occupancy);
});

// @route   GET /api/v1/dashboard/student
// @access  Private/Student
const getStudentDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStudentStats(req.user.id);
  sendResponse(res, 200, 'Student dashboard stats fetched successfully', stats);
});

module.exports = { getAdminDashboard, getOccupancy, getStudentDashboard };
