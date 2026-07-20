import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, OutlinedInput, IconButton } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_SERVICE, UPDATE_SERVICE } from '../../../apollo/user/mutation';
import { GET_SERVICE } from '../../../apollo/user/query';
import { ServiceInput } from '../../types/service/service.input';
import { ServiceType } from '../../enums/service.enum';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const TYPE_OPTIONS = Object.values(ServiceType);
const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: Desktop AddNewServices.tsx bilan bir xil query/handler
// mantiqidan foydalanadi (CREATE_SERVICE/UPDATE_SERVICE, imagesUploader
// naqshi) — faqat butunlay yangi, mobilga moslashtirilgan UI.
// Eslatma: avvalgi desktop rasm ko'rinishi mobilda "desktop hajmida
// katta" ko'rinar edi — bu yerda rasm to'liq CSS bilan mobilga moslangan.

const MobileAddNewService = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const token = getJwtToken();
    const inputRef = useRef<HTMLInputElement>(null);

    const { salonId, salonTitle, serviceId } = router.query;
    const isEditMode = Boolean(serviceId);

    const DEFAULT_VALUES: ServiceInput = {
        serviceType: ServiceType.HAIR,
        serviceTitle: '',
        serviceDesc: '',
        servicePrice: 0,
        serviceDuration: 30,
        serviceImages: [],
        salonId: (salonId as string) || '',
    };

    const [data, setData] = useState<ServiceInput>(DEFAULT_VALUES);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [createService] = useMutation(CREATE_SERVICE);
    const [updateService] = useMutation(UPDATE_SERVICE);

    useQuery(GET_SERVICE, {
        fetchPolicy: 'network-only',
        variables: { input: serviceId },
        skip: !isEditMode,
        onCompleted: (result: T) => {
            const svc = result?.getService;
            if (!svc) return;
            setData({
                serviceType: svc.serviceType ?? ServiceType.HAIR,
                serviceTitle: svc.serviceTitle ?? '',
                serviceDesc: svc.serviceDesc ?? '',
                servicePrice: svc.servicePrice ?? 0,
                serviceDuration: svc.serviceDuration ?? 30,
                serviceImages: svc.serviceImages ?? [],
                salonId: svc.salonId ?? (salonId as string) ?? '',
            });
        },
    });

    /** HANDLERS **/
    const uploadImagesHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const existing = data.serviceImages?.length ?? 0;
            if (existing + files.length > 5) throw new Error('Cannot upload more than 5 images!');
            setUploading(true);

            const formData = new FormData();
            const fileVars: any[] = new Array(files.length).fill(null);
            formData.append('operations', JSON.stringify({
                query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
					imagesUploader(files: $files, target: $target)
				}`,
                variables: { files: fileVars, target: 'service' },
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
            setData((prev) => ({ ...prev, serviceImages: [...(prev.serviceImages ?? []), ...responseImages] }));
        } catch (err: any) {
            console.log('Error, uploadImagesHandler:', err.message);
            sweetMixinErrorAlert(err.message).then();
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx: number) => {
        setData((prev) => ({ ...prev, serviceImages: (prev.serviceImages ?? []).filter((_, i) => i !== idx) }));
    };

    const canSubmit = () => {
        return (
            data.serviceTitle.trim() !== '' &&
            Boolean(data.servicePrice) &&
            Boolean(data.serviceDuration) &&
            (data.serviceImages?.length ?? 0) > 0 &&
            !submitting &&
            !uploading
        );
    };

    const submitHandler = async () => {
        if (!canSubmit()) return;
        setSubmitting(true);
        try {
            if (isEditMode) {
                await updateService({
                    variables: {
                        input: {
                            _id: serviceId,
                            serviceType: data.serviceType,
                            serviceTitle: data.serviceTitle,
                            serviceDesc: data.serviceDesc,
                            servicePrice: data.servicePrice,
                            serviceDuration: data.serviceDuration,
                            serviceImages: data.serviceImages,
                        },
                    },
                });
                await sweetMixinSuccessAlert(t('This service has been updated successfully.'));
            } else {
                await createService({ variables: { input: data } });
                await sweetMixinSuccessAlert(t('This service has been created successfully.'));
            }
            router.push({ pathname: '/mypage', query: { category: 'myServices', salonId, salonTitle } });
        } catch (err: any) {
            sweetErrorHandling(err).then();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box component="div" id="mobile-addservice">
            <Box component="div" className={`as-submit-btn ${!canSubmit() ? 'disabled' : ''}`} onClick={submitHandler}>
                {submitting ? t('Saving...') : t(isEditMode ? 'Update Service' : 'Create Service')}
            </Box>

            {/* ═══ RASMLAR ═══ */}
            <Typography className="as-label">{t('Photos')} ({(data.serviceImages ?? []).length}/5)</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.25} className="as-images-row">
                {(data.serviceImages ?? []).map((img, idx) => (
                    <Box component="div" key={idx} className="as-image-thumb">
                        <img src={imgUrl(img)} alt="" />
                        <IconButton className="as-image-remove" onClick={() => removeImage(idx)}>
                            <CloseIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                    </Box>
                ))}
                {(data.serviceImages?.length ?? 0) < 5 && (
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

            {/* ═══ NOMI ═══ */}
            <Typography className="as-label">{t('Service Name')}</Typography>
            <OutlinedInput
                fullWidth
                className="as-input"
                placeholder={t('e.g. Hair Cut + Styling')}
                value={data.serviceTitle}
                onChange={(e) => setData({ ...data, serviceTitle: e.target.value })}
            />

            {/* ═══ TURI ═══ */}
            <Typography className="as-label">{t('Category')}</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} className="as-type-row">
                {TYPE_OPTIONS.map((opt) => (
                    <Box
                        key={opt}
                        component="div"
                        className={`as-type-chip ${data.serviceType === opt ? 'active' : ''}`}
                        onClick={() => setData({ ...data, serviceType: opt })}
                    >
                        {TYPE_EMOJI[opt]} {t(opt)}
                    </Box>
                ))}
            </Stack>

            {/* ═══ NARX + DAVOMIYLIK ═══ */}
            <Stack direction="row" gap={1.25}>
                <Box sx={{ flex: 1 }}>
                    <Typography className="as-label">{t('Price (₩)')}</Typography>
                    <OutlinedInput
                        fullWidth
                        type="number"
                        className="as-input"
                        value={data.servicePrice === 0 ? '' : data.servicePrice}
                        onFocus={(e: any) => e.target.select()}
                        onChange={(e) => setData({ ...data, servicePrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography className="as-label">{t('Duration (min)')}</Typography>
                    <OutlinedInput
                        fullWidth
                        type="number"
                        className="as-input"
                        value={data.serviceDuration === 0 ? '' : data.serviceDuration}
                        onFocus={(e: any) => e.target.select()}
                        onChange={(e) => setData({ ...data, serviceDuration: e.target.value === '' ? 0 : Number(e.target.value) })}
                    />
                </Box>
            </Stack>

            {/* ═══ TAVSIF ═══ */}
            <Typography className="as-label">{t('Description')}</Typography>
            <textarea
                className="as-textarea"
                value={data.serviceDesc}
                maxLength={500}
                onChange={(e) => setData({ ...data, serviceDesc: e.target.value })}
                rows={4}
                placeholder={t('Describe this service...')}
            />
            <Typography className="as-char-count">{(data.serviceDesc ?? '').length}/500</Typography>
        </Box>
    );
};

export default MobileAddNewService;