import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Pagination as MuiPagination, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import SalonCard from '../salon/Saloncard';
import EmptyList from '../common/Emptylist';
import { Salon } from '../../types/salon/salon';
import { SalonsInquiry } from '../../types/salon/salon.input';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';
import { GET_SALONS } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

const DEFAULT_INITIAL_INPUT: SalonsInquiry = {
	page: 1,
	limit: 6,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {
		memberId: '',
	},
};

const MemberSalons: NextPage = ({ initialInput = DEFAULT_INITIAL_INPUT, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const { memberId } = router.query;
	const [searchFilter, setSearchFilter] = useState<SalonsInquiry>({ ...initialInput });
	const [memberSalons, setMemberSalons] = useState<Salon[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);
	const { refetch: getSalonsRefetch } = useQuery(GET_SALONS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter?.search?.memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMemberSalons(data?.getSalons?.list ?? []);
			setTotal(data?.getSalons?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		getSalonsRefetch().then();
	}, [searchFilter]);

	useEffect(() => {
		const targetMemberId = (memberId as string) || user?._id;
		if (targetMemberId) {
			setSearchFilter({ ...initialInput, search: { ...initialInput.search, memberId: targetMemberId } });
		}
	}, [memberId, user?._id]);

	/** HANDLERS **/
	const paginationHandler = (_e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const likeHandler = async (id: string) => {
		try {
			if (!user?._id) throw new Error('Please login first!');
			await likeTargetSalon({ variables: { input: id } });
			const result = await getSalonsRefetch({ input: searchFilter });
			if (result?.data?.getSalons?.list) setMemberSalons(result.data.getSalons.list);
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	if (device === 'mobile') {
		return <div>NESTAR SALONS MOBILE</div>;
	} else {
		return (
			<div id="member-salons-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Salons</Typography>
					</Stack>
				</Stack>

				<Stack className="salons-list-box">
					{memberSalons.length !== 0 ? (
						<Stack className="salons-grid">
							{memberSalons.map((salon: Salon) => (
								<SalonCard key={salon._id} salon={salon} onLike={likeHandler} />
							))}
						</Stack>
					) : (
						<EmptyList emoji="🏪" title="No salons found" desc="This agent hasn't listed any salons yet" />
					)}
				</Stack>

				{memberSalons.length !== 0 && (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<MuiPagination
								count={Math.ceil(total / searchFilter.limit)}
								page={searchFilter.page}
								shape="circular"
								onChange={paginationHandler}
								sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
							/>
						</Stack>
						<Stack className="total">
							<Typography>Total {total} salon(s) available</Typography>
						</Stack>
					</Stack>
				)}
			</div>
		);
	}
};

MemberSalons.defaultProps = {
	initialInput: DEFAULT_INITIAL_INPUT,
};

export default MemberSalons;