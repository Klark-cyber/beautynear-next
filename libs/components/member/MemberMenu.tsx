import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Stack, Typography, Box, List, ListItem, Button } from '@mui/material';
import Link from 'next/link';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';
import { GET_MEMBER } from '../../../apollo/user/query';
import { useQuery, useReactiveVar } from '@apollo/client';
import { T } from '../../types/common';
import { MemberType } from '../../enums/member.enum';
import { userVar } from '../../../apollo/store';

interface MemberMenuProps {
	subscribeHandler: any;
	unsubscribeHandler: any;
}

const MemberMenu = (props: MemberMenuProps) => {
	const { subscribeHandler, unsubscribeHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const category: any = router.query?.category;
	const [member, setMember] = useState<Member | null>(null);
	const user = useReactiveVar(userVar);
	// ⚠️ memberId URL'da bo'lmasa — o'z profilini ko'rsatamiz
	// (Followers.tsx/Followings.tsx'dagi bilan bir xil fallback naqshi)
	const memberId = (router.query?.memberId as string) || user?._id;

	/** APOLLO REQUESTS **/
	const { refetch: getMemberRefetch } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMember(data?.getMember);
		},
	});

	if (device === 'mobile') {
		return <div>MEMBER MENU MOBILE</div>;
	} else {
		return (
			<Stack width={'100%'} padding={'30px 24px'}>
				<Stack className={'profile'}>
					<Box component={'div'} className={'profile-img'}>
						<img
							src={
								!member?.memberImage
									? '/img/profile/defaultUser.svg'
									: member.memberImage.startsWith('http')
										? member.memberImage
										: `${REACT_APP_API_URL}/${member.memberImage}`
							}
							alt={'member-photo'}
						/>
					</Box>
					<Stack className={'user-info'}>
						<Typography className={'user-name'}>{member?.memberNick}</Typography>
						<Box component={'div'} className={'user-phone'}>
							<img src={'/img/icons/call.svg'} alt={'icon'} />
							<Typography className={'p-number'}>{member?.memberPhone}</Typography>
						</Box>
						<Typography className={'view-list'}>{member?.memberType}</Typography>
					</Stack>
				</Stack>
				<Stack className="follow-button-box">
					{member?.meFollowed && member?.meFollowed[0]?.myFollowing ? (
						<>
							<Button
								variant="outlined"
								sx={{ background: '#f4f4f4' }}
								onClick={() => unsubscribeHandler(member?._id, getMemberRefetch, memberId)}
							>
								Unfollow
							</Button>
							<Typography>Following</Typography>
						</>
					) : (
						<Button
							variant="contained"
							className="follow-btn"
							onClick={() => subscribeHandler(member?._id, getMemberRefetch, memberId)}
						>
							Follow
						</Button>
					)}
				</Stack>
				<Stack className={'sections'}>
					{/* ═══ Details (Salons — faqat Agent, Followers, Followings) ═══ */}
					<Stack className={'section'}>
						<Typography className="title" variant={'h5'}>
							Details
						</Typography>
						<List className={'sub-section'}>
							{member?.memberType === MemberType.AGENT && (
								<ListItem className={category === 'salons' ? 'focus' : ''}>
									<Link
										href={{ pathname: '/member', query: { ...router.query, category: 'salons' } }}
										scroll={false}
										style={{ width: '100%' }}
									>
										<div className={'flex-box'}>
											<StorefrontOutlinedIcon className={'com-icon'} sx={{ fontSize: 21 }} />
											<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
												Salons
											</Typography>
											<Typography className="count-title" variant="subtitle1">
												{member?.memberSalons ?? 0}
											</Typography>
										</div>
									</Link>
								</ListItem>
							)}
							<ListItem className={category === 'followers' ? 'focus' : ''}>
								<Link
									href={{ pathname: '/member', query: { ...router.query, category: 'followers' } }}
									scroll={false}
									style={{ width: '100%' }}
								>
									<div className={'flex-box'}>
										<PeopleOutlineIcon className={'com-icon'} sx={{ fontSize: 21 }} />
										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											Followers
										</Typography>
										<Typography className="count-title" variant="subtitle1">
											{member?.memberFollowers ?? 0}
										</Typography>
									</div>
								</Link>
							</ListItem>
							<ListItem className={category === 'followings' ? 'focus' : ''}>
								<Link
									href={{ pathname: '/member', query: { ...router.query, category: 'followings' } }}
									scroll={false}
									style={{ width: '100%' }}
								>
									<div className={'flex-box'}>
										<PersonAddAltOutlinedIcon className={'com-icon'} sx={{ fontSize: 21 }} />
										<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
											Followings
										</Typography>
										<Typography className="count-title" variant="subtitle1">
											{member?.memberFollowings ?? 0}
										</Typography>
									</div>
								</Link>
							</ListItem>
						</List>
					</Stack>

					{/* ═══ Community (Articles) ═══ */}
					<Stack className={'section'} sx={{ marginTop: '10px' }}>
						<div>
							<Typography className="title" variant={'h5'}>
								Community
							</Typography>
							<List className={'sub-section'}>
								<ListItem className={category === 'articles' ? 'focus' : ''}>
									<Link
										href={{ pathname: '/member', query: { ...router.query, category: 'articles' } }}
										scroll={false}
										style={{ width: '100%' }}
									>
										<div className={'flex-box'}>
											<ArticleOutlinedIcon className={'com-icon'} sx={{ fontSize: 21 }} />
											<Typography className={'sub-title'} variant={'subtitle1'} component={'p'}>
												Articles
											</Typography>
											<Typography className="count-title" variant="subtitle1">
												{member?.memberArticles ?? 0}
											</Typography>
										</div>
									</Link>
								</ListItem>
							</List>
						</div>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default MemberMenu;