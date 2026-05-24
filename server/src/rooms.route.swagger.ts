/**
 * @openapi
 * /rooms/{id}/join:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Join a poker planning room
 *     description: Adds the authenticated user to the room's participant list. If the room no longer exists, recreates it with the requested ID and makes the authenticated user the owner and first participant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Successfully joined the room, or recreated and joined a missing room
 *       404:
 *         description: Reserved for room lookup failures
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *
 * /rooms/{id}:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Get room state
 *     description: Retrieves complete room information including participants, votes, and voting status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room state retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *
 * /rooms/{id}/start-voting:
 *   post:
 *     tags:
 *       - Voting
 *     summary: Start a voting session
 *     description: Starts a new voting session. Only the room owner can start voting. Clears any previous votes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Voting session started successfully
 *       400:
 *         description: Voting is already active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Only the room owner can start voting
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *
 * /rooms/{id}/vote:
 *   post:
 *     tags:
 *       - Voting
 *     summary: Cast or update a vote
 *     description: Submit a vote for the active voting session. Only valid when voting status is "active". Vote values must be XS, S, M, or L.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vote
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [XS, S, M, L]
 *                 description: Vote value (XS=Extra Small, S=Small, M=Medium, L=Large)
 *                 example: M
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       400:
 *         description: Invalid vote or voting not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notActive:
 *                 value:
 *                   error: "Voting is not active"
 *               invalidVote:
 *                 value:
 *                   error: "Invalid vote. Must be one of: XS, S, M, L"
 *       403:
 *         description: User must join the room first
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags:
 *       - Voting
 *     summary: Cancel your vote
 *     description: Removes the user's vote from the current voting session. Only valid when voting is active.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Vote cancelled successfully
 *       400:
 *         description: Voting is not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *
 * /rooms/{id}/close-voting:
 *   post:
 *     tags:
 *       - Voting
 *     summary: Close voting and reveal results
 *     description: Closes the active voting session and reveals all votes. Only the room owner can close voting.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Voting closed successfully
 *       400:
 *         description: Voting is not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Only the room owner can close voting
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *
 * /rooms/{id}/reset-voting:
 *   post:
 *     tags:
 *       - Voting
 *     summary: Reset voting session
 *     description: Resets the voting session to idle state, clearing all votes while keeping participants and room configuration. Only the room owner can reset.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Voting reset successfully
 *       403:
 *         description: Only the room owner can reset voting
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 */
