import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import {
    Stack, Box, Typography, Button, OutlinedInput,
    Select, MenuItem, InputAdornment, IconButton,
} from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import MobileSpecialists from '../../libs/components/specialist/MobileSpecialists';
import Pagination from '../../libs/components/common/Pagination';
import Emptylist from '../../libs/components/common/Emptylist';
import { GET_AGENTS } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Member } from '../../libs/types/member/member';
// ⚠️ TUZATILDI: haqiqiy yo'l — 'agent.input' fayli umuman mavjud emas edi,
// AgentInquiry aslida 'member.input.ts' ichida joylashgan
import { AgentInquiry } from '../../libs/types/member/member.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

export const getServerSideProps = async ({ locale, query }: any) => {
    const input = query?.input ? JSON.parse(query.input) : null;
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            initialInput: input ?? {
                page: 1, limit: 12,
                sort: 'memberLikes',
                direction: Direction.DESC,
                search: {},
            },
        },
    };
};

const SORT_OPTIONS = [
    { value: 'memberLikes', label: 'Most Popular' },
    { value: 'memberViews', label: 'Most Viewed' },
    { value: 'memberRank', label: 'Top Rated' },
    { value: 'createdAt', label: 'Latest' },
];

// ⚠️ Sizning tasdig'ingiz bilan (A-variant): memberLocation/memberSpecialty/
// memberExperience bo'yicha filtrlar OLIB TASHLANDI — chunki AgentInquiry'ning
// haqiqiy 'search' turi (AISearch) faqat 'text' maydonini qo'llab-quvvatlaydi,
// boshqa maydonlar backend'da e'tiborga olinmas edi (faqat vizual, ishlamas edi).
const SPECIALTY_COLORS: Record<string, string> = {
    'Facial Expert': '#FF4D8D',
    'Nail Artist': '#9B59B6',
    'Hair Stylist': '#E67E22',
    'Massage Therapist': '#27AE60',
    'Skin Specialist': '#2980B9',
    'Botox Specialist': '#E74C3C',
    'Lash & Brow': '#F39C12',
};

