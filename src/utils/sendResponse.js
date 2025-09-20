/**
 * Utility to build a consistent API response
 *
 * @param {Object} options
 * @param {boolean} options.success - Indicates success or failure
 * @param {string} options.message - Description of the response
 * @param {Object|Array} [options.data={}] - Data payload for success responses
 * @param {Object} [options.errors={}] - Error details for failure responses
 * @param {Object} [options.meta={}] - Additional metadata
 *
 * @returns {Object} Formatted response object
 */

const sendResponse = ({
	success,
	message,
	data = {},
	errors = {},
	meta = {},
}) => {
	return {
		success,
		message,
		data,
		errors,
		meta: {
			timestamp: new Date().toISOString(),
            ...meta
		},
	};
};

export default sendResponse