import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, OutlinedInput, IconButton } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_SALON, UPDATE_SALON } from '../../../apollo/user/mutation';
import { GET_SALON } from '../../../apollo/user/query';
import { SalonInput } from '../../types/salon/salon.input';
import { SalonType, SalonLocation } from '../../enums/salon.enum';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const TYPE_OPTIONS = Object.values(SalonType);
const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};
const LOCATION_OPTIONS = Object.values(SalonLocation);

const DEFAULT_VALUES: SalonInput = {
    salonTitle: '',
    salonType: SalonType.HAIR,
    salonLocation: SalonLocation.SEOUL,
    salonAddress: '',
    salonPhone: '',
    salonWorkHours: '',
    salonInstagram: '',
    salonDesc: '',
    salonImages: [],
};

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: Desktop AddNewSalon.tsx bilan bir xil query/handler
// mantiqidan foydalanadi (CREATE_SALON/UPDATE_SALON, imagesUploader
// target:'salon' naqshi) — faqat butunlay yangi, mobilga moslashtirilgan UI.
// Rasm o'lchami endi to'liq mobil ekranga mos (avval desktop hajmida edi).

const MobileAddNewSalon = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const token = getJwtToken();
    const inputRef = useRef<HTMLInputElement>(null);

    const salonId = router.query.salonId as string | undefined;
    const isEditMode = Boolean(salonId);

    const [data, setData] = useState<SalonInput>(DEFAULT_VALUES);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [createSalon] = useMutation(CREATE_SALON);
    const [updateSalon] = useMutation(UPDATE_SALON);

    useQuery(GET_SALON, {
        fetchPolicy: 'network-only',
        variables: { input: salonId },
        skip: !isEditMode,
        onCompleted: (result: T) => {
            const s = result?.getSalon;
            if (!s) return;
            setData({
                salonTitle: s.salonTitle ?? '',
                salonType: s.salonType ?? SalonType.HAIR,
                salonLocation: s.salonLocation ?? SalonLocation.SEOUL,
                salonAddress: s.salonAddress ?? '',
                salonPhone: s.salonPhone ?? '',
                salonWorkHours: s.salonWorkHours ?? '',
                salonInstagram: s.salonInstagram ?? '',
                salonDesc: s.salonDesc ?? '',
                salonImages: s.salonImages ?? [],
            });
        },
    });

    /** HANDLERS **/
    const uploadImagesHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const existing = data.salonImages?.length ?? 0;
            if (existing + files.length > 5) throw new Error('Cannot upload more than 5 images!');
            setUploading(true);

            const formData = new FormData();
            const fileVars: any[] = new Array(files.length).fill(null);
            formData.append('operations', JSON.stringify({
                query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
					imagesUploader(files: $files, target: $target)
				}`,
                variables: { files: fileVars, target: 'salon' },
            }));
            const map: Record<string, string[]> = {};
            for (let i = 0; i < files.length; i++) map[i] = [`variables.files.${i}`];
            formData.append('map', JSON.stringify(map));
            for (let i = 0; i < files.length; i++) formData.append(`${i}`, files[i]);

            const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'apollo-require-preflight': true,
                    Authorization: `Bearer ${token}`,
                },
            });

            const responseImages: string[] = response.data.data.imagesUploader;
            setData((prev) => ({ ...prev, salonImages: [...(prev.salonImages ?? []), ...responseImages] }));
        } catch (err: any) {
            console.log('Error, uploadImagesHandler:', err.message);
            sweetMixinErrorAlert(err.message).then();
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx: number) => {
        setData((prev) => ({ ...prev, salonImages: (prev.salonImages ?? []).filter((_, i) => i !== idx) }));
    };

    const canSubmit = () => {
        return (
            data.salonTitle.trim() !== '' &&
            data.salonAddress.trim() !== '' &&
            data.salonPhone.trim() !== '' &&
            data.salonWorkHours.trim() !== '' &&
            (data.salonImages?.length ?? 0) > 0 &&
            !submitting &&
            !uploading
        );
    };

    const submitHandler = async () => {
        if (!canSubmit()) return;
        setSubmitting(true);
        try {
            if (isEditMode) {
                await updateSalon({ variables: { input: { _id: salonId, ...data } } });
                await sweetMixinSuccessAlert(t('This salon has been updated successfully.'));
            } else {
                await createSalon({ variables: { input: data } });
                await sweetMixinSuccessAlert(t('This salon has been created successfully.'));
            }
            router.push({ pathname: '/mypage', query: { category: 'mySalons' } });
        } catch (err: any) {
            sweetErrorHandling(err).then();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box component="div" id="mobile-addsalon">
            <Box component="div" className={`as-submit-btn ${!canSubmit() ? 'disabled' : ''}`} onClick={submitHandler}>
                {submitting ? t('Saving...') : t(isEditMode ? 'Update Salon' : 'Create Salon')}
            </Box>

            {/* ═══ RASMLAR ═══ */}
            <Box component="div" className="as-section">
                <Typography className="as-section-title">📷 {t('Photos')}</Typography>
                <Typography className="as-label" sx={{ mt: '0 !important' }}>({(data.salonImages ?? []).length}/5)</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.25} className="as-images-row">
                    {(data.salonImages ?? []).map((img, idx) => (
                        <Box component="div" key={idx} className="as-image-thumb">
                            <img src={imgUrl(img)} alt="" />
                            <IconButton className="as-image-remove" onClick={() => removeImage(idx)}>
                                <CloseIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                        </Box>
                    ))}
                    {(data.salonImages?.length ?? 0) < 5 && (
                        <Box component="div" className="as-image-add" onClick={() => inputRef.current?.click()}>
                            {uploading ? (
                                <Typography className="as-uploading-text">{t('Uploading...')}</Typography>
                            ) : (
                                <AddPhotoAlternateIcon sx={{ fontSize: 24, color: '#FF4D8D' }} />
                            )}
                        </Box>
                    )}
                    <input ref={inputRef} type="file" hidden multiple accept="image/jpg, image/jpeg, image/png" onChange={uploadImagesHandler} />
                </Stack>
            </Box>

            {/* ═══ ASOSIY MA'LUMOT ═══ */}
            <Box component="div" className="as-section">
                <Typography className="as-section-title">🏪 {t('Basic Info')}</Typography>

                <Typography className="as-label">{t('Salon Name')}</Typography>
                <OutlinedInput
                    fullWidth
                    className="as-input"
                    placeholder={t('e.g. Glow Hair Studio')}
                    value={data.salonTitle}
                    onChange={(e) => setData({ ...data, salonTitle: e.target.value })}
                />

                <Typography className="as-label">{t('Category')}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} className="as-type-row">
                    {TYPE_OPTIONS.map((opt) => (
                        <Box
                            key={opt}
                            component="div"
                            className={`as-type-chip ${data.salonType === opt ? 'active' : ''}`}
                            onClick={() => setData({ ...data, salonType: opt })}
                        >
                            {TYPE_EMOJI[opt]} {t(opt)}
                        </Box>
                    ))}
                </Stack>
            </Box>

            {/* ═══ MANZIL ═══ */}
            <Box component="div" className="as-section">
                <Typography className="as-section-title">📍 {t('Location')}</Typography>

                <Typography className="as-label">{t('City')}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} className="as-type-row">
                    {LOCATION_OPTIONS.map((opt) => (
                        <Box
                            key={opt}
                            component="div"
                            className={`as-type-chip ${data.salonLocation === opt ? 'active' : ''}`}
                            onClick={() => setData({ ...data, salonLocation: opt })}
                        >
                            {t(opt)}
                        </Box>
                    ))}
                </Stack>

                <Typography className="as-label">{t('Address')}</Typography>
                <OutlinedInput
                    fullWidth
                    className="as-input"
                    placeholder={t('Full street address')}
                    value={data.salonAddress}
                    onChange={(e) => setData({ ...data, salonAddress: e.target.value })}
                />
            </Box>

            {/* ═══ ALOQA ═══ */}
            <Box component="div" className="as-section">
                <Typography className="as-section-title">📞 {t('Contact')}</Typography>

                <Stack direction="row" gap={1.25}>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="as-label">{t('Phone')}</Typography>
                        <OutlinedInput
                            fullWidth
                            className="as-input"
                            placeholder="010-1234-5678"
                            value={data.salonPhone}
                            onChange={(e) => setData({ ...data, salonPhone: e.target.value })}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="as-label">{t('Work Hours')}</Typography>
                        <OutlinedInput
                            fullWidth
                            className="as-input"
                            placeholder="09:00 - 20:00"
                            value={data.salonWorkHours}
                            onChange={(e) => setData({ ...data, salonWorkHours: e.target.value })}
                        />
                    </Box>
                </Stack>

                <Typography className="as-label">{t('Instagram')} ({t('optional')})</Typography>
                <OutlinedInput
                    fullWidth
                    className="as-input"
                    placeholder="@your_salon"
                    value={data.salonInstagram}
                    onChange={(e) => setData({ ...data, salonInstagram: e.target.value })}
                />
            </Box>

            {/* ═══ TAVSIF ═══ */}
            <Box component="div" className="as-section">
                <Typography className="as-section-title">📝 {t('Description')}</Typography>
                <textarea
                    className="as-textarea"
                    value={data.salonDesc}
                    maxLength={500}
                    onChange={(e) => setData({ ...data, salonDesc: e.target.value })}
                    rows={4}
                    placeholder={t('Describe your salon...')}
                />
                <Typography className="as-char-count">{(data.salonDesc ?? '').length}/500</Typography>
            </Box>
        </Box>
    );
};

export default MobileAddNewSalon; 