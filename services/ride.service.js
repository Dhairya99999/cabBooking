import RideRequest from "../models/ride.model.js";

// Helper function to send a message to a specific Socket.IO client
const sendMessageToClient = (client, event, message) => {
    client.emit(event, message);
};

// Broadcast a message to all connected Socket.IO clients
const broadcastMessage = (io, event, message) => {
    io.emit(event, message);
};

// Create a new ride request
const createRideRequest = async (io, userID, pickupLocation, dropLocation) => {
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
        // Emit custom 'ride-request' event with a message 'hi'
        broadcastMessage(io, 'ride-request', { message: 'hi', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error creating ride request: ' + error.message);
    }
};

// Accept a ride request
const acceptRide = async (io, driverID, rideID) => {
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
        // Emit custom 'ride-request' event with a message 'hi'
        broadcastMessage(io, 'ride-request', { message: 'hi', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error accepting ride request: ' + error.message);
    }
};

// Start a ride
const startRide = async (io, driverID, rideID) => {
    try {
        const rideRequest = await RideRequest.findOne({ _id: rideID, driverID });
        if (!rideRequest) throw new Error('Ride request not found');

        if (rideRequest.status !== 'ACCEPTED') {
            throw new Error('Ride is not in a valid state to be started');
        }

        rideRequest.status = 'IN_PROGRESS';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        // Emit custom 'ride-request' event with a message 'hi'
        broadcastMessage(io, 'ride-request', { message: 'hi', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error starting ride: ' + error.message);
    }
};

// Complete the ride
const completeRide = async (io, driverID, rideID) => {
    try {
        const rideRequest = await RideRequest.findOne({ _id: rideID, driverID });
        if (!rideRequest) throw new Error('Ride request not found');

        if (rideRequest.status !== 'IN_PROGRESS') {
            throw new Error('Ride is not in a valid state to be completed');
        }

        rideRequest.status = 'COMPLETED';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        // Emit custom 'ride-request' event with a message 'hi'
        broadcastMessage(io, 'ride-request', { message: 'hi', data: rideRequest });
        return rideRequest;
    } catch (error) {
        throw new Error('Error completing ride: ' + error.message);
    }
};

// Cancel the ride
const cancelRide = async (io, userID, rideID) => {
    try {
        const rideRequest = await RideRequest.findOne({ _id: rideID, userID });
        if (!rideRequest) throw new Error('Ride request not found');

        if (['COMPLETED', 'CANCELLED'].includes(rideRequest.status)) {
            throw new Error('Ride cannot be cancelled');
        }

        rideRequest.status = 'CANCELLED';
        rideRequest.updatedAt = new Date();

        await rideRequest.save();
        // Emit custom 'ride-request' event with a message 'hi'
        broadcastMessage(io, 'ride-request', { message: 'hi', data: rideRequest });
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
