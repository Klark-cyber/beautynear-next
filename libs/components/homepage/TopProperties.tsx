import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import TopPropertyCard from './TopPropertyCard';
import { PropertiesInquiry } from '../../types/service/service.input';
import { Property } from '../../types/service/service';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { useMutation, useQuery } from '@apollo/client';
import { T } from '../../types/common';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';


interface TopPropertiesProps {
	initialInput: PropertiesInquiry;
}

const TopProperties = (props: TopPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topProperties, setTopProperties] = useState<Property[]>([]);

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
			setTopProperties(data?.getProperties?.list); // Kelgan ma'lumotni trendProperties state-iga saqlash
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

	if (device === 'mobile') {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top properties</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={15}
							modules={[Autoplay]}
						>
							{topProperties.map((property: Property) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={property?._id}>
										<TopPropertyCard property={property} likePropertyHandler={likePropertyHandler} />
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
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Top properties</span>
							<p>Check out our Top Properties</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							spaceBetween={15}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-top-next',
								prevEl: '.swiper-top-prev',
							}}
							pagination={{
								el: '.swiper-top-pagination',
							}}
						>
							{topProperties.map((property: Property) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={property?._id}>
										<TopPropertyCard property={property} likePropertyHandler={likePropertyHandler} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TopProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'propertyRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopProperties;
