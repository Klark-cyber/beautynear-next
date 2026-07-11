import { useEffect, useState } from 'react';

// ⚠️ TUZATILDI: avval FAQAT navigator.userAgent tekshirilar edi — bu esa
// ba'zi test usullarida (masalan DevTools'da faqat o'lcham o'zgartirish,
// userAgent'ni spoofing qilmasdan) mobil rejimni noto'g'ri aniqlashga
// olib kelardi (sahifa "desktop" deb qolib, 1300px konteynerlar mobil
// ekranga sig'may, chapga "tiqilib qolgan" ko'rinardi). Endi ekran
// kengligi ham (<=1024px) mobil belgisi sifatida hisobga olinadi — bu
// haqiqiy foydalanuvchilar uchun ham to'g'riroq va ishonchliroq.
const useDeviceDetect = (): string => {
	const [device, setDevice] = useState('desktop');

	useEffect(() => {
		const checkDevice = () => {
			const userAgent = navigator.userAgent;
			const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
			const isNarrowScreen = window.innerWidth <= 1024;
			setDevice(isMobileUA || isNarrowScreen ? 'mobile' : 'desktop');
		};

		checkDevice();
		window.addEventListener('resize', checkDevice);
		return () => window.removeEventListener('resize', checkDevice);
	}, []);

	return device;
};

export default useDeviceDetect;