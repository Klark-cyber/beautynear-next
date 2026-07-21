import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider, useReactiveVar } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import Head from 'next/head';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';
import { ChatProvider } from '../libs/context/ChatContext';
import { userVar } from '../apollo/store';
import Chat from '../libs/components/Chat';

const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);
	const user = useReactiveVar(userVar);

	return (
		<ApolloProvider client={client}>
			{/* ⚠️ TUZATILDI: viewport meta tegi endi FAQAT shu yerda — bitta
			    joyda. Avval xuddi shu teg 3 xil joyda (uchtasi ham bir-
			    biridan farqli content bilan) takrorlangan edi:
			    _document.tsx, LayoutBasic.tsx va LayoutFull.tsx. Next.js
			    buni aniq ogohlantiradi ("viewport meta tags should not be
			    used in _document.js's <Head>") — sababi _document.js faqat
			    serverda bir marta render qilinadigan HTML "qobiq" bo'lib,
			    sahifadan-sahifaga o'tishda ishtirok etmaydi. _app.tsx esa
			    har bir sahifa bilan birga qayta render bo'ladi — shuning
			    uchun to'g'ri joy shu yerdir. */}
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
			</Head>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<ChatProvider>
					<Component {...pageProps} />
					{/* ⚠️ TUZATILDI: avval <Chat/> har bir sahifaning Layout'i
					    (LayoutBasic/LayoutFull/LayoutHome) ICHIDA joylashgan edi —
					    demak har sahifaga o'tishda qayta mount bo'lardi va uning
					    WebSocket ulanishi har safar uzilib qayta ochilardi. Bu —
					    real vaqtli xabar/bildirishnoma yetkazib berilmasligining
					    (faqat sahifa yangilansa ishlashining) tub sababi edi. Endi
					    _app.tsx darajasida — sahifadan sahifaga o'tishda QAYTA
					    MOUNT BO'LMAYDIGAN yagona joyda — BIR MARTA render qilinadi. */}
					{user?._id && <Chat />}
				</ChatProvider>
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);