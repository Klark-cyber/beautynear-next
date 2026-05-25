import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false }); //TuiEditorni dynamic import qilamiz

/**
 * TuiEditor - oddiy <textarea> emas, Word ga uxshash formatlash imkoniyatlari bor editor.
 * dynamic() - kerak bo'lganda yuklanadi (lazy) va sahifa tezroq yuklanadi. Oddiy yuklashda esa bu darhol yuklanardi.
 * ssr: false → faqat browserda yuklanadi.
 */

const WriteArticle: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <>ARTICLE PAGE MOBILE</>;
	} else
		return (
			<div id="write-article-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Write an Article</Typography>
						<Typography className="sub-title">Feel free to write your ideas!</Typography>
					</Stack>
				</Stack>
				<TuiEditor />
			</div>
		);
};

export default WriteArticle;
