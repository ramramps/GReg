exports.fail = function(message) {
	return {
		timestamp : Date.now,
		success: false,
		message: message
	}
};

exports.success = function(message) {
	return {
		timestamp : Date.now,
		success: true,
		message: message
	}
}