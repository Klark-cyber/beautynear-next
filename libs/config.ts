export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

// Salon va Service rank chegarasi (homepage top seksiyasi uchun)
export const topSalonRank = 2;
export const topServiceRank = 2;

// Geo filter radius opsiyalari (km)
export const salonRadiusOptions = [0.5, 1, 3, 5, 10];

// Xizmat davomiyligi filter opsiyalari (daqiqa)
export const serviceDurationOptions = [30, 60, 90, 120];