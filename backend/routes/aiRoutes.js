import express from 'express'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import { handleAIAgentQuery } from '../controllers/aiAutomationController.js'

const router = express.Router()


router.post('/transcript',protect, authorizeRoles('director'),handleAIAgentQuery)

export default router