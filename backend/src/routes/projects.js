/**
 * Project Routes
 * E3'1'* %/'1) 'DE4'1J9 H QR Codes
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const projectController = require('../controllers/projectController');
const { auth, admin, producer } = require('../middleware/auth');

/**
 * 1. %F4'! E41H9 ,/J/
 * POST /api/v1/projects
 * J*7D( 5D'-J'* ADMIN #H PRODUCER
 */
router.post('/', [
  auth,
  admin,
  body('name').notEmpty().withMessage(''3E 'DE41H9 E7DH('),
  body('startDate').isISO8601().withMessage('*'1J. 'D(/! J,( #F JCHF 5-J-'K'),
  body('location').optional().isString(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('endDate').optional().isISO8601(),
  body('orderWindow').optional().isInt({ min: 1, max: 480 }).withMessage('F'A0) 'D7D( J,( #F *CHF (JF 1 H 480 /BJB)')
], projectController.createProject);

/**
 * 2. 'D-5HD 9DI ,EJ9 'DE4'1J9
 * GET /api/v1/projects?page=1&limit=10&isActive=true
 */
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean()
], projectController.getAllProjects);

/**
 * 3. 'DH5HD DDE41H9 9(1 QR Code
 * POST /api/v1/projects/access-by-qr
 * E*'- DD,EJ9 (/HF E5'/B)
 */
router.post('/access-by-qr', [
  body('qrToken').notEmpty().withMessage('QR Token E7DH(')
], projectController.accessProjectByQR);

/**
 * 4. 'D-5HD 9DI E41H9 E-//
 * GET /api/v1/projects/:projectId
 */
router.get('/:projectId', [
  auth,
  param('projectId').isUUID().withMessage('E91A 'DE41H9 :J1 5-J-')
], projectController.getProject);

/**
 * 5. *-/J+ E9DHE'* 'DE41H9
 * PATCH /api/v1/projects/:projectId
 * J*7D( 5D'-J'* ADMIN #H PRODUCER
 */
router.patch('/:projectId', [
  auth,
  producer,
  param('projectId').isUUID().withMessage('E91A 'DE41H9 :J1 5-J-'),
  body('name').optional().isString(),
  body('location').optional().isString(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
  body('endDate').optional().isISO8601(),
  body('orderWindow').optional().isInt({ min: 1, max: 480 }),
  body('isActive').optional().isBoolean()
], projectController.updateProject);

/**
 * 6. %9'/) *HDJ/ QR Code DDE41H9
 * POST /api/v1/projects/:projectId/regenerate-qr
 * J*7D( 5D'-J'* ADMIN #H PRODUCER
 */
router.post('/:projectId/regenerate-qr', [
  auth,
  producer,
  param('projectId').isUUID().withMessage('E91A 'DE41H9 :J1 5-J-')
], projectController.regenerateQRCode);

/**
 * 7. 'D*-BB EF -'D) F'A0) 'D7D(
 * GET /api/v1/projects/:projectId/order-window
 */
router.get('/:projectId/order-window', [
  auth,
  param('projectId').isUUID().withMessage('E91A 'DE41H9 :J1 5-J-')
], projectController.checkOrderWindow);

/**
 * 8. -0A E41H9 (%D:'! *A9JD)
 * DELETE /api/v1/projects/:projectId
 * J*7D( 5D'-J'* ADMIN AB7
 */
router.delete('/:projectId', [
  auth,
  admin,
  param('projectId').isUUID().withMessage('E91A 'DE41H9 :J1 5-J-')
], projectController.deleteProject);

module.exports = router;

/**
 * Routes Summary:
 *
 * Project Management:
 * - POST /projects - %F4'! E41H9 ,/J/ E9 QR Code
 * - GET /projects - ,D( ,EJ9 'DE4'1J9
 * - GET /projects/:projectId - ,D( E41H9 E-//
 * - PATCH /projects/:projectId - *-/J+ E9DHE'* 'DE41H9
 * - DELETE /projects/:projectId - -0A E41H9 (%D:'! *A9JD)
 *
 * QR Code Management:
 * - POST /projects/access-by-qr - 'DH5HD DDE41H9 9(1 QR Code
 * - POST /projects/:projectId/regenerate-qr - %9'/) *HDJ/ QR Code
 *
 * Order Window:
 * - GET /projects/:projectId/order-window - 'D*-BB EF -'D) F'A0) 'D7D(
 */
