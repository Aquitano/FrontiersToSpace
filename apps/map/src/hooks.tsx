import axios from 'axios';
import { useEffect, useState } from 'react';

export const useMap = () => {
    const [position, setPosition] = useState({
        lat: 48.5688531,
        lng: 13.4345537,
    });
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setPosition({ lat: coords.latitude, lng: coords.longitude });
            },
            (blocked) => {
                if (blocked) {
                    const fetch = async () => {
                        try {
                            const { data } = await axios.get(
                                'https://ipapi.co/json',
                            );
                            setPosition({
                                lat: data.latitude,
                                lng: data.longitude,
                            });
                        } catch (err) {
                            console.error(err);
                        }
                    };
                    fetch();
                }
            },
        );
    }, []);

    return { position };
};
