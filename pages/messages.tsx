import React from 'react';
import { NextPage } from 'next';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import MessagesPage from '../libs/components/message/MessagesPage';

const Messages: NextPage = () => {
    return <MessagesPage />;
};

export default withLayoutBasic(Messages);