import RideRequest from "../models/ride.model.js";

// Helper function to send a message to a specific WebSocket client
const sendMessageToClient = (client, message) => {
    client.send(JSON.stringify(message));
};

// Broadcast a message to all connected WebSocket clients
const broadcastMessage = (webSocketServer, message) => {
    webSocketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            sendMessageToClient(client, message);
        }
    });
};

// Create a new ride request
const createRideRequest = async (webSocketServer, userID, pickupLocation, dropLocation) => {
    try {
        const rideRequest = new RideRequest({
            userID,
            pickupLocation: {
                type: 'Point',
                coordinates: [pickupLocation.longitude, pickupLocation.latitude],
            },
            dropLocation: {
                type: 'Point',
                coordinates: [dropLocation.longitude, dropLocation.latitude],
            },
        });

        await rideRequest.save();
        broadcastMessage(webSocketServer, { type: 'NEW_RIDE_REQUEST', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error creating ride request: ' + error.message);
    }
};

// Accept a ride request
const acceptRide = async (webSocketServer, driverID, rideID) => {
    try {
        const rideRequest = await RideRequest.findById(rideID);
        if (!rideRequest) throw new Error('Ride request not found');

        if (rideRequest.status !== 'PENDING') {
            throw new Error('Ride request is not in a valid state to be accepted');
        }

        rideRequest.driverID = driverID;
        rideRequest.status = 'ACCEPTED';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        broadcastMessage(webSocketServer, { type: 'RIDE_ACCEPTED', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error accepting ride request: ' + error.message);
    }
};

// Start a ride
const startRide = async (webSocketServer, driverID, rideID) => {
    try {
        const rideRequest = await RideRequest.findOne({ _id: rideID, driverID });
        if (!rideRequest) throw new Error('Ride request not found');

        if (rideRequest.status !== 'ACCEPTED') {
            throw new Error('Ride is not in a valid state to be started');
        }

        rideRequest.status = 'IN_PROGRESS';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        broadcastMessage(webSocketServer, { type: 'RIDE_STARTED', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error starting ride: ' + error.message);
    }
};

// Complete the ride
const completeRide = async (webSocketServer, driverID, rideID) => {
    try {
        const rideRequest = await RideRequest.findOne({ _id: rideID, driverID });
        if (!rideRequest) throw new Error('Ride request not found');

        if (rideRequest.status !== 'IN_PROGRESS') {
            throw new Error('Ride is not in a valid state to be completed');
        }

        rideRequest.status = 'COMPLETED';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        broadcastMessage(webSocketServer, { type: 'RIDE_COMPLETED', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error completing ride: ' + error.message);
    }
};

// Cancel the ride
const cancelRide = async (webSocketServer, userID, rideID) => {
    try {
        const rideRequest = await RideRequest.findOne({ _id: rideID, userID });
        if (!rideRequest) throw new Error('Ride request not found');

        if (['COMPLETED', 'CANCELLED'].includes(rideRequest.status)) {
            throw new Error('Ride cannot be cancelled');
        }

        rideRequest.status = 'CANCELLED';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        broadcastMessage(webSocketServer, { type: 'RIDE_CANCELLED', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error cancelling ride: ' + error.message);
    }
};


export {
    createRideRequest,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
};