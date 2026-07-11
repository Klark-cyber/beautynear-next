import React, { useCallback, useState } from 'react';
import { Stack, Box, Button, Select, MenuItem, InputBase } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { SalonLocation, SalonType } from '../../enums/salon.enum';
import { SalonsInquiry } from '../../types/salon/salon.input';
import { Direction } from '../../enums/common.enum';

interface HeaderFilterProps {
    initialInput: SalonsInquiry;
}

const HeaderFilter = (props: HeaderFilterProps) => {
    const { initialInput } = props;
    const device = useDeviceDetect();
    const { t } = useTranslation('common');
    const router = useRouter();

    const [searchFilter, setSearchFilter] = useState<SalonsInquiry>(initialInput);
    const [location, setLocation] = useState<string>('ALL');
    const [district, setDistrict] = useState<string>('');
    const [category, setCategory] = useState<string>('ALL');

    /** HANDLERS **/
    const locationSelectHandler = useCallback((value: string) => {
        setLocation(value);
        if (value !== 'ALL') {
            setSearchFilter((prev) => ({
                ...prev,
                search: { ...prev.search, locationList: [value as SalonLocation] },
            }));
        } else {
            setSearchFilter((prev) => {
                const next = { ...prev, search: { ...prev.search } };
                delete next.search.locationList;
                return next;
            });
        }
    }, []);

    const districtChangeHandler = useCallback((value: string) => {
        setDistrict(value);
        setSearchFilter((prev) => ({
            ...prev,
            search: { ...prev.search, text: value },
        }));
    }, []);

    const categorySelectHandler = useCallback((value: string) => {
        setCategory(value);
        if (value !== 'ALL') {
            setSearchFilter((prev) => ({
                ...prev,
                search: { ...prev.search, typeList: [value as SalonType] },
            }));
        } else {
            setSearchFilter((prev) => {
                const next = { ...prev, search: { ...prev.search } };
                delete next.search.typeList;
                return next;
            });
        }
    }, []);

    const pushSearchHandler = useCallback(async () => {
        try {
            const input = { ...searchFilter, search: { ...searchFilter.search } };
            if (!input.search?.text) delete input.search.text;
            if (input.search?.locationList?.length === 0) delete input.search.locationList;
            if (input.search?.typeList?.length === 0) delete input.search.typeList;

            await router.push(`/salons?input=${JSON.stringify(input)}`, `/salons?input=${JSON.stringify(input)}`);
        } catch (err: any) {
            console.log('ERROR, pushSearchHandler:', err);
        }
    }, [searchFilter]);

    if (device === 'mobile') {
        return (
            <Button className="hero-find-mobile" onClick={pushSearchHandler}>
                {t('Find Now')}
            </Button>
        );
    }

    return (
        <Stack className="hero-search-panel" direction="row" alignItems="center">
            {/* Location */}
            <Stack direction="row" alignItems="center" gap={1} className="search-field">
                <LocationOnOutlinedIcon className="sf-icon" />
                <Select
                    value={location}
                    onChange={(e) => locationSelectHandler(e.target.value)}
                    variant="standard"
                    disableUnderline
                    className="sf-select"
                >
                    <MenuItem value="ALL" sx={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                        {t('Seoul, South Korea')}
                    </MenuItem>
                    {Object.values(SalonLocation).map((loc) => (
                        <MenuItem key={loc} value={loc} sx={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                            {loc}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>

            <Box component="div" className="search-sep" />

            {/* District */}
            <Stack direction="row" alignItems="center" gap={1} className="search-field">
                <LocationOnOutlinedIcon className="sf-icon" />
                <InputBase
                    value={district}
                    onChange={(e) => districtChangeHandler(e.target.value)}
                    placeholder="Gangnam-gu, Apgujeong"
                    className="sf-input"
                />
                <KeyboardArrowDownIcon className="sf-arrow" />
            </Stack>

            <Box component="div" className="search-sep" />

            {/* Category */}
            <Stack direction="row" alignItems="center" gap={1} className="search-field">
                <GridViewOutlinedIcon className="sf-icon" />
                <Select
                    value={category}
                    onChange={(e) => categorySelectHandler(e.target.value)}
                    variant="standard"
                    disableUnderline
                    className="sf-select"
                >
                    <MenuItem value="ALL" sx={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                        {t('All Categories')}
                    </MenuItem>
                    {Object.values(SalonType).map((type) => (
                        <MenuItem key={type} value={type} sx={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                            {type}
                        </MenuItem>
                    ))}
                </Select>
                <KeyboardArrowDownIcon className="sf-arrow" />
            </Stack>

            {/* CTA */}
            <Button className="hero-find-btn" onClick={pushSearchHandler}>
                {t('Find Now')}
            </Button>
        </Stack>
    );
};

HeaderFilter.defaultProps = {
    initialInput: {
        page: 1,
        limit: 9,
        sort: 'createdAt',
        direction: 'DESC',
        search: {},
    },
};

export default HeaderFilter;