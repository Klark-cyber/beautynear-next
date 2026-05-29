import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Menu, MenuItem, Pagination, Stack, Typography } from '@mui/material';
import PropertyCard from '../../libs/components/property/PropertyCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Filter from '../../libs/components/property/Filter';
import { useRouter } from 'next/router';
import { PropertiesInquiry } from '../../libs/types/service/service.input';
import { Property } from '../../libs/types/service/service';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Direction, Message } from '../../libs/enums/common.enum';
import { GET_PROPERTIES } from '../../apollo/user/query';
import { useMutation, useQuery } from '@apollo/client';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PropertyList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter(); //product pageda paramsda input qiymatlarini qolga olish uchun routerni chaqirib oldik
	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>( //yangi useState hosil qildik va uni interfaceni backendda hosil qilgan PropertiesInquiry orqali belgilab oldik
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput, //searchFilter ning boshlangich qiymati sifatida input ichidagi qiymatni berdik.agar input mavjud bolmasa pasdagi  PropertyList.defaultProps  shuni berdik
	);
	const [properties, setProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0); //search natijasida hosil bolgan jami propertylar sonini biriktiramiz
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [sortingOpen, setSortingOpen] = useState(false);
	const [filterSortName, setFilterSortName] = useState('New');

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);
	const {
		loading: getPropertiesLoading,      // So'rov ketayotgan vaqtda true bo'ladi
		data: getPropertiesData,            // So'rov muvaffaqiyatli bo'lsa, ma'lumotlar shu yerga keladi
		error: getPropertiesError,          // Agar xatolik bo'lsa, xato haqida ma'lumot shu yerda bo'ladi
		refetch: getPropertiesRefetch,      // So'rovni qaytadan yuborish uchun ishlatiladigan funksiya
	} = useQuery(GET_PROPERTIES, {        // GET_PROPERTIES - bu sizning GraphQL so'rov (query)ingiz
		fetchPolicy: 'network-only',   // Birinchi keshdan ko'rsatadi, keyin tarmoqdan yangi ma'lumotni olib keshni yangilaydi 
		variables: { input: searchFilter }, // So'rovga yuboriladigan parametrlar (initialInput props-dan kelmoqda)
		notifyOnNetworkStatusChange: true,  // So'rov qayta yuborilganda (refetch) loading holati o'zgarishini kuzatib boradi
		onCompleted: (data: T) => {         // So'rov muvaffaqiyatli yakunlanganda ishga tushadigan callback funksiya
			setProperties(data?.getProperties?.list); // Kelgan ma'lumotni trendProperties state-iga saqlash
			setTotal(data?.getProperties?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) { //browserda propertyga tegishi filter ishga tushsa yani input params shakllansa,bor bolsa 
			const inputObj = JSON.parse(router?.query?.input as string); //browser search qismida hosil bolgan input query paramsni jsondan parse qilib objectga ozgartirdik.va natijani setSearchFilter orqali searchFilter qiymatini yangiladik bu bizga refreshsiz paramsni boyitish imkonini beradi
			setSearchFilter(inputObj);
		}

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]); //agar router user kerakli filter orqali propertylarni izlasa har bir qoshimcha filterga tegishli malumot uchun router yangilaniadi va searchFilter boyitiladi

	//BACKEND REFETCH xozir shart emas ammo kerak bolsa u quyidagicha qilinadi
	useEffect(() => {
		console.log("searchFilter:", searchFilter)
		//getPropertiesRefetch({ input: searchFilter }).then()
	}, [searchFilter]);


	/** HANDLERS **/
	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		await router.push(
			`/property?input=${JSON.stringify(searchFilter)}`,
			`/property?input=${JSON.stringify(searchFilter)}`,
			{
				scroll: false,
			},
		);
		setCurrentPage(value);
	};

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

	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = (e: React.MouseEvent<HTMLLIElement>) => {
		switch (e.currentTarget.id) {
			case 'new':
				setSearchFilter({ ...searchFilter, sort: 'createdAt', direction: Direction.ASC });
				setFilterSortName('New');
				break;
			case 'lowest':
				setSearchFilter({ ...searchFilter, sort: 'propertyPrice', direction: Direction.ASC });
				setFilterSortName('Lowest Price');
				break;
			case 'highest':
				setSearchFilter({ ...searchFilter, sort: 'propertyPrice', direction: Direction.DESC });
				setFilterSortName('Highest Price');
		}
		setSortingOpen(false);
		setAnchorEl(null);
	};

	if (device === 'mobile') {
		return <h1>PROPERTIES MOBILE</h1>;
	} else {
		return (
			<div id="property-list-page" style={{ position: 'relative' }}>
				<div className="container">
					<Box component={'div'} className={'right'}>
						<span>Sort by</span>
						<div>
							<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
								{filterSortName}
							</Button>
							<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
								<MenuItem
									onClick={sortingHandler}
									id={'new'}
									disableRipple
									sx={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
								>
									New
								</MenuItem>
								<MenuItem
									onClick={sortingHandler}
									id={'lowest'}
									disableRipple
									sx={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
								>
									Lowest Price
								</MenuItem>
								<MenuItem
									onClick={sortingHandler}
									id={'highest'}
									disableRipple
									sx={{ boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px' }}
								>
									Highest Price
								</MenuItem>
							</Menu>
						</div>
					</Box>
					<Stack className={'property-page'}>
						<Stack className={'filter-config'}>
							{/* @ts-ignore */}
							<Filter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} /> {/**Yuqorida hosil qilingan  searchFilter variableni Filterga props orqali pzth qildik va setSearchFilterni yani searchFilter ozgaruvchini qiymatini yangilovchi funksiyani ham yubordik.Shuningdek PropertyList.defaultProps ni ham*/}
						</Stack>
						<Stack className="main-config" mb={'76px'}>
							<Stack className={'list-config'}>
								{properties?.length === 0 ? (
									<div className={'no-data'}>
										<img src="/img/icons/icoAlert.svg" alt="" />
										<p>No Properties found!</p>
									</div>
								) : (
									properties.map((property: Property) => {
										return <PropertyCard property={property} key={property?._id} likePropertyHandler={likePropertyHandler} />;
									})
								)}
							</Stack>
							<Stack className="pagination-config">
								{properties.length !== 0 && (
									<Stack className="pagination-box">
										<Pagination
											page={currentPage}
											count={Math.ceil(total / searchFilter.limit)}
											onChange={handlePaginationChange}
											shape="circular"
											color="primary"
										/>
									</Stack>
								)}

								{properties.length !== 0 && (
									<Stack className="total-result">
										<Typography>
											Total {total} propert{total > 1 ? 'ies' : 'y'} available
										</Typography>
									</Stack>
								)}
							</Stack>
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

PropertyList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			squaresRange: {
				start: 0,
				end: 500,
			},
			pricesRange: {
				start: 0,
				end: 2000000,
			},
		},
	},
};

export default withLayoutBasic(PropertyList);