const Specialists: NextPage = ({ initialInput }: any) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);

    const [searchFilter, setSearchFilter] = useState<AgentInquiry>(initialInput);
    const [specialists, setSpecialists] = useState<Member[]>([]);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [activeSort, setActiveSort] = useState('memberLikes');

    /** APOLLO **/
    const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);

    const { refetch } = useQuery(GET_AGENTS, {
        fetchPolicy: 'network-only',
        variables: { input: searchFilter },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setSpecialists(data?.getAgents?.list ?? []);
            setTotal(data?.getAgents?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** LIFECYCLES **/
    useEffect(() => {
        if (router.query.input) setSearchFilter(JSON.parse(router.query.input as string));
    }, [router.query.input]);

    /** HANDLERS **/
    // ⚠️ TUZATILDI: '/specialists' (ko'plik, mavjud emas) -> '/specialist' (birlik, haqiqiy sahifa)
    const pushFilter = useCallback(async (updated: AgentInquiry) => {
        setSearchFilter(updated);
        await router.push(
            `/specialist?input=${JSON.stringify(updated)}`,
            `/specialist?input=${JSON.stringify(updated)}`,
            { scroll: false },
        );
    }, []);

    // ⚠️ TUZATILDI: detail sahifasi dinamik segment emas, query-parametr kutadi
    // (pages/specialist/detail.tsx -> router.query.id)
    const goDetail = (id: string) => router.push(`/specialist/detail?id=${id}`);

    const searchHandler = useCallback(async () => {
        await pushFilter({ ...searchFilter, search: { ...searchFilter.search, text: searchText }, page: 1 });
    }, [searchText, searchFilter]);

    const sortHandler = useCallback(async (sort: string) => {
        setActiveSort(sort);
        await pushFilter({ ...searchFilter, sort, page: 1 });
    }, [searchFilter]);

    const likeHandler = useCallback(async (id: string) => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetMember({ variables: { input: id } });
            // ⚠️ TUZATILDI: onCompleted refetch()da ishonchli qayta ishga
            // tushmasligi mumkin — natijadan to'g'ridan-to'g'ri yangilaymiz
            const result = await refetch({ input: searchFilter });
            if (result?.data?.getAgents?.list) setSpecialists(result.data.getAgents.list);
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, searchFilter]);

    const followHandler = useCallback(async (member: Member) => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            const isFollowing = member.meFollowed?.[0]?.myFollowing;
            if (isFollowing) {
                await unsubscribe({ variables: { input: { followingId: member._id } } });
            } else {
                await subscribe({ variables: { input: { followingId: member._id } } });
            }
            const result = await refetch({ input: searchFilter });
            if (result?.data?.getAgents?.list) setSpecialists(result.data.getAgents.list);
            await sweetTopSmallSuccessAlert(isFollowing ? t('Unfollowed') : t('Following!'), 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, searchFilter]);

    const pageHandler = useCallback(async (page: number) => {
        await pushFilter({ ...searchFilter, page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [searchFilter]);

    // ── Specialist Card (Masonry style) ────────────────────────────────────────
    const SpecialistCard = ({ member, index }: { member: Member; index: number }) => {
        // ⚠️ TUZATILDI: avval har doim REACT_APP_API_URL old qatorga qo'shilar
        // edi — tashqi (masalan Unsplash) rasm URL'lari uchun bu buzuq
        // manzil hosil qilardi. Endi to'liq URL bo'lsa, o'zgartirilmaydi.
        const img = member.memberImage
            ? (member.memberImage.startsWith('http') ? member.memberImage : `${REACT_APP_API_URL}/${member.memberImage}`)
            : '/img/profile/defaultUser.svg';
        const portfolioImg = member.memberPortfolio?.[0]
            ? (member.memberPortfolio[0].startsWith('http') ? member.memberPortfolio[0] : `${REACT_APP_API_URL}/${member.memberPortfolio[0]}`)
            : img;
        const liked = member.meLiked?.[0]?.myFavorite;
        const isFollowing = member.meFollowed?.[0]?.myFollowing;
        // ⚠️ TUZATILDI: avval Masonry uslubida turli balandlik (220-280px)
        // bo'lgan — bu boshqa ro'yxat sahifalari (Salons/Services) bilan
        // nomuvofiq ko'rinardi. Endi barcha kartalar bir xil balandlikda.
        const imgHeight = 240;

        return (
            <Stack className="sp-card">
                <Box component="div" className="sp-card-cover"
                    style={{ height: imgHeight, backgroundImage: `url(${portfolioImg})` }}
                    onClick={() => goDetail(member._id)}>
                    {member.memberRank >= 2 && (
                        <Box component="div" className="sp-badge-top">⚡ TOP</Box>
                    )}
                    <IconButton className={`sp-like-btn ${liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); likeHandler(member._id); }}>
                        {liked
                            ? <FavoriteIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                            : <FavoriteBorderIcon sx={{ fontSize: 14, color: '#fff' }} />
                        }
                    </IconButton>
                    <Stack direction="row" alignItems="center" gap={0.5} className="sp-views-overlay">
                        <RemoveRedEyeIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }} />
                        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>
                            {member.memberViews >= 1000 ? `${(member.memberViews / 1000).toFixed(1)}K` : member.memberViews}
                        </Typography>
                    </Stack>
                </Box>

                <Box component="div" className="sp-card-info">
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.75 }}>
                        <Box component="div" className="sp-avatar-wrap">
                            <img src={img} alt={member.memberNick} className="sp-avatar" />
                            <Box component="div" className="sp-online-dot" />
                        </Box>
                        <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                                <Typography className="sp-name" onClick={() => goDetail(member._id)}>
                                    {member.memberNick}
                                </Typography>
                                <VerifiedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                                <Typography sx={{ fontSize: 11, color: '#FFB800' }}>★</Typography>
                                <Typography sx={{ fontSize: 11, color: '#555' }}>4.9</Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    {member.memberSpecialty && member.memberSpecialty.length > 0 && (
                        <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mb: 0.75 }}>
                            {member.memberSpecialty.slice(0, 2).map((sp) => (
                                <Box key={sp} component="div" className="sp-specialty-chip"
                                    style={{ background: `${SPECIALTY_COLORS[sp] ?? '#FF4D8D'}18`, color: SPECIALTY_COLORS[sp] ?? '#FF4D8D', borderColor: `${SPECIALTY_COLORS[sp] ?? '#FF4D8D'}30` }}>
                                    {sp}
                                </Box>
                            ))}
                        </Stack>
                    )}

                    {member.memberAddress && (
                        <Typography className="sp-location-text">
                            <LocationOnOutlinedIcon sx={{ fontSize: 11 }} /> {member.memberAddress}
                        </Typography>
                    )}

                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 0.75, mb: 1 }}>
                        <Stack direction="row" alignItems="center" gap={0.25}>
                            <FavoriteBorderIcon sx={{ fontSize: 12, color: '#FF4D8D' }} />
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{member.memberLikes}</Typography>
                        </Stack>
                        {!!member.memberExperience && (
                            <>
                                <Typography sx={{ fontSize: 11, color: '#bbb' }}>·</Typography>
                                <Typography sx={{ fontSize: 11, color: '#888' }}>💼 {member.memberExperience} {t('yrs')}</Typography>
                            </>
                        )}
                    </Stack>

                    <Stack direction="row" gap={0.75}>
                        <Button
                            fullWidth size="small"
                            className={`sp-follow-btn ${isFollowing ? 'following' : ''}`}
                            startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 13 }} />}
                            onClick={() => followHandler(member)}>
                            {isFollowing ? t('Following') : t('Follow')}
                        </Button>
                        <Button
                            fullWidth size="small"
                            className="sp-book-btn"
                            onClick={() => goDetail(member._id)}>
                            {t('Book')} →
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        );
    };

    // ── MOBILE ──
    if (device === 'mobile') {
        return <MobileSpecialists />;
    }

    // ── DESKTOP ─────────────────────────────────────────────────────────────────
    return (
        <Stack className="specialists-page">
            <Stack className="sp-top-bar">
                <Stack className="sp-top-inner" direction="row" alignItems="center" gap={2}>
                    <OutlinedInput value={searchText} onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('Search specialists, skills...')}
                        onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /></InputAdornment>}
                        sx={{ flex: 1, borderRadius: 2.5, fontSize: 13, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' }, '&.Mui-focused fieldset': { borderColor: '#FF4D8D' } }}
                    />
                    <Button className="sp-find-btn" onClick={searchHandler}>{t('Find Now')}</Button>
                </Stack>
            </Stack>

            <Stack className="sp-main">
                <Stack className="sp-content" sx={{ width: '100%' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography className="sp-results-count">
                            <Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('specialists found')}
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography sx={{ fontSize: 12, color: '#888' }}>{t('Sort by')}:</Typography>
                            {SORT_OPTIONS.map((s) => (
                                <Box key={s.value} component="div"
                                    onClick={() => sortHandler(s.value)}
                                    className={`sp-sort-chip ${activeSort === s.value ? 'active' : ''}`}>
                                    {t(s.label)}
                                </Box>
                            ))}
                        </Stack>
                    </Stack>

                    {specialists.length === 0 ? (
                        <Emptylist emoji="👩‍🎨" title={t('No specialists found')} desc={t('Try a different search')} />
                    ) : (
                        <Box component="div" className="sp-masonry-grid">
                            {specialists.map((member, i) => (
                                <SpecialistCard key={member._id} member={member} index={i} />
                            ))}
                        </Box>
                    )}

                    <Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />
                </Stack>
            </Stack>
        </Stack>
    );
};

export default withLayoutBasic(Specialists);