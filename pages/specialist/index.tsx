import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import {
    Stack, Box, Typography, Button, OutlinedInput,
    Select, MenuItem, InputAdornment, Drawer,
    Checkbox, Radio, RadioGroup, FormControlLabel,
    Slider, Collapse, IconButton, Switch,
} from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import Pagination from '../../libs/components/common/Pagination';
import Emptylist from '../../libs/components/common/Emptylist';
import RatingStars from '../../libs/components/common/Ratingstars';
import { GET_AGENTS } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Member } from '../../libs/types/member/member';
import { AgentInquiry } from '../../libs/types/member/agent.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { FollowGroup } from '../../libs/enums/follow.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import Link from 'next/link';

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

const SPECIALTIES = ['Facial Expert', 'Nail Artist', 'Hair Stylist', 'Massage Therapist', 'Skin Specialist', 'Botox Specialist', 'Lash & Brow'];
const LOCATIONS = ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Jeju', 'Gangwon'];
const SORT_OPTIONS = [
    { value: 'memberLikes', label: 'Most Popular' },
    { value: 'memberViews', label: 'Most Viewed' },
    { value: 'memberRank', label: 'Top Rated' },
    { value: 'createdAt', label: 'Latest' },
];
const SKILL_CHIPS = ['All', 'Facial', 'Nail', 'Hair', 'Massage', 'Clinic', 'Botox', 'Lash & Brow'];
const RATINGS = [
    { value: 4.5, label: '4.5 & above' },
    { value: 4.0, label: '4.0 & above' },
    { value: 3.5, label: '3.5 & above' },
];
const SPECIALTY_COLORS: Record<string, string> = {
    'Facial Expert': '#FF4D8D',
    'Nail Artist': '#9B59B6',
    'Hair Stylist': '#E67E22',
    'Massage Therapist': '#27AE60',
    'Skin Specialist': '#2980B9',
    'Botox Specialist': '#E74C3C',
    'Lash & Brow': '#F39C12',
};

