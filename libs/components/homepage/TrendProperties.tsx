import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import { Property } from '../../types/property/property';
import { PropertiesInquiry } from '../../types/property/property.input';
import TrendPropertyCard from './TrendPropertyCard';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { useMutation, useQuery } from '@apollo/client';
import { T } from '../../types/common';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';


interface TrendPropertiesProps {
	initialInput: PropertiesInquiry;
}

const TrendProperties = (props: TrendPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendProperties, setTrendProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY); //kerakli propertyga like bosish mantigi 

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
			setTrendProperties(data?.getProperties?.list); // Kelgan ma'lumotni trendProperties state-iga saqlash
		},
	});

	/** HANDLERS **/
	const likePropertyHandler = async (user: T, id: string) => {
		try {
			if (!id) return; // Agar property ID-si bo'lmasa, funksiyani to'xtatish
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED); // Foydalanuvchi ID-si bo'lmasa, xato otish

			// Backendga "like" bosish uchun mutatsiyani yuborish
			await likeTargetProperty({
				variables: { input: id },
			});

			// Ro'yxatni yangilash (refetch) uchun so'rov yuborish
			await getPropertiesRefetch({ input: initialInput }); //input backend kutayotgan input kalit sozi, initialInput yangilanishi kerak bolgan data.user like bossa yoki likeni qaytarib olsa backenddagi data ozgaradi shu ozgargan datat darxol namoyon boladi

			// Muvaffaqiyatli amal bajarilganda kichik "success" xabarini chiqarish
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			// Xatolik yuz bersa, konsolga chiqarish
			console.log('ERROR, likePropertyHandler:', err.message);
			// Foydalanuvchiga xatolik haqida bildirishnoma ko'rsatish
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (trendProperties) console.log('trendProperties:', trendProperties);
	if (!trendProperties) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'trend-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Trend Properties</span>
					</Stack>
					<Stack className={'card-box'}>
						{trendProperties.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>
								Trends Empty
							</Box>
						) : (
							<Swiper
								className={'trend-property-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{trendProperties.map((property: Property) => {
									return (
										<SwiperSlide key={property._id} className={'trend-property-slide'}>
											<TrendPropertyCard property={property} likePropertyHandler={likePropertyHandler} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'trend-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Trend Properties</span>
							<p>Trend is based on likes</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-trend-prev'} />
								<div className={'swiper-trend-pagination'}></div>
								<EastIcon className={'swiper-trend-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{trendProperties.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>
								Trends Empty
							</Box>
						) : (
							<Swiper
								className={'trend-property-swiper'}
								slidesPerView={'auto'}
								spaceBetween={15}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-trend-next',
									prevEl: '.swiper-trend-prev',
								}}
								pagination={{
									el: '.swiper-trend-pagination',
								}}
							>
								{trendProperties.map((property: Property) => {
									return (
										<SwiperSlide key={property._id} className={'trend-property-slide'}>
											<TrendPropertyCard property={property} likePropertyHandler={likePropertyHandler} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TrendProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'propertyLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendProperties;
