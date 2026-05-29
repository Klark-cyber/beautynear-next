import React, { useState } from 'react';
import { NextPage } from 'next';
import { Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { PropertyCard } from './PropertyCard';
import { useReactiveVar } from '@apollo/client';
import { Property } from '../../types/service/service';
import { AgentPropertiesInquiry } from '../../types/service/service.input';
import { T } from '../../types/common';
import { PropertyStatus } from '../../enums/salon.enum';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { GET_AGENT_PROPERTIES } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

const MyProperties: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const [searchFilter, setSearchFilter] = useState<AgentPropertiesInquiry>(initialInput);
	const [agentProperties, setAgentProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/**  APOLLO REQUESTS */
	const [updateProperty] = useMutation(UPDATE_PROPERTY); //updateProperty ozgaruvchisi backenddagi UPDATE_PROPERTY muatation graphql methodga sorov yuboradi

	//Agent propertylarini backenddan chaqiramiz
	const {
		loading: getAgentPropertiesLoading,
		data: getAgentPropertiesData,
		error: getAgentPropertiesError,
		refetch: getAgentPropertiesRefetch,
	} = useQuery(GET_AGENT_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },  //searchFilter pasda hosil qilingan defaultPropsni qabul qilyappti
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentProperties(data?.getAgentProperties?.list); //kelgan datani AgentProperties ozgaruvchiga yuklayapmiz
			setTotal(data?.getAgentProperties?.metaCounter[0]?.total ?? 0); //propertylar umumiy sonini totalga yukladik
		},
	});

	/* HANDLERS */
	const paginationHandler = (e: T, value: number) => { //MyPropertiesda pagenation bor ushbu pagenationni ishga tushirish uchun handler hosil qilamiz
		setSearchFilter({ ...searchFilter, page: value }); //dastlabki qiymatga esa pasdagi initial inputni beramz.Avval uni spread qilib referense yangilaymiz sababi eski fieldni saqlab faqat searchfilter ichidagi pageni ozgartirishimiz kerak qolganini ozgartirib bolmaydi. unda page:1, limit: 5 ga teng
	};

	const changeStatusHandler = (value: PropertyStatus) => { //Propertylarni statusini ozgartirishda foydalanamiz
		setSearchFilter({ ...searchFilter, search: { propertyStatus: value } });// searchFilterni spread qilishimizga sabab shu qismgacha ozgartirilgan statusni saqlab faqatgina PropertyStatusni kerakli qiymatga ozgartirishimiz kerak.Agar spread qilmasak faqat search qolib qolgan page va limit qiymatlar yoqolib ketadi
	};

	const deletePropertyHandler = async (id: string) => { //Agent oziga tegishli Propertylarni ochiradi
		try {
			if (await sweetConfirmAlert('are you sure to delete this property?')) { //confirm qilamiz
				await updateProperty({ //yuqorida hosil qilingan updateProperty methodgan input sifatida kerakli propertyga handle qilib berilganda osha propertyning idsi ni path qilamiz
					variables: {
						input: {
							_id: id,
							propertyStatus: 'DELETE', //property statusni delete qilamiz
						},
					},
				});

				await getAgentPropertiesRefetch({ input: searchFilter }); //Agent hosil qilgan propertylar royxatini yangilaymiz u yerda delete statuslilarini ochirish uchun.
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const updatePropertyHandler = async (status: string, id: string) => { //bu handler orqali statusni ozgartiramiz va propertylar royxatini refetch orqali yangilab olamiz
		try {
			if (await sweetConfirmAlert(`are you sure change to ${status} status?`)) {
				await updateProperty({
					variables: {
						input: {
							_id: id,
							propertyStatus: status,
						},
					},
				});

				await getAgentPropertiesRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user?.memberType !== 'AGENT') {
		router.back();
	}

	if (device === 'mobile') {
		return <div>NESTAR PROPERTIES MOBILE</div>;
	} else {
		return (
			<div id="my-property-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">My Properties</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="property-list-box">
					<Stack className="tab-name-box">
						<Typography
							onClick={() => changeStatusHandler(PropertyStatus.ACTIVE)}
							className={searchFilter.search.propertyStatus === 'ACTIVE' ? 'active-tab-name' : 'tab-name'}
						>
							On Sale
						</Typography>
						<Typography
							onClick={() => changeStatusHandler(PropertyStatus.SOLD)}
							className={searchFilter.search.propertyStatus === 'SOLD' ? 'active-tab-name' : 'tab-name'}
						>
							On Sold
						</Typography>
					</Stack>
					<Stack className="list-box">
						<Stack className="listing-title-box">
							<Typography className="title-text">Listing title</Typography>
							<Typography className="title-text">Date Published</Typography>
							<Typography className="title-text">Status</Typography>
							<Typography className="title-text">View</Typography>
							{searchFilter.search.propertyStatus === 'ACTIVE' && <Typography className="title-text">Action</Typography>}
						</Stack>

						{agentProperties?.length === 0 ? (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No Property found!</p>
							</div>
						) : (
							agentProperties.map((property: Property) => { // Yuqorida hosil qilingan handlerlarni PropertyCardga yuboramiz
								return (
									<PropertyCard
										property={property}
										deletePropertyHandler={deletePropertyHandler}
										updatePropertyHandler={updatePropertyHandler}
									/>
								);
							})
						)}

						{agentProperties.length !== 0 && (
							<Stack className="pagination-config">
								<Stack className="pagination-box">
									<Pagination
										count={Math.ceil(total / searchFilter.limit)}
										page={searchFilter.page}
										shape="circular"
										color="primary"
										onChange={paginationHandler}
									/>
								</Stack>
								<Stack className="total-result">
									<Typography>{total} property available</Typography>
								</Stack>
							</Stack>
						)}
					</Stack>
				</Stack>
			</div>
		);
	}
};

MyProperties.defaultProps = { //Bu propsdan backendga ketadigan requestga default input berishda foydalanamiz, pagination hosil qilishda ham foydalanamiz
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		search: {
			propertyStatus: 'ACTIVE',
		},
	},
};

export default MyProperties;
