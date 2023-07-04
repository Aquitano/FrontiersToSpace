import { useEffect, useState } from 'react';

export const useMap = () => {
	const [position, setPosition] = useState({
		lat: 48.5688531,
		lng: 13.4345537,
	});

	const fetchLocation = async () => {
		const axios = (await import('axios')).default;
		try {
			const { data } = await axios.get('http://ip-api.com/json');
			setPosition({
				lat: data.lat,
				lng: data.lon,
			});
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				setPosition({ lat: coords.latitude, lng: coords.longitude });
			},
			(blocked) => {
				if (blocked) {
					fetchLocation();
				}
			},
		);
	}, []);

	return { position };
};
