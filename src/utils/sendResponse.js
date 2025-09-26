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
			...meta,
		},
	};
};

export default sendResponse;
