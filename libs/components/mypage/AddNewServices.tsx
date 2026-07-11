import React, { useRef, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Button, Select, MenuItem, IconButton } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_SERVICE, UPDATE_SERVICE } from '../../../apollo/user/mutation';
import { GET_SERVICE } from '../../../apollo/user/query';
import { ServiceInput } from '../../types/service/service.input';
import { ServiceType } from '../../enums/service.enum';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

const imgUrl = (raw?: string): string => {
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const AddNewService: NextPage = ({ initialValues, ...props }: any) => {
    const router = useRouter();
    const { t } = useTranslation('common');
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

    const [insertServiceData, setInsertServiceData] = useState<ServiceInput>(initialValues || DEFAULT_VALUES);

    /** APOLLO REQUESTS **/
    const [createService] = useMutation(CREATE_SERVICE);
    const [updateService] = useMutation(UPDATE_SERVICE);

    useQuery(GET_SERVICE, {
        fetchPolicy: 'network-only',
        variables: { input: serviceId },
        skip: !isEditMode,
        onCompleted: (data) => {
            const svc = data?.getService;
            if (!svc) return;
            setInsertServiceData({
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
            const existing = insertServiceData.serviceImages?.length ?? 0;
            if (existing + files.length > 5) throw new Error('Cannot upload more than 5 images!');

            const formData = new FormData();
            const fileVars: any[] = new Array(files.length).fill(null);
            formData.append(
                'operations',
                JSON.stringify({
                    query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
						imagesUploader(files: $files, target: $target)
					}`,
                    variables: { files: fileVars, target: 'service' },
                }),
            );
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
            setInsertServiceData((prev) => ({
                ...prev,
                serviceImages: [...(prev.serviceImages ?? []), ...responseImages],
            }));
        } catch (err: any) {
            console.log('Error, uploadImagesHandler:', err.message);
            sweetMixinErrorAlert(err.message).then();
        }
    };

    const removeImageHandler = (index: number) => {
        setInsertServiceData((prev) => ({
            ...prev,
            serviceImages: (prev.serviceImages ?? []).filter((_, i) => i !== index),
        }));
    };

    const doDisabledCheck = () => {
        return (
            insertServiceData.serviceTitle === '' ||
            !insertServiceData.servicePrice ||
            !insertServiceData.serviceDuration ||
            (insertServiceData.serviceImages?.length ?? 0) === 0
        );
    };

    const insertServiceHandler = async () => {
        try {
            await createService({ variables: { input: insertServiceData } });
            await sweetMixinSuccessAlert('This service has been created successfully.');
            await router.push({ pathname: '/mypage', query: { category: 'myServices', salonId, salonTitle } });
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    const updateServiceHandler = async () => {
        try {
            await updateService({
                variables: {
                    input: {
                        _id: serviceId,
                        serviceType: insertServiceData.serviceType,
                        serviceTitle: insertServiceData.serviceTitle,
                        serviceDesc: insertServiceData.serviceDesc,
                        servicePrice: insertServiceData.servicePrice,
                        serviceDuration: insertServiceData.serviceDuration,
                        serviceImages: insertServiceData.serviceImages,
                    },
                },
            });
            await sweetMixinSuccessAlert('This service has been updated successfully.');
            await router.push({ pathname: '/mypage', query: { category: 'myServices', salonId, salonTitle } });
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    return (
        <Box component="div" className="mypage-content">
            <Typography className="content-title">{t(isEditMode ? 'Edit Service' : 'Add New Service')}</Typography>
            <Typography className="content-subtitle">
                {salonTitle ? `${t('For salon')}: ${salonTitle}` : t('Fill in the details of your service')}
            </Typography>

            <Box component="div" className="service-form-card">
                <Stack className="form-group full">
                    <Typography className="form-label">{t('Service Name')}</Typography>
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('e.g. Premium Cut & Style')}
                        value={insertServiceData.serviceTitle}
                        onChange={(e) => setInsertServiceData({ ...insertServiceData, serviceTitle: e.target.value })}
                    />
                </Stack>

                <Stack direction="row" gap={2.5} className="form-row">
                    <Stack className="form-group">
                        <Typography className="form-label">{t('Service Type')}</Typography>
                        <Select
                            fullWidth
                            className="form-select"
                            value={insertServiceData.serviceType}
                            onChange={(e) => setInsertServiceData({ ...insertServiceData, serviceType: e.target.value as ServiceType })}
                        >
                            {Object.values(ServiceType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {TYPE_EMOJI[type]} {t(type)}
                                </MenuItem>
                            ))}
                        </Select>
                    </Stack>
                    <Stack className="form-group">
                        <Typography className="form-label">{t('Duration (minutes)')}</Typography>
                        <input
                            type="number"
                            className="form-input"
                            value={insertServiceData.serviceDuration}
                            onChange={(e) =>
                                setInsertServiceData({ ...insertServiceData, serviceDuration: parseInt(e.target.value) || 0 })
                            }
                        />
                    </Stack>
                </Stack>

                <Stack className="form-group full">
                    <Typography className="form-label">{t('Price (₩)')}</Typography>
                    <input
                        type="number"
                        className="form-input"
                        value={insertServiceData.servicePrice}
                        onChange={(e) => setInsertServiceData({ ...insertServiceData, servicePrice: parseInt(e.target.value) || 0 })}
                    />
                </Stack>

                <Stack className="form-group full">
                    <Typography className="form-label">{t('Description')}</Typography>
                    <textarea
                        className="form-textarea"
                        placeholder={t('Describe what this service includes...')}
                        value={insertServiceData.serviceDesc}
                        onChange={(e) => setInsertServiceData({ ...insertServiceData, serviceDesc: e.target.value })}
                    />
                </Stack>

                <Box component="div" className="section-divider" />

                <Typography className="form-label" sx={{ mb: 1 }}>{t('Photos')}</Typography>
                <Box component="div" className="upload-dropzone" onClick={() => inputRef.current?.click()}>
                    <CloudUploadOutlinedIcon sx={{ fontSize: 44, color: '#FF4D8D' }} />
                    <Typography className="dropzone-title">{t('Drag and drop images here')}</Typography>
                    <Button className="browse-files-btn">{t('Browse Files')}</Button>
                    <input
                        ref={inputRef}
                        type="file"
                        hidden
                        multiple
                        accept="image/jpg, image/jpeg, image/png"
                        onChange={uploadImagesHandler}
                    />
                </Box>

                {(insertServiceData.serviceImages?.length ?? 0) > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={1.5} className="uploaded-images-row">
                        {insertServiceData.serviceImages?.map((img, idx) => (
                            <Box component="div" key={idx} className="uploaded-thumb">
                                <img src={imgUrl(img)} alt="" />
                                <IconButton className="thumb-remove-btn" onClick={() => removeImageHandler(idx)}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        ))}
                    </Stack>
                )}

                <Stack direction="row" justifyContent="flex-end" className="form-submit-row">
                    {isEditMode ? (
                        <Button className="save-salon-btn" disabled={doDisabledCheck()} onClick={updateServiceHandler}>
                            {t('Update Service')}
                        </Button>
                    ) : (
                        <Button className="save-salon-btn" disabled={doDisabledCheck()} onClick={insertServiceHandler}>
                            {t('Save Service')}
                        </Button>
                    )}
                </Stack>
            </Box>
        </Box>
    );
};

export default AddNewService;