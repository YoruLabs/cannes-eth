const challengeService = require('../services/challengeService');
const logger = require('../config/logger');

/**
 * Challenge routes
 * @param {Object} fastify - Fastify instance
 */
async function challengeRoutes(fastify) {
  // Create a new challenge
  fastify.post('/create', async (request, reply) => {
    try {
      const {
        title,
        description,
        entryFee,
        challengeType,
        deadline,
        requirements,
        winnerCount,
      } = request.body;

      // Validate required fields
      if (!title || !description || !entryFee || !challengeType || !deadline) {
        return reply.status(400).send({
          success: false,
          error:
            'Missing required fields: title, description, entryFee, challengeType, deadline',
        });
      }

      // Validate entry fee format
      if (isNaN(parseFloat(entryFee)) || parseFloat(entryFee) <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Entry fee must be a positive number',
        });
      }

      // Validate deadline format
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        return reply.status(400).send({
          success: false,
          error: 'Deadline must be a valid future date',
        });
      }

      // Validate winner count
      if (
        winnerCount &&
        (isNaN(parseInt(winnerCount)) || parseInt(winnerCount) < 1)
      ) {
        return reply.status(400).send({
          success: false,
          error: 'Winner count must be a positive integer',
        });
      }

      const result = await challengeService.createChallenge({
        title,
        description,
        entryFee,
        challengeType,
        deadline,
        requirements: requirements || {},
        winnerCount: winnerCount || 1,
      });

      logger.info('Challenge created via API', { result });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to create challenge via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get all challenges
  fastify.get('/all', async (request, reply) => {
    try {
      const challenges = await challengeService.getAllChallenges();

      return reply.send({
        success: true,
        data: challenges,
      });
    } catch (error) {
      logger.error('Failed to get all challenges via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get challenge details
  fastify.get('/:challengeId', async (request, reply) => {
    try {
      const { challengeId } = request.params;

      // Validate challenge ID
      if (isNaN(parseInt(challengeId)) || parseInt(challengeId) <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid challenge ID',
        });
      }

      const challenge = await challengeService.getChallengeDetails(
        parseInt(challengeId)
      );

      if (!challenge) {
        return reply.status(404).send({
          success: false,
          error: 'Challenge not found',
        });
      }

      return reply.send({
        success: true,
        data: challenge,
      });
    } catch (error) {
      logger.error('Failed to get challenge details via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Add participant to challenge
  fastify.post('/:challengeId/join', async (request, reply) => {
    try {
      const { challengeId } = request.params;
      const { walletAddress, transactionHash } = request.body;

      // Validate challenge ID
      if (isNaN(parseInt(challengeId)) || parseInt(challengeId) <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid challenge ID',
        });
      }

      // Validate required fields
      if (!walletAddress || !transactionHash) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: walletAddress, transactionHash',
        });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid wallet address format',
        });
      }

      const participation = await challengeService.addParticipant(
        parseInt(challengeId),
        walletAddress,
        transactionHash
      );

      logger.info('Participant added via API', { challengeId, walletAddress });

      return reply.send({
        success: true,
        data: participation,
      });
    } catch (error) {
      logger.error('Failed to add participant via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get challenge participants
  fastify.get('/:challengeId/participants', async (request, reply) => {
    try {
      const { challengeId } = request.params;

      // Validate challenge ID
      if (isNaN(parseInt(challengeId)) || parseInt(challengeId) <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid challenge ID',
        });
      }

      const participants = await challengeService.getChallengeParticipants(
        parseInt(challengeId)
      );

      return reply.send({
        success: true,
        data: participants,
      });
    } catch (error) {
      logger.error('Failed to get challenge participants via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Complete a challenge
  fastify.post('/:challengeId/complete', async (request, reply) => {
    try {
      const { challengeId } = request.params;
      const { winners } = request.body;

      // Validate challenge ID
      if (isNaN(parseInt(challengeId)) || parseInt(challengeId) <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid challenge ID',
        });
      }

      // Validate winners array if provided
      if (
        winners &&
        (!Array.isArray(winners) ||
          winners.some(w => !/^0x[a-fA-F0-9]{40}$/.test(w)))
      ) {
        return reply.status(400).send({
          success: false,
          error: 'Winners must be an array of valid wallet addresses',
        });
      }

      const result = await challengeService.completeChallenge(
        parseInt(challengeId),
        winners || []
      );

      logger.info('Challenge completed via API', { challengeId, winners });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to complete challenge via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Check if user is participating in a challenge
  fastify.get(
    '/:challengeId/participation/:walletAddress',
    async (request, reply) => {
      try {
        const { challengeId, walletAddress } = request.params;

        // Validate challenge ID
        if (isNaN(parseInt(challengeId)) || parseInt(challengeId) <= 0) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid challenge ID',
          });
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid wallet address format',
          });
        }

        const isParticipating = await challengeService.isParticipating(
          parseInt(challengeId),
          walletAddress
        );

        return reply.send({
          success: true,
          data: { isParticipating },
        });
      } catch (error) {
        logger.error('Failed to check participation via API', {
          error: error.message,
        });
        return reply.status(500).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get database-only challenge data (no blockchain calls)
  fastify.get('/db-only/:challengeId', async (request, reply) => {
    try {
      const { challengeId } = request.params;

      // Validate challenge ID
      if (isNaN(parseInt(challengeId)) || parseInt(challengeId) <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid challenge ID',
        });
      }

      const dbChallenge = await challengeService.getChallengeFromDatabase(
        parseInt(challengeId)
      );

      if (!dbChallenge) {
        return reply.status(404).send({
          success: false,
          error: 'Challenge not found',
        });
      }

      return reply.send({
        success: true,
        data: dbChallenge,
      });
    } catch (error) {
      logger.error('Failed to get challenge database data via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get multiple challenges database data (no blockchain calls)
  fastify.get('/db-only/batch/:challengeIds', async (request, reply) => {
    try {
      const { challengeIds } = request.params;

      // Parse and validate challenge IDs
      const ids = challengeIds.split(',').map(id => parseInt(id.trim()));

      if (ids.some(id => isNaN(id) || id <= 0)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid challenge IDs',
        });
      }

      const challenges =
        await challengeService.getMultipleChallengesFromDatabase(ids);

      return reply.send({
        success: true,
        data: challenges,
      });
    } catch (error) {
      logger.error('Failed to get multiple challenges database data via API', {
        error: error.message,
      });
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}

module.exports = challengeRoutes;