const FilterSection = ({ title, children }: any) => {
    const [open, setOpen] = useState(true);
    return (
        <Box component="div" className="sp-filter-section">
            <Stack direction="row" justifyContent="space-between" alignItems="center"
                onClick={() => setOpen(!open)} className="sp-filter-header">
                <Typography className="sp-filter-title">{title}</Typography>
                {open ? <ExpandLessIcon sx={{ fontSize: 15, color: '#aaa' }} /> : <ExpandMoreIcon sx={{ fontSize: 15, color: '#aaa' }} />}
            </Stack>
            <Collapse in={open}>
                <Box component="div" className="sp-filter-body">{children}</Box>
            </Collapse>
        </Box>
    );
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
    const [activeChip, setActiveChip] = useState('All');
    const [activeSort, setActiveSort] = useState('memberLikes');
    const [experience, setExperience] = useState<number>(1);
    const [minRating, setMinRating] = useState<number | null>(null);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
    const pushFilter = useCallback(async (updated: AgentInquiry) => {
        setSearchFilter(updated);
        await router.push(
            `/specialists?input=${JSON.stringify(updated)}`,
            `/specialists?input=${JSON.stringify(updated)}`,
            { scroll: false },
        );
    }, []);

    const searchHandler = useCallback(async () => {
        await pushFilter({ ...searchFilter, search: { ...searchFilter.search, text: searchText }, page: 1 });
    }, [searchText, searchFilter]);

    const sortHandler = useCallback(async (sort: string) => {
        setActiveSort(sort);
        await pushFilter({ ...searchFilter, sort, page: 1 });
    }, [searchFilter]);

    const specialtyHandler = useCallback(async (specialty: string) => {
        const current = searchFilter.search.memberSpecialty ?? [];
        const updated = current.includes(specialty)
            ? current.filter((s) => s !== specialty)
            : [...current, specialty];
        const search = { ...searchFilter.search };
        if (updated.length) search.memberSpecialty = updated;
        else delete search.memberSpecialty;
        await pushFilter({ ...searchFilter, search, page: 1 });
    }, [searchFilter]);

    const locationHandler = useCallback(async (location: string) => {
        await pushFilter({ ...searchFilter, search: { ...searchFilter.search, memberLocation: location }, page: 1 });
    }, [searchFilter]);

    const experienceHandler = useCallback(async (val: number) => {
        setExperience(val);
        await pushFilter({ ...searchFilter, search: { ...searchFilter.search, memberExperience: val }, page: 1 });
    }, [searchFilter]);

    const chipHandler = useCallback(async (chip: string) => {
        setActiveChip(chip);
        const search = { ...searchFilter.search };
        if (chip === 'All') delete search.memberSpecialty;
        else search.memberSpecialty = [chip];
        await pushFilter({ ...searchFilter, search, page: 1 });
    }, [searchFilter]);

    const resetHandler = useCallback(async () => {
        setSearchText('');
        setExperience(1);
        setMinRating(null);
        setActiveChip('All');
        setActiveSort('memberLikes');
        await pushFilter(initialInput);
    }, [initialInput]);

    const likeHandler = useCallback(async (id: string) => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetMember({ variables: { input: id } });
            await refetch({ input: searchFilter });
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
            await refetch({ input: searchFilter });
            await sweetTopSmallSuccessAlert(isFollowing ? 'Unfollowed' : 'Following!', 800);
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
        const img = member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg';
        const portfolioImg = member.memberPortfolio?.[0] ? `${REACT_APP_API_URL}/${member.memberPortfolio[0]}` : img;
        const liked = member.meLiked?.[0]?.myFavorite;
        const isFollowing = member.meFollowed?.[0]?.myFollowing;
        // Masonry uchun turli balandliklar
        const heights = [220, 260, 200, 240, 280, 210];
        const imgHeight = heights[index % heights.length];

        return (
            <Stack className="sp-card">
                {/* Cover image */}
                <Box component="div" className="sp-card-cover"
                    style={{ height: imgHeight, backgroundImage: `url(${portfolioImg})` }}
                    onClick={() => router.push(`/specialists/${member._id}`)}>
                    {/* TOP badge */}
                    {member.memberRank >= 2 && (
                        <Box component="div" className="sp-badge-top">⚡ TOP</Box>
                    )}
                    {/* Like button */}
                    <IconButton className={`sp-like-btn ${liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); likeHandler(member._id); }}>
                        {liked
                            ? <FavoriteIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                            : <FavoriteBorderIcon sx={{ fontSize: 14, color: '#fff' }} />
                        }
                    </IconButton>
                    {/* Views overlay */}
                    <Stack direction="row" alignItems="center" gap={0.5} className="sp-views-overlay">
                        <RemoveRedEyeIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }} />
                        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>
                            {member.memberViews >= 1000 ? `${(member.memberViews / 1000).toFixed(1)}K` : member.memberViews}
                        </Typography>
                    </Stack>
                </Box>

                {/* Info */}
                <Box component="div" className="sp-card-info">
                    {/* Avatar + name */}
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.75 }}>
                        <Box component="div" className="sp-avatar-wrap">
                            <img src={img} alt={member.memberNick} className="sp-avatar" />
                            <Box component="div" className="sp-online-dot" />
                        </Box>
                        <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                                <Typography className="sp-name" onClick={() => router.push(`/specialists/${member._id}`)}>
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

                    {/* Specialty chips */}
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

                    {/* Salon + Location */}
                    {member.memberAddress && (
                        <Typography className="sp-salon-text">📍 {member.memberAddress}</Typography>
                    )}
                    <Typography className="sp-location-text">
                        <LocationOnOutlinedIcon sx={{ fontSize: 11 }} /> {member.memberAddress ?? 'Seoul, Korea'}
                    </Typography>

                    {/* Stats */}
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 0.75, mb: 1 }}>
                        <Stack direction="row" alignItems="center" gap={0.25}>
                            <FavoriteBorderIcon sx={{ fontSize: 12, color: '#FF4D8D' }} />
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{member.memberLikes}</Typography>
                        </Stack>
                        <Typography sx={{ fontSize: 11, color: '#bbb' }}>·</Typography>
                        {member.memberExperience && (
                            <Typography sx={{ fontSize: 11, color: '#888' }}>💼 {member.memberExperience} yrs</Typography>
                        )}
                    </Stack>

                    {/* Buttons */}
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
                            onClick={() => router.push(`/specialists/${member._id}`)}>
                            {t('Book')} →
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        );
    };

    // ── Filter sidebar ──────────────────────────────────────────────────────────
    const FilterSidebar = () => (
        <Stack className="sp-filter-sidebar">
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="sp-filter-top">
                <Stack direction="row" alignItems="center" gap={1}>
                    <TuneIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
                    <Typography className="sp-filter-main-title">{t('Filters')}</Typography>
                </Stack>
            </Stack>

            {/* Location */}
            <FilterSection title={`📍 ${t('Location')}`}>
                <RadioGroup value={searchFilter.search.memberLocation ?? 'All'}>
                    <FormControlLabel value="All"
                        onClick={() => { const s = { ...searchFilter.search }; delete s.memberLocation; pushFilter({ ...searchFilter, search: s, page: 1 }); }}
                        control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.4 }} />}
                        label={<Typography sx={{ fontSize: 12, color: searchFilter.search.memberLocation ? '#555' : '#FF4D8D', fontWeight: searchFilter.search.memberLocation ? 400 : 600 }}>🇰🇷 {t('All Korea')}</Typography>}
                    />
                    {LOCATIONS.map((loc) => (
                        <FormControlLabel key={loc} value={loc}
                            onClick={() => locationHandler(loc)}
                            control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.4 }} />}
                            label={<Typography sx={{ fontSize: 12, color: searchFilter.search.memberLocation === loc ? '#FF4D8D' : '#555', fontWeight: searchFilter.search.memberLocation === loc ? 600 : 400 }}>{loc}</Typography>}
                        />
                    ))}
                </RadioGroup>
            </FilterSection>

            {/* Specialty */}
            <FilterSection title={`✂️ ${t('Specialty')}`}>
                {SPECIALTIES.map((sp) => {
                    const color = SPECIALTY_COLORS[sp] ?? '#FF4D8D';
                    const checked = (searchFilter.search.memberSpecialty ?? []).includes(sp);
                    return (
                        <Stack key={sp} direction="row" alignItems="center" gap={1} sx={{ mb: 0.5, cursor: 'pointer' }}
                            onClick={() => specialtyHandler(sp)}>
                            <Box component="div" sx={{
                                width: 16, height: 16, borderRadius: 0.5,
                                border: `1.5px solid ${checked ? color : '#ddd'}`,
                                background: checked ? color : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}>
                                {checked && <Typography sx={{ fontSize: 10, color: '#fff', lineHeight: 1 }}>✓</Typography>}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: checked ? color : '#555', fontWeight: checked ? 600 : 400 }}>{sp}</Typography>
                        </Stack>
                    );
                })}
            </FilterSection>

            {/* Rating */}
            <FilterSection title={`⭐ ${t('Minimum Rating')}`}>
                <RadioGroup value={minRating ?? ''}>
                    {RATINGS.map((r) => (
                        <FormControlLabel key={r.value} value={r.value}
                            onClick={() => setMinRating(minRating === r.value ? null : r.value)}
                            control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.4 }} />}
                            label={
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <span key={s} style={{ fontSize: 11, color: s <= Math.floor(r.value) ? '#FFB800' : '#ddd' }}>★</span>
                                    ))}
                                    <Typography sx={{ fontSize: 11, color: '#555' }}>{r.label}</Typography>
                                </Stack>
                            }
                        />
                    ))}
                </RadioGroup>
            </FilterSection>

            {/* Experience */}
            <FilterSection title={`💼 ${t('Experience (Years)')}`}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: '#888' }}>1 year</Typography>
                    <Typography sx={{ fontSize: 11, color: '#888' }}>10+ years</Typography>
                </Stack>
                <Slider value={experience}
                    onChange={(_, val) => setExperience(val as number)}
                    onChangeCommitted={(_, val) => experienceHandler(val as number)}
                    min={1} max={10} step={1} marks
                    sx={{ color: '#FF4D8D', '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-track': { height: 3 }, '& .MuiSlider-rail': { height: 3, opacity: 0.3 } }} />
                <Stack direction="row" justifyContent="space-between">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <Typography key={n} sx={{ fontSize: 9, color: '#bbb' }}>{n}</Typography>
                    ))}
                </Stack>
            </FilterSection>

            {/* Buttons */}
            <Box component="div" sx={{ p: '12px 16px 16px' }}>
                <Button fullWidth className="sp-reset-btn" startIcon={<RefreshIcon />} onClick={resetHandler}>{t('Reset')}</Button>
            </Box>
        </Stack>
    );

    // ── MOBILE ──────────────────────────────────────────────────────────────────
    if (device === 'mobile') {
        return (
            <Stack className="specialists-page mobile">
                {/* Search */}
                <Stack className="sp-mobile-search">
                    <OutlinedInput fullWidth size="small" value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('Search specialists, skills...')}
                        onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /></InputAdornment>}
                        endAdornment={<InputAdornment position="end"><IconButton size="small" onClick={() => setMobileFilterOpen(true)}><TuneIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /></IconButton></InputAdornment>}
                        sx={{ borderRadius: 2.5, fontSize: 13, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}
                    />
                </Stack>

                {/* Chips */}
                <Stack direction="row" gap={1} className="sp-mobile-chips">
                    {SKILL_CHIPS.map((chip) => (
                        <Box key={chip} component="div"
                            onClick={() => chipHandler(chip)}
                            className={`sp-chip ${activeChip === chip ? 'active' : ''}`}>
                            {chip}
                        </Box>
                    ))}
                </Stack>

                {/* Results */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: 12, color: '#888' }}>
                        <Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('specialists')}
                    </Typography>
                    <Select value={activeSort} onChange={(e) => sortHandler(e.target.value)} size="small"
                        sx={{ fontSize: 11, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}>
                        {SORT_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{t(s.label)}</MenuItem>)}
                    </Select>
                </Stack>

                {/* 2-column masonry grid */}
                {specialists.length === 0 ? (
                    <Emptylist emoji="👩‍🎨" title={t('No specialists found')} desc={t('Try changing filters')} />
                ) : (
                    <Box component="div" className="sp-mobile-grid">
                        {specialists.map((member, i) => {
                            const img = member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg';
                            const portfolioImg = member.memberPortfolio?.[0] ? `${REACT_APP_API_URL}/${member.memberPortfolio[0]}` : img;
                            const liked = member.meLiked?.[0]?.myFavorite;
                            const isFollowing = member.meFollowed?.[0]?.myFollowing;
                            const heights = [180, 220, 200, 240, 190, 210];
                            const imgH = heights[i % heights.length];
                            return (
                                <Stack key={member._id} className="sp-mobile-card">
                                    <Box component="div" className="sp-mobile-cover"
                                        style={{ height: imgH, backgroundImage: `url(${portfolioImg})` }}
                                        onClick={() => router.push(`/specialists/${member._id}`)}>
                                        <IconButton className={`sp-like-btn ${liked ? 'liked' : ''}`} size="small"
                                            onClick={(e) => { e.stopPropagation(); likeHandler(member._id); }}>
                                            {liked ? <FavoriteIcon sx={{ fontSize: 13, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 13, color: '#fff' }} />}
                                        </IconButton>
                                    </Box>
                                    {/* Avatar overlap */}
                                    <Box component="div" className="sp-mobile-avatar-wrap">
                                        <img src={img} alt={member.memberNick} className="sp-mobile-avatar" />
                                        <Box component="div" className="sp-online-dot-sm" />
                                    </Box>
                                    <Box component="div" className="sp-mobile-info">
                                        <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center" sx={{ mb: 0.25 }}>
                                            <Typography className="sp-mobile-name" onClick={() => router.push(`/specialists/${member._id}`)}>
                                                {member.memberNick}
                                            </Typography>
                                            <VerifiedIcon sx={{ fontSize: 11, color: '#FF4D8D' }} />
                                        </Stack>
                                        {member.memberSpecialty && member.memberSpecialty.length > 0 && (
                                            <Stack direction="row" gap={0.4} justifyContent="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                                                {member.memberSpecialty.slice(0, 1).map((sp) => (
                                                    <Box key={sp} component="div" className="sp-specialty-chip-sm"
                                                        style={{ color: SPECIALTY_COLORS[sp] ?? '#FF4D8D', background: `${SPECIALTY_COLORS[sp] ?? '#FF4D8D'}15` }}>
                                                        {sp}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                        <Stack direction="row" gap={0.5} justifyContent="center" sx={{ mb: 0.75 }}>
                                            <Typography sx={{ fontSize: 10, color: '#888' }}>❤️ {member.memberLikes}</Typography>
                                            <Typography sx={{ fontSize: 10, color: '#bbb' }}>·</Typography>
                                            <Typography sx={{ fontSize: 10, color: '#888' }}>👁️ {member.memberViews >= 1000 ? `${(member.memberViews / 1000).toFixed(1)}K` : member.memberViews}</Typography>
                                        </Stack>
                                        <Stack direction="row" gap={0.5}>
                                            <Button size="small" fullWidth
                                                className={`sp-follow-btn-sm ${isFollowing ? 'following' : ''}`}
                                                onClick={() => followHandler(member)}>
                                                {isFollowing ? '✓' : '♡'} {isFollowing ? t('Following') : t('Follow')}
                                            </Button>
                                            <Button size="small" fullWidth className="sp-book-btn-sm"
                                                onClick={() => router.push(`/specialists/${member._id}`)}>
                                                {t('Book')}
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Stack>
                            );
                        })}
                    </Box>
                )}

                <Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />

                {/* Bottom bar */}
                <Stack direction="row" className="sp-mobile-bottom">
                    <Button fullWidth startIcon={<TuneIcon />} className="sp-mobile-filter-btn"
                        onClick={() => setMobileFilterOpen(true)}>{t('Filter')}</Button>
                    <Select value={activeSort} onChange={(e) => sortHandler(e.target.value)} size="small" className="sp-mobile-sort">
                        {SORT_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{t(s.label)}</MenuItem>)}
                    </Select>
                </Stack>

                <Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}
                    PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflow: 'auto' } }}>
                    <Box component="div" sx={{ p: 2 }}><FilterSidebar /></Box>
                </Drawer>
            </Stack>
        );
    }

    // ── DESKTOP ─────────────────────────────────────────────────────────────────
    return (
        <Stack className="specialists-page">
            {/* Top bar */}
            <Stack className="sp-top-bar">
                <Stack className="sp-top-inner" direction="row" alignItems="center" gap={2}>
                    <OutlinedInput value={searchText} onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('Search specialists, skills...')}
                        onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /></InputAdornment>}
                        sx={{ flex: 1, borderRadius: 2.5, fontSize: 13, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' }, '&.Mui-focused fieldset': { borderColor: '#FF4D8D' } }}
                    />
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
                        <Select value={searchFilter.search.memberLocation ?? 'All'}
                            onChange={async (e) => {
                                const loc = e.target.value;
                                const s = { ...searchFilter.search };
                                if (loc === 'All') delete s.memberLocation;
                                else s.memberLocation = loc;
                                await pushFilter({ ...searchFilter, search: s, page: 1 });
                            }} size="small"
                            sx={{ minWidth: 130, borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}>
                            <MenuItem value="All">🇰🇷 {t('All Korea')}</MenuItem>
                            {LOCATIONS.map((loc) => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
                        </Select>
                    </Stack>
                    <Button className="sp-find-btn" onClick={searchHandler}>{t('Find Now')}</Button>
                </Stack>

                {/* Skill chips */}
                <Stack direction="row" gap={1} className="sp-chips-bar">
                    {SKILL_CHIPS.map((chip) => (
                        <Box key={chip} component="div"
                            onClick={() => chipHandler(chip)}
                            className={`sp-chip ${activeChip === chip ? 'active' : ''}`}>
                            {chip}
                        </Box>
                    ))}
                </Stack>
            </Stack>

            {/* Main */}
            <Stack direction="row" className="sp-main">
                <Box component="div" className="sp-sidebar"><FilterSidebar /></Box>

                <Stack className="sp-content">
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
                        <Emptylist emoji="👩‍🎨" title={t('No specialists found')} desc={t('Try adjusting your filters')} buttonText="Clear filters" buttonHref="/specialists" />
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