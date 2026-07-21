import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				{/* ⚠️ TUZATILDI: viewport meta tegi bu yerdan (_document.tsx)
				    olib tashlandi va _app.tsx'ga ko'chirildi — Next.js buni
				    aniq tavsiya qiladi, chunki _document.js faqat serverda,
				    bir marta render qilinadigan HTML "qobiq" bo'lib, sahifa
				    o'tishlarida ishtirok etmaydi. */}

				{/* ⚠️ TUZATILDI: sahifa doim OCH rejimda ko'rinishi uchun —
				    ba'zi telefonlarning tizim darajasidagi "qorong'i rejim"
				    sozlamasi veb-sahifa ranglarini avtomatik teskari
				    burishi mumkin edi */}
				<meta name="color-scheme" content="light" />
				<meta name="theme-color" content="#FF4D8D" />

				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/png" href="/img/logo/favicon.svg" />

				{/* SEO — ⚠️ TUZATILDI: avvalgi matn Nestar (ko'chmas mulk)
				    loyihasidan qolgan edi, BeautyNear'ga aloqasi yo'q edi */}
				<meta name="keyword" content={'beautynear, k-beauty, korean salon, beauty booking, seoul salon, skin clinic'} />
				<meta
					name={'description'}
					content={
						'Discover and book the best K-Beauty salons and clinics near you in South Korea. | ' +
						'Найдите и забронируйте лучшие K-Beauty салоны и клиники рядом с вами в Южной Корее. | ' +
						'대한민국 최고의 K-뷰티 살롱과 클리닉을 근처에서 찾아 예약하세요.'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}