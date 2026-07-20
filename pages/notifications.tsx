import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import MobileNotifications from '../libs/components/notification/MobileNotifications';
import DesktopNotifications from '../libs/components/notification/DesktopNotifications';

const NotificationsPage: NextPage = () => {
    const device = useDeviceDetect();

    if (device === 'mobile') {
        return <MobileNotifications />;
    }

    return <DesktopNotifications />;
};

export default withLayoutBasic(NotificationsPage);