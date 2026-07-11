import { NextPage } from 'next';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import CategoryChips from '../libs/components/homepage/Categorychips';
import NearbySalons from '../libs/components/homepage/Nearbysalons';
import HowItWorks from '../libs/components/homepage/Howitworks';
import FeaturedClinics from '../libs/components/homepage/Featuredclinics';
import AdReel from '../libs/components/homepage/Adreel';
import TrendingServices from '../libs/components/homepage/Trendingservices';
import PopularSalons from '../libs/components/homepage/Popularsalons';
import EventsCommunity from '../libs/components/homepage/EventsCommunity';
import NewsletterBanner from '../libs/components/homepage/Newsletterbanner';
import AppDownload from '../libs/components/homepage/Appdownload';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return (
			<Stack className="home-page">
				<CategoryChips />
				<TrendingServices />
				<PopularSalons />
				<FeaturedClinics />
				<AdReel />
				<EventsCommunity />
			</Stack>
		);
	}

	return (
		<Stack className="home-page">
			<CategoryChips />
			<NearbySalons />
			<HowItWorks />
			<FeaturedClinics />
			<AdReel />
			<TrendingServices />
			<PopularSalons />
			<EventsCommunity />
			<AppDownload />
			<NewsletterBanner />
		</Stack>
	);
};

export default withLayoutMain(Home);