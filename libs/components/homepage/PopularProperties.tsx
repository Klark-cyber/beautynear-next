import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import PopularPropertyCard from './PopularPropertyCard';
import { Property } from '../../types/property/property';
import Link from 'next/link';
import { PropertiesInquiry } from '../../types/property/property.input';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { T } from '../../types/common';

interface PopularPropertiesProps {
	initialInput: PropertiesInquiry;
}

const PopularProperties = (props: PopularPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [popularProperties, setPopularProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	  const {
		loading: getPropertiesLoading,      // So'rov ketayotgan vaqtda true bo'ladi
		data: getPropertiesData,            // So'rov muvaffaqiyatli bo'lsa, ma'lumotlar shu yerga keladi
		error: getPropertiesError,          // Agar xatolik bo'lsa, xato haqida ma'lumot shu yerda bo'ladi
		refetch: getPropertiesRefetch,      // So'rovni qaytadan yuborish uchun ishlatiladigan funksiya
	  } = useQuery(GET_PROPERTIES, {        // GET_PROPERTIES - bu sizning GraphQL so'rov (query)ingiz
		fetchPolicy: 'cache-and-network',   // Birinchi keshdan ko'rsatadi, keyin tarmoqdan yangi ma'lumotni olib keshni yangilaydi 
		variables: { input: initialInput }, // So'rovga yuboriladigan parametrlar (initialInput props-dan kelmoqda)
		notifyOnNetworkStatusChange: true,  // So'rov qayta yuborilganda (refetch) loading holati o'zgarishini kuzatib boradi
		onCompleted: (data: T) => {         // So'rov muvaffaqiyatli yakunlanganda ishga tushadigan callback funksiya
		  setPopularProperties(data?.getProperties?.list); // Kelgan ma'lumotni trendProperties state-iga saqlash
		},
	  });
	/** HANDLERS **/

	if (!popularProperties) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'popular-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Popular properties</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-property-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={25}
							modules={[Autoplay]}
						>
							{popularProperties.map((property: Property) => {
								return (
									<SwiperSlide key={property._id} className={'popular-property-slide'}>
										<PopularPropertyCard property={property} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'popular-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Popular properties</span>
							<p>Popularity is based on views</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'more-box'}>
								<Link href={'/property'}>
									<span>See All Categories</span>
								</Link>
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-property-swiper'}
							slidesPerView={'auto'}
							spaceBetween={25}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-popular-next',
								prevEl: '.swiper-popular-prev',
							}}
							pagination={{
								el: '.swiper-popular-pagination',
							}}
						>
							{popularProperties.map((property: Property) => {
								return (
									<SwiperSlide key={property._id} className={'popular-property-slide'}>
										<PopularPropertyCard property={property} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
					<Stack className={'pagination-box'}>
						<WestIcon className={'swiper-popular-prev'} />
						<div className={'swiper-popular-pagination'}></div>
						<EastIcon className={'swiper-popular-next'} />
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

PopularProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'propertyViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularProperties;
function setTrendProperties(list: any) {
	throw new Error('Function not implemented.');
}

